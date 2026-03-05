"use client";

import { useEffect, useRef, useState } from "react";
import { mapGeoJson } from "../data/geojson";
import { VEGETATION_LOCAL_STYLE } from "../estilos mapa/vegetacion y caminos";
import { getIsoPolygonStyle, type IsoStyleOption } from "../estilos mapa/estilos iso/isoStyles";
import { getIsocroneFromMapbox, type MapboxProfile } from "./isocrone";
import { getGoogleMapsScriptSrc } from "../library/googleMapsScript";
import {
  TRAFFIC_ISO_PROFILE,
  normalizeDepartAt,
  resolveTrafficMinutes,
  type TrafficMinutesSelection,
} from "../library/trafficIso";
import { fetchMapboxTrafficTileJson } from "../library/mapboxTraffic";
import {
  createGooglePolygonFromCoords,
  figureToPolygonPaths,
  geoJsonGeometryToPolygonPaths,
  type LatLngLiteral,
} from "../library/polygons";

const MAP_LOAD_COST_USD = Number(process.env.NEXT_PUBLIC_MAP_LOAD_COST_USD ?? "0.007");
const ISO_DISTANCE_CALC_PROFILE: MapboxProfile = "walking";
const ISO_NO_TRAFFIC_PROFILE: MapboxProfile = "cycling";

type DrawMode = "circle" | "polygon" | "polyline" | null;
type InteractionMode = "measure" | "iso" | null;
type IsoContourSelection = "10" | "20" | "30" | "40" | "50" | "interval-15";
type IsoMetersSelection = "1000" | "5000" | "20000" | "interval-10000";
type IsoCalculatedTimeSelection = "10" | "20" | "30" | "40" | "interval-10";
type IsoContourUnit = "minutes" | "meters" | "hibrido" | "calculada";
type IsoTrafficProfile = "sin-trafico" | "con-trafico";

