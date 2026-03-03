"use client";

import { useEffect, useRef, useState } from "react";
import { mapGeoJson } from "../data/geojson";
import { VEGETATION_LOCAL_STYLE } from "../estilos mapa/vegetacion y caminos";
import { getIsocroneFromMapbox, type MapboxProfile } from "./isocrone";
import { getGoogleMapsScriptSrc } from "../library/googleMapsScript";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_LOAD_COST_USD = Number(process.env.NEXT_PUBLIC_MAP_LOAD_COST_USD ?? "0.007");

type DrawMode = "circle" | "polygon" | "polyline" | null;
type InteractionMode = "measure" | "iso" | null;
type IsoContourSelection = "10" | "20" | "30" | "40" | "50" | "interval-15";
type IsoMetersSelection = "1000" | "5000" | "20000" | "interval-10000";
type IsoContourUnit = "minutes" | "meters";

type LatLngLiteral = { lat: number; lng: number };

const CENTER_ZONE_10: LatLngLiteral = { lat: 14.5887, lng: -90.5054 };
const GUATEMALA_BOUNDS = {
  north: 17.82,
  south: 13.74,
  west: -92.23,
  east: -88.22,
};

function toLatLngPathsFromGeometry(geometry: any): LatLngLiteral[][] {
  if (!geometry?.type || !geometry?.coordinates) return [];

  const mapRingToPath = (ring: any): LatLngLiteral[] =>
    Array.isArray(ring)
      ? ring
          .map((pair: any) => {
            if (!Array.isArray(pair) || pair.length < 2) return null;
            const lng = Number(pair[0]);
            const lat = Number(pair[1]);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return { lat, lng };
          })
          .filter(Boolean) as LatLngLiteral[]
      : [];

  if (geometry.type === "Polygon") {
    const outerRing = geometry.coordinates[0];
    const path = mapRingToPath(outerRing);
    return path.length >= 3 ? [path] : [];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((polygon: any) => mapRingToPath(polygon?.[0]))
      .filter((path: LatLngLiteral[]) => path.length >= 3);
  }

  return [];
}

