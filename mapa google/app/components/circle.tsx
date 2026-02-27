"use client";

import { useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
  const circleRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapType, setMapType] = useState("roadmap");
  const [tilt, setTilt] = useState(0);
  const [heading, setHeading] = useState(0);

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
      if (!mapRef.current || !googleAny?.maps?.drawing) return;

      const map = new googleAny.maps.Map(mapRef.current, {
        center: CENTER_ZONE_10,
        zoom: 13,
        mapTypeId: "roadmap",
        mapTypeControl: false,
        streetViewControl: false,
        rotateControl: true,
        heading: 0,
        tilt: 0,
        restriction: {
          latLngBounds: GUATEMALA_BOUNDS,
          strictBounds: true,
        },
      });
      mapInstanceRef.current = map;

      const drawingManager = new googleAny.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
          position: googleAny.maps.ControlPosition.TOP_CENTER,
          drawingModes: [googleAny.maps.drawing.OverlayType.CIRCLE],
        },
        circleOptions: {
          editable: true,
          draggable: true,
          fillColor: "#1a73e8",
          fillOpacity: 0.25,
          strokeColor: "#1a73e8",
          strokeOpacity: 0.9,
          strokeWeight: 2,
        },
      });

      drawingManager.setMap(map);

      googleAny.maps.event.addListener(
        drawingManager,
        "circlecomplete",
        (newCircle: any) => {
          if (circleRef.current) {
            circleRef.current.setMap(null);
          }

          circleRef.current = newCircle;
          drawingManager.setDrawingMode(null);
        },
      );
    };

    if ((window as any).google?.maps?.drawing) {
      initMap();
      return;
    }

    if (existingScript) {
      existingScript.addEventListener("load", initMap, { once: true });
      return () => existingScript.removeEventListener("load", initMap);
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing`;
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

  const toggleTilt = () => {
    if (!mapInstanceRef.current) return;
    const nextTilt = tilt === 45 ? 0 : 45;
    mapInstanceRef.current.setTilt(nextTilt);
    setTilt(nextTilt);
  };

  const rotate = (step: number) => {
    if (!mapInstanceRef.current) return;
    const nextHeading = (heading + step + 360) % 360;
    mapInstanceRef.current.setHeading(nextHeading);
    setHeading(nextHeading);
  };

  if (error) {
    return <p>{error}</p>;
  }

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
          padding: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
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

        <button type="button" onClick={toggleTilt}>
          {tilt === 45 ? "Quitar 45deg" : "Tilt 45deg"}
        </button>
        <button type="button" onClick={() => rotate(-45)}>
          Giro -45deg
        </button>
        <button type="button" onClick={() => rotate(45)}>
          Giro +45deg
        </button>
      </div>

      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </section>
  );
}