const CENTER_ZONE_10: LatLngLiteral = { lat: 14.5887, lng: -90.5054 };
const GUATEMALA_BOUNDS = {
  north: 17.82,
  south: 13.74,
  west: -92.23,
  east: -88.22,
};
const HIDE_DEFAULT_GOOGLE_POI_STYLE: any[] = [];
const NEARBY_PLACES_RADIUS_METERS = 15000;
const NEARBY_PLACES_MAX_RESULTS = 20;
const NEARBY_PLACE_TYPES = ["restaurant", "cafe", "hospital", "school", "bank", "pharmacy"];
const ENABLE_LOCAL_DATASET_MARKERS = false;
const ENABLE_CUSTOM_POI_MARKERS = false;

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
  const placesMarkersRef = useRef<any[]>([]);
  const trafficLayerRef = useRef<any>(null);
  const hasFetchedPlacesRef = useRef(false);
  const isFetchingPlacesRef = useRef(false);
  const hasValidatedMapboxTrafficRef = useRef(false);
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
  const [isoMinutes, setIsoMinutes] = useState(10);
  const [isoContourSelection, setIsoContourSelection] = useState<IsoContourSelection>("10");
  const [isoMeters, setIsoMeters] = useState(1000);
  const [isoMetersSelection, setIsoMetersSelection] = useState<IsoMetersSelection>("1000");
  const [isoContourUnit, setIsoContourUnit] = useState<IsoContourUnit>("meters");
  const [isoTrafficProfile, setIsoTrafficProfile] = useState<IsoTrafficProfile>("sin-trafico");
  const [isoHybridSpeedKmh, setIsoHybridSpeedKmh] = useState(10);
  const [isoCustomSpeedKmh, setIsoCustomSpeedKmh] = useState(10);
  const [isoCalculatedTimeSelection, setIsoCalculatedTimeSelection] =
    useState<IsoCalculatedTimeSelection>("30");
  const [isoTrafficMinutesSelection, setIsoTrafficMinutesSelection] =
    useState<TrafficMinutesSelection>("30");
  const [isoTrafficDepartAt, setIsoTrafficDepartAt] = useState("");
  const [isoStyleOption, setIsoStyleOption] = useState<IsoStyleOption>("basica");
  const [isoLatitude, setIsoLatitude] = useState<number>(CENTER_ZONE_10.lat);
  const [isoLongitude, setIsoLongitude] = useState<number>(CENTER_ZONE_10.lng);
  const [isPickingIsoPoint, setIsPickingIsoPoint] = useState(false);

  const isPointInAnyPolygon = (googleAny: any, point: any, polygons: any[]) => {
    return polygons.some((polygon) => {
      const inside = googleAny.maps.geometry.poly.containsLocation(point, polygon);
      if (inside) return true;
      return googleAny.maps.geometry.poly.isLocationOnEdge(point, polygon, 0.00001);
    });
  };

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
      const currentDrivingProfile: MapboxProfile =
        isoTrafficProfile === "con-trafico" ? TRAFFIC_ISO_PROFILE : ISO_NO_TRAFFIC_PROFILE;
      const contourMinutes =
        isoContourSelection === "interval-15" ? [15, 30, 45, 60] : isoMinutes;
      const contourMeters =
        isoMetersSelection === "interval-10000" ? [10000, 20000, 30000, 40000] : isoMeters;
      const customSpeedMps = (isoCustomSpeedKmh * 1000) / 3600;
      const calculatedMinutesList =
        isoCalculatedTimeSelection === "interval-10"
          ? [10, 20, 30, 40]
          : [Number(isoCalculatedTimeSelection)];
      const calculatedMetersContours = calculatedMinutesList.map((minutes) =>
        Math.max(1, Math.round(customSpeedMps * (minutes * 60))),
      );
      const calculatedMeters =
        calculatedMetersContours.length === 1 ? calculatedMetersContours[0] : calculatedMetersContours;
      const bounds = new googleAny.maps.LatLngBounds();
      const polygonsToRender: any[] = [];
      const trafficMinutes = resolveTrafficMinutes(isoTrafficMinutesSelection);
      const trafficDepartAt = normalizeDepartAt(isoTrafficDepartAt);
      const renderIsoFeatures = (
        features: any[],
        styleResolver: (feature: any, index: number) => {
          strokeColor: string;
          strokeOpacity: number;
          strokeWeight: number;
          fillColor: string;
          fillOpacity: number;
        },
      ) => {
        const sortedFeatures = [...features].sort((a: any, b: any) => {
          const aContour = Number(a?.properties?.contour ?? 0);
          const bContour = Number(b?.properties?.contour ?? 0);
          return bContour - aContour;
        });

        sortedFeatures.forEach((feature: any, index: number) => {
          const paths = geoJsonGeometryToPolygonPaths(feature?.geometry);
          if (!paths.length) return;
          const polygonStyle = styleResolver(feature, index);

          paths.forEach((path) => {
            path.forEach((point) => bounds.extend(point));
            const polygon = createGooglePolygonFromCoords(googleAny, path, {
              map,
              strokeColor: polygonStyle.strokeColor,
              strokeOpacity: polygonStyle.strokeOpacity,
              strokeWeight: polygonStyle.strokeWeight,
              fillColor: polygonStyle.fillColor,
              fillOpacity: polygonStyle.fillOpacity,
              clickable: false,
            });
            polygonsToRender.push(polygon);
          });
        });
      };

      if (isoContourUnit === "calculada") {
        if (isoTrafficProfile === "con-trafico") {
          const iso = await getIsocroneFromMapbox(isoLatitude, isoLongitude, {
            profile: TRAFFIC_ISO_PROFILE,
            minutes: trafficMinutes,
            departAt: trafficDepartAt,
            visualization: "polygon",
          });

          console.log("ISO TRAFICO REAL RESULT:", iso.raw);
          renderIsoFeatures(iso.features, (feature, index) => {
            const polygonStyle = getIsoPolygonStyle(isoStyleOption, feature, index);
            return {
              strokeColor: polygonStyle.strokeColor,
              strokeOpacity: polygonStyle.strokeOpacity,
              strokeWeight: polygonStyle.strokeWeight,
              fillColor: polygonStyle.fillColor,
              fillOpacity: polygonStyle.fillOpacity,
            };
          });

          const trafficLabel = Array.isArray(trafficMinutes)
            ? trafficMinutes.join(", ")
            : String(trafficMinutes);
          const departAtSuffix = trafficDepartAt ? ` | depart_at: ${trafficDepartAt}` : "";
          setIsoResult(
            `Isocrona por trafico real creada (${trafficLabel} min)${departAtSuffix}.`,
          );
        } else if (!Number.isFinite(isoCustomSpeedKmh) || isoCustomSpeedKmh <= 0) {
          setIsoResult("Velocidad invalida. Usa un valor mayor a 0 km/h.");
          return;
        } else {
          const calculatedMetersList = Array.isArray(calculatedMeters) ? calculatedMeters : [calculatedMeters];
          const contourChunks: number[][] = [];
          for (let i = 0; i < calculatedMetersList.length; i += 4) {
            contourChunks.push(calculatedMetersList.slice(i, i + 4));
          }

          const isoResponses = await Promise.all(
            contourChunks.map((chunk) =>
              getIsocroneFromMapbox(isoLatitude, isoLongitude, {
                profile: ISO_DISTANCE_CALC_PROFILE,
                meters: chunk.length === 1 ? chunk[0] : chunk,
                visualization: "polygon",
              }),
            ),
          );

          const combinedFeatures = isoResponses.flatMap((response) =>
            Array.isArray(response.features) ? response.features : [],
          );

          console.log("ISO CALCULADA RESULTS:", isoResponses.map((response) => response.raw));
          renderIsoFeatures(combinedFeatures, (feature, index) => {
            const polygonStyle = getIsoPolygonStyle(isoStyleOption, feature, index);
            return {
              strokeColor: polygonStyle.strokeColor,
              strokeOpacity: polygonStyle.strokeOpacity,
              strokeWeight: polygonStyle.strokeWeight,
              fillColor: polygonStyle.fillColor,
              fillOpacity: polygonStyle.fillOpacity,
            };
          });

          const calculatedTimeLabel =
            isoCalculatedTimeSelection === "interval-10"
              ? "10, 20, 30, 40"
              : isoCalculatedTimeSelection;
          const calculatedMetersLabel = calculatedMetersList.join(", ");
          setIsoResult(
            `Isocrona calculada creada (${calculatedMetersLabel} m) con velocidad ${isoCustomSpeedKmh} km/h y tiempo ${calculatedTimeLabel} min.`,
          );
        }
      } else if (isoContourUnit === "hibrido") {
        const [minutesIso, metersIso] = await Promise.all([
          getIsocroneFromMapbox(isoLatitude, isoLongitude, {
            profile: currentDrivingProfile,
            minutes: contourMinutes,
            visualization: "polygon",
          }),
          getIsocroneFromMapbox(isoLatitude, isoLongitude, {
            profile: currentDrivingProfile,
            meters: contourMeters,
            visualization: "polygon",
          }),
        ]);

        renderIsoFeatures(minutesIso.features, (_feature, index) => ({
          strokeColor: "#dc2626",
          strokeOpacity: 1,
          strokeWeight: index === 0 ? 3 : 2,
          fillColor: "#ef4444",
          fillOpacity: 0.22,
        }));
        renderIsoFeatures(metersIso.features, (_feature, index) => ({
          strokeColor: "#1d4ed8",
          strokeOpacity: 1,
          strokeWeight: index === 0 ? 3 : 2,
          fillColor: "#3b82f6",
          fillOpacity: 0.22,
        }));

        console.log("ISO HYBRID MINUTES:", minutesIso.raw);
        console.log("ISO HYBRID METERS:", metersIso.raw);
        if (isoTrafficProfile === "con-trafico") {
          setIsoResult("Isocronas hibridas creadas (tiempo rojo, distancia azul) con trafico real.");
        } else {
          setIsoResult(
            `Isocronas hibridas creadas (tiempo rojo, distancia azul) con velocidad ${isoHybridSpeedKmh} km/h.`,
          );
        }
      } else {
        const iso = await getIsocroneFromMapbox(isoLatitude, isoLongitude, {
          profile: currentDrivingProfile,
          minutes: isoContourUnit === "meters" ? undefined : contourMinutes,
          meters: isoContourUnit === "meters" ? contourMeters : undefined,
          visualization: "polygon",
        });

        console.log("ISO API RESULT:", iso.raw);
        renderIsoFeatures(iso.features, (feature, index) => {
          const polygonStyle = getIsoPolygonStyle(isoStyleOption, feature, index);
          return {
            strokeColor: polygonStyle.strokeColor,
            strokeOpacity: polygonStyle.strokeOpacity,
            strokeWeight: polygonStyle.strokeWeight,
            fillColor: polygonStyle.fillColor,
            fillOpacity: polygonStyle.fillOpacity,
          };
        });

        const contourLabel = Array.isArray(iso.contours) ? iso.contours.join(", ") : String(iso.contours);
        const contourUnitLabel = iso.contourParam === "contours_meters" ? "m" : "min";
        setIsoResult(`Isocrona creada (${contourLabel} ${contourUnitLabel}, ${iso.profile}).`);
      }

      isoPolygonsRef.current = polygonsToRender;
      hasFetchedPlacesRef.current = false;
      placesMarkersRef.current.forEach((marker) => marker.setMap(null));
      placesMarkersRef.current = [];
      void fetchNearbyPlacesOnce({ lat: isoLatitude, lng: isoLongitude });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 40);
      } else {
        map.panTo({ lat: isoLatitude, lng: isoLongitude });
      }
      updateMarkersVisibility();
    } catch (isoError: any) {
      setIsoResult(`Error ISO: ${isoError?.message ?? "No se pudo generar isocrona."}`);
    }
  };

  const fetchNearbyPlacesOnce = async (centerOverride?: LatLngLiteral) => {
    const googleAny = (window as any).google;
    const map = mapInstanceRef.current;
    if (
      !ENABLE_CUSTOM_POI_MARKERS ||
      !googleAny?.maps?.importLibrary ||
      !map ||
      hasFetchedPlacesRef.current ||
      isFetchingPlacesRef.current
    ) {
      return;
    }

    isFetchingPlacesRef.current = true;

    try {
      const { Place, SearchNearbyRankPreference } = await googleAny.maps.importLibrary("places");
      const center = map.getCenter();

      const requestBase = {
        fields: ["displayName", "location", "id"],
        locationRestriction: {
          center: centerOverride ??
            (center
              ? { lat: center.lat(), lng: center.lng() }
              : CENTER_ZONE_10),
          radius: NEARBY_PLACES_RADIUS_METERS,
        },
        maxResultCount: NEARBY_PLACES_MAX_RESULTS,
        rankPreference: SearchNearbyRankPreference.POPULARITY,
      };

      let response: any;
      try {
        response = await Place.searchNearby({
          ...requestBase,
          includedTypes: NEARBY_PLACE_TYPES,
        });
      } catch {
        response = await Place.searchNearby({
          ...requestBase,
          includedPrimaryTypes: ["restaurant"],
        });
      }
      const places = Array.isArray(response?.places) ? response.places : [];

      placesMarkersRef.current = places
        .filter((place: any) => place?.location)
        .map((place: any) => {
          // TODO: Restaurar iconos personalizados de POIs cuando definamos una estrategia
          // de bajo consumo (campos extra/tipos/fallback) que no incremente llamadas/costo.
          return new googleAny.maps.Marker({
            map: null,
            position: place.location,
            title: place?.displayName?.text ?? place?.displayName ?? "POI",
          });
        });

      hasFetchedPlacesRef.current = true;
      updateMarkersVisibility();
    } catch (placesError) {
      console.error("Places API (New) error:", placesError);
      hasFetchedPlacesRef.current = false;
    } finally {
      isFetchingPlacesRef.current = false;
    }
  };

  const updateMarkersVisibility = () => {
    const googleAny = (window as any).google;
    const shapes = shapesRef.current;
    const isoPolygons = isoPolygonsRef.current;

    if (!googleAny || !mapInstanceRef.current) return;
    const shapePolygons = shapes.flatMap((shape) =>
      figureToPolygonPaths(googleAny, shape).map((path) => createGooglePolygonFromCoords(googleAny, path)),
    );
    const activePolygons = [...isoPolygons, ...shapePolygons];
    const hasAnyActiveFilter = activePolygons.length > 0;
    if (ENABLE_CUSTOM_POI_MARKERS && !hasFetchedPlacesRef.current && !isFetchingPlacesRef.current) {
      void fetchNearbyPlacesOnce();
    }

    markersRef.current.forEach((marker: any) => {
      const position = marker.getPosition();
      if (!position) return;
      if (!ENABLE_LOCAL_DATASET_MARKERS) {
        marker.setMap(null);
        return;
      }
      if (!hasAnyActiveFilter) {
        marker.setMap(null);
        return;
      }

      const isVisible = isPointInAnyPolygon(googleAny, position, activePolygons);

      marker.setMap(isVisible ? mapInstanceRef.current : null);
    });

    placesMarkersRef.current.forEach((marker: any) => {
      const position = marker.getPosition();
      if (!position) return;
      if (!ENABLE_CUSTOM_POI_MARKERS) {
        marker.setMap(null);
        return;
      }
      if (!hasAnyActiveFilter) {
        marker.setMap(mapInstanceRef.current);
        return;
      }

      const isVisible = isPointInAnyPolygon(googleAny, position, activePolygons);
      marker.setMap(isVisible ? mapInstanceRef.current : null);
    });
    updateMapBaseVisuals();
  };

  const updateMapBaseVisuals = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const baseStyles = mapType === "vegetacion" ? VEGETATION_LOCAL_STYLE : [];
    const styles = [...baseStyles, ...HIDE_DEFAULT_GOOGLE_POI_STYLE];

    map.setOptions({
      styles,
      clickableIcons: true,
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
    placesMarkersRef.current.forEach((marker) => marker.setMap(null));
    clearRouteAndMeasure();
    setInteractionMode(null);
  };

  const updateTrafficLayerVisibility = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const googleAny = (window as any).google;
    if (!trafficLayerRef.current && googleAny?.maps?.TrafficLayer) {
      trafficLayerRef.current = new googleAny.maps.TrafficLayer();
    }

    if (!trafficLayerRef.current) return;
    const shouldShowTraffic = isoTrafficProfile === "con-trafico";
    trafficLayerRef.current.setMap(shouldShowTraffic ? map : null);

    if (shouldShowTraffic && !hasValidatedMapboxTrafficRef.current) {
      hasValidatedMapboxTrafficRef.current = true;
      void fetchMapboxTrafficTileJson()
        .then((payload) => {
          console.log("MAPBOX_TRAFFIC_TILEJSON:", payload);
        })
        .catch((trafficError) => {
          console.error("Mapbox traffic validation error:", trafficError);
        });
    }
  };

  useEffect(() => {
    const storedCount = Number(window.localStorage.getItem("maps_api_load_count") ?? "0");
    if (!Number.isNaN(storedCount) && storedCount >= 0) {
      setMapLoadCount(storedCount);
    }
  }, []);

  useEffect(() => {
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
      updateMapBaseVisuals();
      updateTrafficLayerVisibility();

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
      markersRef.current = ENABLE_LOCAL_DATASET_MARKERS
        ? features
            .filter((feature: any) => feature?.geometry?.type === "Point")
            .map((feature: any) => {
              const [lng, lat] = feature.geometry.coordinates;
              return new googleAny.maps.Marker({
                position: { lat, lng },
                map: null,
              });
            })
        : [];

      if (ENABLE_CUSTOM_POI_MARKERS) {
        void fetchNearbyPlacesOnce();
      }

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

    if (
      (window as any).google?.maps?.drawing &&
      (window as any).google?.maps?.geometry
    ) {
      initMap();
      return;
    }

    if (existingScript) {
      const hasRequiredLibraries =
        (window as any).google?.maps?.drawing &&
        (window as any).google?.maps?.geometry;

      if (hasRequiredLibraries) {
        initMap();
        return;
      }

      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = getGoogleMapsScriptSrc(["drawing", "geometry", "places"]);
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
    } else {
      mapInstanceRef.current.setMapTypeId(mapType);
    }
    updateMapBaseVisuals();
  }, [mapType]);

  useEffect(() => {
    updateTrafficLayerVisibility();
  }, [isoTrafficProfile]);

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
  const selectedMinutesLabel =
    isoContourSelection === "interval-15"
      ? "15, 30, 45, 60 min"
      : `${isoMinutes} min`;
  const selectedMetersLabel =
    isoMetersSelection === "interval-10000"
      ? "10000, 20000, 30000, 40000 m"
      : `${isoMeters} m`;
  const selectedCalculatedMinutesList =
    isoCalculatedTimeSelection === "interval-10"
      ? [10, 20, 30, 40]
      : [Number(isoCalculatedTimeSelection)];
  const selectedCalculatedMetersList = selectedCalculatedMinutesList.map((minutes) =>
    Math.max(1, Math.round(((isoCustomSpeedKmh * 1000) / 3600) * (minutes * 60))),
  );
  const selectedTrafficMinutes =
    isoTrafficMinutesSelection === "interval-15"
      ? [15, 30, 45]
      : [Number(isoTrafficMinutesSelection)];
  const selectedTrafficLabel = Array.isArray(selectedTrafficMinutes)
    ? selectedTrafficMinutes.join(", ")
    : String(selectedTrafficMinutes);
  const selectedCalculatedLabel =
    isoCalculatedTimeSelection === "interval-10"
      ? `${isoCustomSpeedKmh} km/h * [10, 20, 30, 40] min = [${selectedCalculatedMetersList.join(", ")}] m`
      : `${isoCustomSpeedKmh} km/h * ${selectedCalculatedMinutesList[0]} min = ${selectedCalculatedMetersList[0]} m`;
  const hybridReferenceMinutes =
    isoContourSelection === "interval-15" ? 60 : isoMinutes;
  const hybridEstimatedMeters = Math.max(
    1,
    Math.round(((isoHybridSpeedKmh * 1000) / 3600) * (hybridReferenceMinutes * 60)),
  );
  const selectedHybridLabel =
    isoTrafficProfile === "con-trafico"
      ? `${selectedMinutesLabel} | ${selectedMetersLabel} | trafico real`
      : `${selectedMinutesLabel} | ${selectedMetersLabel} | ${isoHybridSpeedKmh} km/h (~${hybridEstimatedMeters} m por tiempo)`;
  const currentDrivingProfile: MapboxProfile =
    isoTrafficProfile === "con-trafico" ? TRAFFIC_ISO_PROFILE : ISO_NO_TRAFFIC_PROFILE;
  const currentIsoProfileLabel =
    isoContourUnit === "calculada"
      ? isoTrafficProfile === "con-trafico"
        ? TRAFFIC_ISO_PROFILE
        : ISO_DISTANCE_CALC_PROFILE
      : currentDrivingProfile;
  const referenceTypeLabel =
    isoContourUnit === "hibrido"
      ? "Tiempo y Distancia"
      : isoContourUnit === "calculada"
        ? "Distancia calculada"
      : isoContourUnit === "meters"
        ? "Distancia"
        : "Tiempo";
  const referenceValueLabel =
    isoContourUnit === "hibrido"
      ? selectedHybridLabel
      : isoContourUnit === "calculada"
        ? isoTrafficProfile === "con-trafico"
          ? `${selectedTrafficLabel} min${isoTrafficDepartAt ? ` | depart_at: ${isoTrafficDepartAt}` : ""}`
          : selectedCalculatedLabel
        : isoContourUnit === "meters"
        ? selectedMetersLabel
        : selectedMinutesLabel;
  const referenceRows = [
    {
      style: "basica",
      colors: ["#ef4444"],
    },
    {
      style: "segunda opcion",
      colors: ["#dc2626", "#f97316", "#facc15", "#22c55e", "#38bdf8", "#2563eb"],
    },
    {
      style: "tercera opcion",
      colors: ["#1A2B44", "#1D3D6E", "#3C3B82", "#7D3888", "#C23482"],
    },
  ];

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
        <button
          type="button"
          onClick={() => {
            setDrawMode(null);
            setInteractionMode(null);
            setIsoResult("");
          }}
          title="Marcadores"
          style={{ fontSize: 16, padding: "6px 10px" }}
        >
          Marcadores
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
            <p className="text-sm font-semibold text-slate-900">Perfiles</p>
            <div className="mt-2 inline-flex rounded-lg border border-slate-300 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setIsoTrafficProfile("sin-trafico")}
                className={`rounded-md px-3 py-1 text-sm ${
                  isoTrafficProfile === "sin-trafico"
                    ? "bg-blue-600 font-medium text-white"
                    : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                sin trafico
              </button>
              <button
                type="button"
                onClick={() => setIsoTrafficProfile("con-trafico")}
                className={`rounded-md px-3 py-1 text-sm ${
                  isoTrafficProfile === "con-trafico"
                    ? "bg-blue-600 font-medium text-white"
                    : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                con trafico
              </button>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-900">Contour type</p>
            <div className="mt-2 inline-flex rounded-lg border border-slate-300 bg-slate-100 p-1">
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
              <button
                type="button"
                onClick={() => setIsoContourUnit("hibrido")}
                className={`rounded-md px-3 py-1 text-sm ${
                  isoContourUnit === "hibrido"
                    ? "bg-blue-600 font-medium text-white"
                    : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                Hibrido
              </button>
              <button
                type="button"
                onClick={() => setIsoContourUnit("calculada")}
                className={`rounded-md px-3 py-1 text-sm ${
                  isoContourUnit === "calculada"
                    ? "bg-blue-600 font-medium text-white"
                    : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                Calculada
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
            ) : isoContourUnit === "meters" ? (
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
            ) : isoContourUnit === "hibrido" ? (
              <div className="mt-2 grid grid-cols-1 gap-2">
                <label className="flex flex-col gap-1 text-xs text-slate-600">
                  <span className="font-medium">Tiempo</span>
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
                    className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                </label>

                <label className="flex flex-col gap-1 text-xs text-slate-600">
                  <span className="font-medium">Velocidad (km/h)</span>
                  {isoTrafficProfile === "con-trafico" ? (
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-700">
                      Gestionada por trafico real
                    </div>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      step="0.1"
                      value={isoHybridSpeedKmh}
                      onChange={(event) => setIsoHybridSpeedKmh(Number(event.target.value))}
                      className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  )}
                </label>
                <label className="flex flex-col gap-1 text-xs text-slate-600">
                  <span className="font-medium">Distancia</span>
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
                    className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                </label>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-1 gap-2">
                <label className="flex flex-col gap-1 text-xs text-slate-600">
                  <span className="font-medium">Velocidad (km/h)</span>
                  {isoTrafficProfile === "con-trafico" ? (
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-700">
                      Gestionada por trafico real
                    </div>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      step="0.1"
                      value={isoCustomSpeedKmh}
                      onChange={(event) => setIsoCustomSpeedKmh(Number(event.target.value))}
                      className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  )}
                </label>
                {isoTrafficProfile === "con-trafico" ? (
                  <>
                    <label className="flex flex-col gap-1 text-xs text-slate-600">
                      <span className="font-medium">Tiempo de trafico (min)</span>
                      <select
                        value={isoTrafficMinutesSelection}
                        onChange={(event) =>
                          setIsoTrafficMinutesSelection(event.target.value as TrafficMinutesSelection)
                        }
                        className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="15">15 min</option>
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="interval-15">Intervalos (15, 30, 45)</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-slate-600">
                      <span className="font-medium">depart_at (opcional)</span>
                      <input
                        type="datetime-local"
                        value={isoTrafficDepartAt}
                        onChange={(event) => setIsoTrafficDepartAt(event.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  </>
                ) : (
                  <label className="flex flex-col gap-1 text-xs text-slate-600">
                    <span className="font-medium">Tiempo (min)</span>
                    <select
                      value={isoCalculatedTimeSelection}
                      onChange={(event) =>
                        setIsoCalculatedTimeSelection(event.target.value as IsoCalculatedTimeSelection)
                      }
                      className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="10">10 min</option>
                      <option value="20">20 min</option>
                      <option value="30">30 min</option>
                      <option value="40">40 min</option>
                      <option value="interval-10">Intervalos de 10m (10, 20, 30, 40)</option>
                    </select>
                  </label>
                )}
              </div>
            )}
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-900">Estilos</p>
            <select
              value={isoStyleOption}
              onChange={(event) => setIsoStyleOption(event.target.value as IsoStyleOption)}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="basica">basica</option>
              <option value="segunda-opcion">segunda opcion</option>
              <option value="tercera-opcion">tercera opcion</option>
            </select>
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

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">Tabla de Referencia</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-xs text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-2 py-2 text-left font-semibold">Estilo</th>
                    <th className="px-2 py-2 text-left font-semibold">Perfil</th>
                    <th className="px-2 py-2 text-left font-semibold">Color</th>
                    <th className="px-2 py-2 text-left font-semibold">Tipo</th>
                    <th className="px-2 py-2 text-left font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {referenceRows.map((row) => (
                    <tr key={row.style} className="border-b border-slate-200 last:border-b-0">
                      <td className="px-2 py-2 capitalize">{row.style}</td>
                      <td className="px-2 py-2">{currentIsoProfileLabel}</td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-1">
                          {row.colors.map((color) => (
                            <span
                              key={`${row.style}-${color}`}
                              className="inline-block h-3 w-3 rounded-sm border border-slate-300"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-2">{referenceTypeLabel}</td>
                      <td className="px-2 py-2">{referenceValueLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            ? `(profile: ${currentIsoProfileLabel}) configura parametros y presiona Crear`
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
