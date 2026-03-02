"use client";

import { useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const CENTER_ZONE_10 = { lat: 14.5887, lng: -90.5054, altitude: 220 };
type Draw3DMode = "polyline" | "polygon" | null;

function normalizePoint(event: any): { lat: number; lng: number; altitude: number } | null {
  const candidate =
    event?.latLngAltitude ??
    event?.detail?.latLngAltitude ??
    event?.detail?.position ??
    event?.position ??
    event?.latLng;

  if (!candidate) return null;

  if (typeof candidate.lat === "function" && typeof candidate.lng === "function") {
    return { lat: candidate.lat(), lng: candidate.lng(), altitude: 0 };
  }

  if (typeof candidate.lat === "number" && typeof candidate.lng === "number") {
    return {
      lat: candidate.lat,
      lng: candidate.lng,
      altitude: typeof candidate.altitude === "number" ? candidate.altitude : 0,
    };
  }

  return null;
}

export function Map3DView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const map3DRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const previewOverlayRef = useRef<any>(null);
  const pointsRef = useRef<Array<{ lat: number; lng: number; altitude: number }>>([]);
  const drawModeRef = useRef<Draw3DMode>(null);
  const classesRef = useRef<{ Polygon3DElement?: any; Polyline3DElement?: any }>({});
  const [error, setError] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState<Draw3DMode>(null);

  const clearPreview = () => {
    if (previewOverlayRef.current && map3DRef.current) {
      map3DRef.current.removeChild(previewOverlayRef.current);
      previewOverlayRef.current = null;
    }
    pointsRef.current = [];
  };

  const clear3DShapes = () => {
    if (!map3DRef.current) return;
    overlaysRef.current.forEach((item) => map3DRef.current.removeChild(item));
    overlaysRef.current = [];
    clearPreview();
  };

  const commitCurrentShape = () => {
    const mode = drawModeRef.current;
    if (!map3DRef.current || !mode) return;
    const points = [...pointsRef.current];
    if (mode === "polyline" && points.length < 2) return;
    if (mode === "polygon" && points.length < 3) return;

    const Polygon3DElement = classesRef.current.Polygon3DElement;
    const Polyline3DElement = classesRef.current.Polyline3DElement;
    if (!Polygon3DElement || !Polyline3DElement) return;

    const shape =
      mode === "polygon"
        ? new Polygon3DElement({
            coordinates: points,
            altitudeMode: "CLAMP_TO_GROUND",
            fillColor: "#16a34a",
            fillOpacity: 0.35,
            strokeColor: "#166534",
            strokeWidth: 2,
            drawsOccludedSegments: false,
          })
        : new Polyline3DElement({
            coordinates: points,
            altitudeMode: "CLAMP_TO_GROUND",
            strokeColor: "#ea580c",
            strokeWidth: 4,
            drawsOccludedSegments: false,
          });

    map3DRef.current.append(shape);
    overlaysRef.current.push(shape);
    clearPreview();
  };

  const updatePreview = () => {
    const mode = drawModeRef.current;
    if (!map3DRef.current || !mode) return;
    const points = pointsRef.current;
    if (mode === "polyline" && points.length < 2) return;
    if (mode === "polygon" && points.length < 3) return;

    const Polygon3DElement = classesRef.current.Polygon3DElement;
    const Polyline3DElement = classesRef.current.Polyline3DElement;
    if (!Polygon3DElement || !Polyline3DElement) return;

    if (previewOverlayRef.current) {
      map3DRef.current.removeChild(previewOverlayRef.current);
      previewOverlayRef.current = null;
    }

    previewOverlayRef.current =
      mode === "polygon"
        ? new Polygon3DElement({
            coordinates: points,
            altitudeMode: "CLAMP_TO_GROUND",
            fillColor: "#0ea5e9",
            fillOpacity: 0.25,
            strokeColor: "#0284c7",
            strokeWidth: 2,
            drawsOccludedSegments: false,
          })
        : new Polyline3DElement({
            coordinates: points,
            altitudeMode: "CLAMP_TO_GROUND",
            strokeColor: "#0284c7",
            strokeWidth: 3,
            drawsOccludedSegments: false,
          });

    map3DRef.current.append(previewOverlayRef.current);
  };

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "pega_tu_api_key_aqui") {
      setError("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en .env");
      return;
    }

    const existingScript = document.querySelector(
      "script[data-google-maps='true']",
    ) as HTMLScriptElement | null;

    const init3DMap = async () => {
      try {
        const googleAny = (window as any).google;
        if (!googleAny?.maps?.importLibrary || !containerRef.current) return;

        const { Map3DElement, Polygon3DElement, Polyline3DElement } =
          await googleAny.maps.importLibrary("maps3d");
        if (!Map3DElement || !containerRef.current) {
          setError("Maps 3D no esta disponible para esta API key o entorno.");
          return;
        }
        classesRef.current = { Polygon3DElement, Polyline3DElement };

        containerRef.current.innerHTML = "";

        const map3d = new Map3DElement({
          center: CENTER_ZONE_10,
          // SATELLITE + rango mas cercano produce una vista mas "realista".
          mode: "SATELLITE",
          tilt: 67.5,
          heading: 28,
          range: 900,
        });
        map3DRef.current = map3d;

        map3d.style.width = "100%";
        map3d.style.height = "100%";
        map3d.addEventListener("gmp-click", (event: any) => {
          if (!drawModeRef.current) return;
          const point = normalizePoint(event);
          if (!point) return;
          pointsRef.current.push(point);
          updatePreview();
        });
        containerRef.current.append(map3d);
      } catch {
        setError("No se pudo inicializar Photorealistic 3D.");
      }
    };

    if ((window as any).google?.maps?.importLibrary) {
      init3DMap();
      return;
    }

    if (existingScript) {
      existingScript.addEventListener("load", init3DMap, { once: true });
      return () => existingScript.removeEventListener("load", init3DMap);
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=beta`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.addEventListener("load", () => {
      void init3DMap();
    });
    script.addEventListener("error", () => {
      setError("No se pudo cargar Google Maps para 3D.");
    });

    document.head.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      map3DRef.current = null;
    };
  }, []);

  useEffect(() => {
    drawModeRef.current = drawMode;
  }, [drawMode]);

  useEffect(() => {
    if (!map3DRef.current) return;

    if (drawMode === null) {
      clearPreview();
      return;
    }

    pointsRef.current = [];
  }, [drawMode]);

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <section style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 20,
          background: "white",
          borderRadius: 8,
          padding: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => setDrawMode(drawMode === "polyline" ? null : "polyline")}
          title="Dibujar polyline 3D"
          style={{ padding: "6px 10px", fontWeight: drawMode === "polyline" ? 700 : 400 }}
        >
          3D-L
        </button>
        <button
          type="button"
          onClick={() => setDrawMode(drawMode === "polygon" ? null : "polygon")}
          title="Dibujar polygon 3D"
          style={{ padding: "6px 10px", fontWeight: drawMode === "polygon" ? 700 : 400 }}
        >
          3D-P
        </button>
        <button
          type="button"
          onClick={commitCurrentShape}
          title="Guardar figura actual"
          style={{ padding: "6px 10px" }}
        >
          OK
        </button>
        <button
          type="button"
          onClick={clear3DShapes}
          title="Limpiar figuras 3D"
          style={{ padding: "6px 10px" }}
        >
          X
        </button>
      </div>

      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </section>
  );
}