export function Circle() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const shapesRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);
  const clickPointsRef = useRef<any[]>([]);
  const tempPointMarkersRef = useRef<any[]>([]);
  const measureLineRef = useRef<any>(null);
  const isoMarkerRef = useRef<any>(null);
  const isoPolygonsRef = useRef<any[]>([]);
  const interactionModeRef = useRef<InteractionMode>(null);
  const pickingIsoPointRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [mapType, setMapType] = useState("roadmap");
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(null);
  const [mapLoadCount, setMapLoadCount] = useState(0);
  const hasCountedLoadRef = useRef(false);
  const [measureResult, setMeasureResult] = useState<string>("");
  const [isoResult, setIsoResult] = useState<string>("");
  const [isoProfile, setIsoProfile] = useState<MapboxProfile | "">("");
  const [isoMinutes, setIsoMinutes] = useState(10);
  const [isoContourSelection, setIsoContourSelection] = useState<IsoContourSelection>("10");
  const [isoMeters, setIsoMeters] = useState(1000);
  const [isoMetersSelection, setIsoMetersSelection] = useState<IsoMetersSelection>("1000");
  const [isoContourUnit, setIsoContourUnit] = useState<IsoContourUnit>("minutes");
  const [isoLatitude, setIsoLatitude] = useState<number>(CENTER_ZONE_10.lat);
  const [isoLongitude, setIsoLongitude] = useState<number>(CENTER_ZONE_10.lng);
  const [isPickingIsoPoint, setIsPickingIsoPoint] = useState(false);

  const clearPointSelection = () => {
    clickPointsRef.current = [];
    tempPointMarkersRef.current.forEach((marker) => marker.setMap(null));
    tempPointMarkersRef.current = [];
  };

  const clearRouteAndMeasure = () => {
    if (measureLineRef.current) {
      measureLineRef.current.setMap(null);
      measureLineRef.current = null;
    }
    clearPointSelection();
    setMeasureResult("");
    if (isoMarkerRef.current) {
      isoMarkerRef.current.setMap(null);
      isoMarkerRef.current = null;
    }
    isoPolygonsRef.current.forEach((polygon) => polygon.setMap(null));
    isoPolygonsRef.current = [];
    setIsoResult("");
  };

  const createIsochrone = async () => {
    const googleAny = (window as any).google;
    const map = mapInstanceRef.current;
    if (!googleAny || !map) return;

    if (!isoProfile) {
      setIsoResult("Selecciona un profile ISO.");
      return;
    }
    if (!Number.isFinite(isoLatitude) || !Number.isFinite(isoLongitude)) {
      setIsoResult("Latitud/Longitud no validas.");
      return;
    }

    if (isoMarkerRef.current) {
      isoMarkerRef.current.setMap(null);
    }
    isoPolygonsRef.current.forEach((polygon) => polygon.setMap(null));
    isoPolygonsRef.current = [];

    isoMarkerRef.current = new googleAny.maps.Marker({
      map,
      position: { lat: isoLatitude, lng: isoLongitude },
      title: "Punto ISO",
    });

    setIsoResult("Calculando isocrona...");

    try {
      const contourMinutes =
        isoContourSelection === "interval-15" ? [15, 30, 45, 60] : isoMinutes;
      const contourMeters =
        isoMetersSelection === "interval-10000" ? [10000, 20000, 30000, 40000] : isoMeters;

      const iso = await getIsocroneFromMapbox(isoLatitude, isoLongitude, {
        profile: isoProfile,
        minutes: isoContourUnit === "minutes" ? contourMinutes : undefined,
        meters: isoContourUnit === "meters" ? contourMeters : undefined,
        visualization: "polygon",
      });

      console.log("ISO API RESULT:", iso.raw);

      const features = Array.isArray(iso.features) ? iso.features : [];
      const polygonsToRender: any[] = [];
      const bounds = new googleAny.maps.LatLngBounds();
      const sortedFeatures = [...features].sort((a: any, b: any) => {
        const aContour = Number(a?.properties?.contour ?? 0);
        const bContour = Number(b?.properties?.contour ?? 0);
        return bContour - aContour;
      });

      sortedFeatures.forEach((feature: any, index: number) => {
        const paths = toLatLngPathsFromGeometry(feature?.geometry);
        if (!paths.length) return;

        const fillColor = String(
          feature?.properties?.fillColor ?? feature?.properties?.fill ?? "#ef4444",
        );
        const strokeColor = fillColor;
        const fillOpacity = Number(
          feature?.properties?.["fill-opacity"] ?? feature?.properties?.fillOpacity ?? 0.18,
        );
        paths.forEach((path) => {
          path.forEach((point) => bounds.extend(point));

          const polygon = new googleAny.maps.Polygon({
            map,
            paths: path,
            strokeColor,
            strokeOpacity: 1,
            strokeWeight: 2,
            fillColor,
            fillOpacity: Number.isFinite(fillOpacity) ? fillOpacity : 0.18,
            clickable: false,
          });
          polygonsToRender.push(polygon);
        });
      });

      isoPolygonsRef.current = polygonsToRender;

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 40);
      } else {
        map.panTo({ lat: isoLatitude, lng: isoLongitude });
      }
      updateMarkersVisibility();
      const contourLabel = Array.isArray(iso.contours) ? iso.contours.join(", ") : String(iso.contours);
      const contourUnitLabel = iso.contourParam === "contours_meters" ? "m" : "min";
      setIsoResult(`Isocrona creada (${contourLabel} ${contourUnitLabel}, ${iso.profile}).`);
    } catch (isoError: any) {
      setIsoResult(`Error ISO: ${isoError?.message ?? "No se pudo generar isocrona."}`);
    }
  };

  const updateMarkersVisibility = () => {
    const googleAny = (window as any).google;
    const shapes = shapesRef.current;
    const isoPolygons = isoPolygonsRef.current;

    if (!googleAny || !mapInstanceRef.current) return;
    const hasAnyActiveFilter = shapes.length > 0 || isoPolygons.length > 0;

    markersRef.current.forEach((marker: any) => {
      const position = marker.getPosition();
      if (!position) return;
      if (!hasAnyActiveFilter) {
        marker.setMap(null);
        return;
      }

      const isVisibleInShapes = shapes.some((shape) => {
        if (!shape) return false;

        if (shape instanceof googleAny.maps.Circle) {
          const center = shape.getCenter();
          const radius = shape.getRadius();
          if (!center || typeof radius !== "number") return false;
          const distance = googleAny.maps.geometry.spherical.computeDistanceBetween(
            center,
            position,
          );
          return distance <= radius;
        }

        if (shape instanceof googleAny.maps.Polygon) {
          return googleAny.maps.geometry.poly.containsLocation(position, shape);
        }

        if (shape instanceof googleAny.maps.Polyline) {
          // 0.001 deg ~ 100m de tolerancia para considerar "sobre la ruta".
          return googleAny.maps.geometry.poly.isLocationOnEdge(position, shape, 0.001);
        }

        return false;
      });

      const isVisibleInIso = isoPolygons.some((polygon) =>
        googleAny.maps.geometry.poly.containsLocation(position, polygon),
      );

      marker.setMap(isVisibleInShapes || isVisibleInIso ? mapInstanceRef.current : null);
    });
  };

  const bindShapeEvents = (shape: any) => {
    const googleAny = (window as any).google;
    if (!googleAny || !shape) return;

    if (shape instanceof googleAny.maps.Circle) {
      googleAny.maps.event.addListener(shape, "center_changed", updateMarkersVisibility);
      googleAny.maps.event.addListener(shape, "radius_changed", updateMarkersVisibility);
      return;
    }

    if (shape instanceof googleAny.maps.Polygon) {
      const paths = shape.getPaths();
      paths.forEach((path: any) => {
        googleAny.maps.event.addListener(path, "set_at", updateMarkersVisibility);
        googleAny.maps.event.addListener(path, "insert_at", updateMarkersVisibility);
        googleAny.maps.event.addListener(path, "remove_at", updateMarkersVisibility);
      });
      return;
    }

    if (shape instanceof googleAny.maps.Polyline) {
      const path = shape.getPath();
      googleAny.maps.event.addListener(path, "set_at", updateMarkersVisibility);
      googleAny.maps.event.addListener(path, "insert_at", updateMarkersVisibility);
      googleAny.maps.event.addListener(path, "remove_at", updateMarkersVisibility);
    }
  };

  const clearShapes = () => {
    shapesRef.current.forEach((shape) => shape.setMap(null));
    shapesRef.current = [];
    markersRef.current.forEach((marker) => marker.setMap(null));
    clearRouteAndMeasure();
    setInteractionMode(null);
  };

  useEffect(() => {
    const storedCount = Number(window.localStorage.getItem("maps_api_load_count") ?? "0");
    if (!Number.isNaN(storedCount) && storedCount >= 0) {
      setMapLoadCount(storedCount);
    }
  }, []);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "pega_tu_api_key_aqui") {
      setError("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en .env");
      return;
    }

    const existingScript = document.querySelector(
      "script[data-google-maps='true']",
    ) as HTMLScriptElement | null;

    const initMap = () => {
      const googleAny = (window as any).google;
      if (!mapRef.current || !googleAny?.maps?.drawing || !googleAny?.maps?.geometry) {
        return;
      }

      const map = new googleAny.maps.Map(mapRef.current, {
        center: CENTER_ZONE_10,
        zoom: 13,
        mapTypeId: "roadmap",
        mapTypeControl: false,
        streetViewControl: false,
        restriction: {
          latLngBounds: GUATEMALA_BOUNDS,
          strictBounds: true,
        },
      });
      mapInstanceRef.current = map;

      if (!hasCountedLoadRef.current) {
        hasCountedLoadRef.current = true;
        setMapLoadCount((prev) => {
          const nextCount = prev + 1;
          window.localStorage.setItem("maps_api_load_count", String(nextCount));
          return nextCount;
        });
      }

      const drawingManager = new googleAny.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        circleOptions: {
          editable: true,
          draggable: true,
          fillColor: "#1a73e8",
          fillOpacity: 0.2,
          strokeColor: "#1a73e8",
          strokeOpacity: 0.9,
          strokeWeight: 2,
        },
        polygonOptions: {
          editable: true,
          draggable: false,
          fillColor: "#16a34a",
          fillOpacity: 0.18,
          strokeColor: "#166534",
          strokeOpacity: 0.9,
          strokeWeight: 2,
        },
        polylineOptions: {
          editable: true,
          draggable: false,
          strokeColor: "#ea580c",
          strokeOpacity: 0.95,
          strokeWeight: 3,
        },
      });
      drawingManager.setMap(map);
      drawingManagerRef.current = drawingManager;

      const drawMeasurement = (origin: any, destination: any) => {
        if (!origin || !destination) return;
        if (measureLineRef.current) {
          measureLineRef.current.setMap(null);
        }

        measureLineRef.current = new googleAny.maps.Polyline({
          map,
          path: [origin, destination],
          strokeColor: "#111827",
          strokeWeight: 3,
          strokeOpacity: 0.9,
        });

        const meters = googleAny.maps.geometry.spherical.computeDistanceBetween(origin, destination);
        setMeasureResult(
          `Medicion directa: ${(meters / 1000).toFixed(2)} km (${Math.round(meters)} m)`,
        );
      };

      const features = (mapGeoJson as any)?.features ?? [];
      markersRef.current = features
        .filter((feature: any) => feature?.geometry?.type === "Point")
        .map((feature: any) => {
          const [lng, lat] = feature.geometry.coordinates;
          return new googleAny.maps.Marker({
            position: { lat, lng },
            map: null,
          });
        });

      const handleShapeComplete = (shape: any) => {
        shapesRef.current.push(shape);
        bindShapeEvents(shape);
        drawingManager.setDrawingMode(null);
        setDrawMode(null);
        updateMarkersVisibility();
      };

      googleAny.maps.event.addListener(drawingManager, "circlecomplete", handleShapeComplete);
      googleAny.maps.event.addListener(drawingManager, "polygoncomplete", handleShapeComplete);
      googleAny.maps.event.addListener(drawingManager, "polylinecomplete", handleShapeComplete);

      googleAny.maps.event.addListener(map, "click", (event: any) => {
        const mode = interactionModeRef.current;
        if (!event?.latLng) return;

        if (pickingIsoPointRef.current) {
          const point = event.latLng;
          const lat = point.lat();
          const lng = point.lng();
          setIsoLatitude(lat);
          setIsoLongitude(lng);
          setIsPickingIsoPoint(false);
          setIsoResult(`Coordenadas seleccionadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          console.log(`Latitud: ${lat}, Longitud: ${lng}`);
          return;
        }

        if (!mode) return;

        if (mode === "iso") {
          setIsoResult("Configura parametros y presiona Crear.");
          return;
        }

        clickPointsRef.current.push(event.latLng);
        tempPointMarkersRef.current.push(
          new googleAny.maps.Marker({
            map,
            position: event.latLng,
            icon: {
              path: googleAny.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: "#111827",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          }),
        );

        if (clickPointsRef.current.length < 2) return;

        const [origin, destination] = clickPointsRef.current;

        if (mode === "measure") drawMeasurement(origin, destination);

        clearPointSelection();
      });
    };

    if ((window as any).google?.maps?.drawing && (window as any).google?.maps?.geometry) {
      initMap();
      return;
    }

    if (existingScript) {
      existingScript.addEventListener("load", initMap, { once: true });
      return () => existingScript.removeEventListener("load", initMap);
    }

    const script = document.createElement("script");
    script.src = getGoogleMapsScriptSrc(GOOGLE_MAPS_API_KEY, ["drawing", "geometry"]);
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.addEventListener("load", initMap, { once: true });
    script.addEventListener("error", () => {
      setError("No se pudo cargar Google Maps. Revisa tu API key.");
    });

    document.head.appendChild(script);

    return () => script.removeEventListener("load", initMap);
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (mapType === "vegetacion") {
      mapInstanceRef.current.setMapTypeId("roadmap");
      mapInstanceRef.current.setOptions({
        styles: VEGETATION_LOCAL_STYLE,
      });
      return;
    }

    mapInstanceRef.current.setOptions({ styles: null });
    mapInstanceRef.current.setMapTypeId(mapType);
  }, [mapType]);

  useEffect(() => {
    interactionModeRef.current = interactionMode;
  }, [interactionMode]);

  useEffect(() => {
    pickingIsoPointRef.current = isPickingIsoPoint;
  }, [isPickingIsoPoint]);

  useEffect(() => {
    if (!drawingManagerRef.current) return;
    const googleAny = (window as any).google;
    if (!googleAny) return;

    if (drawMode === null) {
      drawingManagerRef.current.setDrawingMode(null);
      return;
    }

    const modeMap: Record<Exclude<DrawMode, null>, any> = {
      circle: googleAny.maps.drawing.OverlayType.CIRCLE,
      polygon: googleAny.maps.drawing.OverlayType.POLYGON,
      polyline: googleAny.maps.drawing.OverlayType.POLYLINE,
    };

    drawingManagerRef.current.setDrawingMode(modeMap[drawMode]);
  }, [drawMode]);

  if (error) {
    return <p>{error}</p>;
  }

  const estimatedCost = (mapLoadCount * MAP_LOAD_COST_USD).toFixed(4);
  const contourMinuteOptions = [10, 20, 30, 40, 50];
  const contourMeterOptions = [1000, 5000, 20000];

  return (
    <section style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 10,
          background: "white",
          borderRadius: 8,
          padding: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => setDrawMode(drawMode === "polyline" ? null : "polyline")}
          title="Dibujar linea"
          style={{ fontSize: 16, padding: "6px 10px" }}
        >
          /\
        </button>
        <button
          type="button"
          onClick={() => setDrawMode(drawMode === "polygon" ? null : "polygon")}
          title="Dibujar poligono"
          style={{ fontSize: 16, padding: "6px 10px" }}
        >
          []
        </button>
        <button
          type="button"
          onClick={() => setDrawMode(drawMode === "circle" ? null : "circle")}
          title="Dibujar circulo"
          style={{ fontSize: 16, padding: "6px 10px" }}
        >
          O
        </button>
        <button
          type="button"
          onClick={clearShapes}
          title="Limpiar figuras"
          style={{ fontSize: 16, padding: "6px 10px" }}
        >
          X
        </button>
        <button
          type="button"
          onClick={() => {
            setDrawMode(null);
            setInteractionMode(interactionMode === "measure" ? null : "measure");
          }}
          title="Medicion"
          style={{ fontSize: 16, padding: "6px 10px" }}
        >
          MED
        </button>
        <button
          type="button"
          onClick={() => {
            setDrawMode(null);
            setInteractionMode(interactionMode === "iso" ? null : "iso");
            setIsPickingIsoPoint(false);
            setIsoResult("");
          }}
          title="Isocrona"
          style={{ fontSize: 16, padding: "6px 10px" }}
        >
          ISO
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Tipo:
          <select value={mapType} onChange={(event) => setMapType(event.target.value)}>
            <option value="roadmap">Carretera</option>
            <option value="satellite">Satelite</option>
            <option value="hybrid">Hibrido</option>
            <option value="terrain">Relieve</option>
            <option value="vegetacion">Vegetacion</option>
          </select>
        </label>
      </div>

      {interactionMode === "iso" ? (
        <aside
          className="absolute right-4 top-20 z-20 w-[340px] max-h-[calc(100vh-104px)] overflow-y-auto rounded-2xl border border-slate-300 bg-white/95 p-4 shadow-2xl backdrop-blur-sm"
          style={{ position: "absolute", right: 16, top: 80 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Isocrona</h3>
              <p className="text-xs text-slate-500">Configura parametros y crea el poligono.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setInteractionMode(null);
                setIsPickingIsoPoint(false);
              }}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              title="Cerrar panel ISO"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-800">
              <span className="font-medium">Longitud</span>
              <input
                type="number"
                step="0.000001"
                value={isoLongitude}
                onChange={(event) => setIsoLongitude(Number(event.target.value))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-800">
              <span className="font-medium">Latitud</span>
              <input
                type="number"
                step="0.000001"
                value={isoLatitude}
                onChange={(event) => setIsoLatitude(Number(event.target.value))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-900">Routing profile</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { value: "driving", label: "driving" },
                { value: "driving-traffic", label: "driving-traffic" },
                { value: "walking", label: "walking" },
                { value: "cycling", label: "cycling" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800"
                >
                  <input
                    type="radio"
                    name="iso-profile"
                    value={option.value}
                    checked={isoProfile === option.value}
                    onChange={(event) => setIsoProfile(event.target.value as MapboxProfile)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-900">Contour type</p>
            <div className="mt-2 inline-flex rounded-lg border border-slate-300 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setIsoContourUnit("minutes")}
                className={`rounded-md px-3 py-1 text-sm ${
                  isoContourUnit === "minutes"
                    ? "bg-blue-600 font-medium text-white"
                    : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                Minutos
              </button>
              <button
                type="button"
                onClick={() => setIsoContourUnit("meters")}
                className={`rounded-md px-3 py-1 text-sm ${
                  isoContourUnit === "meters"
                    ? "bg-blue-600 font-medium text-white"
                    : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                Metros
              </button>
            </div>

            {isoContourUnit === "minutes" ? (
              <select
                value={isoContourSelection}
                onChange={(event) => {
                  const nextValue = event.target.value as IsoContourSelection;
                  setIsoContourSelection(nextValue);

                  if (nextValue !== "interval-15") {
                    const nextMinutes = Number(nextValue);
                    if (Number.isFinite(nextMinutes)) {
                      setIsoMinutes(nextMinutes);
                    }
                  }
                }}
                className="mt-2 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {contourMinuteOptions.map((minutes) => (
                  <option key={minutes} value={minutes} className="rounded px-2 py-1">
                    {minutes} min
                  </option>
                ))}
                <option value="interval-15" className="rounded px-2 py-1">
                  Intervalos de 15 min (15, 30, 45, 60)
                </option>
              </select>
            ) : (
              <select
                value={isoMetersSelection}
                onChange={(event) => {
                  const nextValue = event.target.value as IsoMetersSelection;
                  setIsoMetersSelection(nextValue);

                  if (nextValue !== "interval-10000") {
                    const nextMeters = Number(nextValue);
                    if (Number.isFinite(nextMeters)) {
                      setIsoMeters(nextMeters);
                    }
                  }
                }}
                className="mt-2 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {contourMeterOptions.map((meters) => (
                  <option key={meters} value={meters} className="rounded px-2 py-1">
                    {meters} m
                  </option>
                ))}
                <option value="interval-10000" className="rounded px-2 py-1">
                  Intervalo de 10000 (10000, 20000, 30000, 40000)
                </option>
              </select>
            )}
          </div>



          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !isPickingIsoPoint;
                setIsPickingIsoPoint(next);
                setIsoResult(
                  next
                    ? "Haz clic en el mapa para tomar latitud y longitud."
                    : "Captura de coordenadas desactivada.",
                );
              }}
              title="Marcar coordenadas desde el mapa"
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              {isPickingIsoPoint ? "Cancelar marcado" : "Marcar en el mapa"}
            </button>
            <button
              type="button"
              onClick={() => {
                void createIsochrone();
              }}
              title="Crear isocrona"
              className="rounded-md border border-blue-700 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Crear
            </button>
          </div>
        </aside>
      ) : null}

      <div
        style={{
          position: "absolute",
          bottom: 56,
          left: 16,
          zIndex: 10,
          background: "rgba(255,255,255,0.95)",
          borderRadius: 8,
          padding: "8px 10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          fontSize: 12,
          maxWidth: 560,
        }}
      >
        <div>
          Modo activo: {interactionMode ?? "ninguno"}{" "}
          {interactionMode === "measure" ? "(haz clic en 2 puntos)" : null}
          {interactionMode === "iso"
            ? isoProfile
              ? `(profile: ${isoProfile}) configura parametros y presiona Crear`
              : "(selecciona profile, parametros y presiona Crear)"
            : null}
        </div>
        {measureResult ? <div>{measureResult}</div> : null}
        {isoResult ? <div>{isoResult}</div> : null}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          zIndex: 10,
          background: "rgba(255,255,255,0.95)",
          borderRadius: 8,
          padding: "8px 10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          fontSize: 13,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <span>
          Uso API (map loads): <strong>{mapLoadCount}</strong> | Gasto aprox: <strong>USD {estimatedCost}</strong>
        </span>
        <button
          type="button"
          onClick={() => {
            setMapLoadCount(0);
            window.localStorage.setItem("maps_api_load_count", "0");
          }}
          style={{ fontSize: 12, padding: "4px 8px" }}
          title="Reiniciar contador"
        >
          Reiniciar
        </button>
      </div>

      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </section>
  );
}
