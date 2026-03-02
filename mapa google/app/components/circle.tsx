"use client";

import { useEffect, useRef, useState } from "react";
import { mapGeoJson } from "../data/geojson";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_LOAD_COST_USD = Number(process.env.NEXT_PUBLIC_MAP_LOAD_COST_USD ?? "0.007");

type DrawMode = "circle" | "polygon" | "polyline" | null;
type InteractionMode = "measure" | null;

type LatLngLiteral = { lat: number; lng: number };

const CENTER_ZONE_10: LatLngLiteral = { lat: 14.5887, lng: -90.5054 };
const GUATEMALA_BOUNDS = {
  north: 17.82,
  south: 13.74,
  west: -92.23,
  east: -88.22,
};

export function Circle() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const shapesRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);
  const clickPointsRef = useRef<any[]>([]);
  const tempPointMarkersRef = useRef<any[]>([]);
  const measureLineRef = useRef<any>(null);
  const interactionModeRef = useRef<InteractionMode>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapType, setMapType] = useState("roadmap");
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(null);
  const [mapLoadCount, setMapLoadCount] = useState(0);
  const hasCountedLoadRef = useRef(false);
  const [measureResult, setMeasureResult] = useState<string>("");

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
  };

  const updateMarkersVisibility = () => {
    const googleAny = (window as any).google;
    const shapes = shapesRef.current;

    if (!googleAny || !mapInstanceRef.current) return;

    markersRef.current.forEach((marker: any) => {
      const position = marker.getPosition();
      if (!position) return;

      const isVisible = shapes.some((shape) => {
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
          return googleAny.maps.geometry.poly.isLocationOnEdge(
            position,
            shape,
            0.001,
          );
        }

        return false;
      });

      marker.setMap(isVisible ? mapInstanceRef.current : null);
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
        if (!mode || !event?.latLng) return;

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

        if (mode === "measure") {
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

          const meters = googleAny.maps.geometry.spherical.computeDistanceBetween(
            origin,
            destination,
          );
          setMeasureResult(
            `Medicion directa: ${(meters / 1000).toFixed(2)} km (${Math.round(meters)} m)`,
          );
        }

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry&v=beta`;
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
    mapInstanceRef.current.setMapTypeId(mapType);
  }, [mapType]);

  useEffect(() => {
    interactionModeRef.current = interactionMode;
  }, [interactionMode]);

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
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Tipo:
          <select
            value={mapType}
            onChange={(event) => setMapType(event.target.value)}
          >
            <option value="roadmap">Carretera</option>
            <option value="satellite">Satelite</option>
            <option value="hybrid">Hibrido</option>
            <option value="terrain">Relieve</option>
          </select>
        </label>
      </div>

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
        <div>Modo activo: {interactionMode ?? "ninguno"} (haz clic en 2 puntos)</div>
        {measureResult ? <div>{measureResult}</div> : null}
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
          Uso API (map loads): <strong>{mapLoadCount}</strong> | Gasto aprox:{" "}
          <strong>USD {estimatedCost}</strong>
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
