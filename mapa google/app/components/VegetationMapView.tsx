"use client";

import { useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type VegetationStyle = "normal" | "vegetacion" | "bosque";

const CENTER_ZONE_10 = { lat: 14.5887, lng: -90.5054 };

const MAP_STYLES: Record<VegetationStyle, any[] | null> = {
  normal: null,
  vegetacion: [
    { featureType: "poi.park", stylers: [{ saturation: 50 }, { lightness: -10 }] },
    { featureType: "landscape.natural", stylers: [{ saturation: 60 }, { hue: "#4caf50" }] },
    { featureType: "landscape.man_made", stylers: [{ saturation: -25 }] },
    { featureType: "road", stylers: [{ saturation: -40 }, { lightness: 10 }] },
    { featureType: "water", stylers: [{ saturation: -20 }, { lightness: 5 }] },
  ],
  bosque: [
    { elementType: "geometry", stylers: [{ color: "#e8f5e9" }] },
    { featureType: "landscape.natural", stylers: [{ color: "#81c784" }, { saturation: 80 }] },
    { featureType: "poi.park", stylers: [{ color: "#43a047" }] },
    { featureType: "road", stylers: [{ color: "#c8e6c9" }] },
    { featureType: "water", stylers: [{ color: "#a5d6a7" }] },
  ],
};

export function VegetationMapView() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [styleMode, setStyleMode] = useState<VegetationStyle>("vegetacion");

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
      if (!mapRef.current || !googleAny?.maps) return;

      const map = new googleAny.maps.Map(mapRef.current, {
        center: CENTER_ZONE_10,
        zoom: 12,
        mapTypeId: "roadmap",
        mapTypeControl: false,
        streetViewControl: false,
        styles: MAP_STYLES[styleMode],
      });

      mapInstanceRef.current = map;
    };

    if ((window as any).google?.maps) {
      initMap();
      return;
    }

    if (existingScript) {
      existingScript.addEventListener("load", initMap, { once: true });
      return () => existingScript.removeEventListener("load", initMap);
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=beta`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.addEventListener("load", initMap, { once: true });
    script.addEventListener("error", () => {
      setError("No se pudo cargar Google Maps.");
    });
    document.head.appendChild(script);

    return () => script.removeEventListener("load", initMap);
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setOptions({ styles: MAP_STYLES[styleMode] });
  }, [styleMode]);

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
          zIndex: 20,
          background: "white",
          borderRadius: 8,
          padding: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Estilo:
          <select
            value={styleMode}
            onChange={(event) => setStyleMode(event.target.value as VegetationStyle)}
          >
            <option value="normal">Normal</option>
            <option value="vegetacion">Vegetacion</option>
            <option value="bosque">Bosque</option>
          </select>
        </label>
      </div>

      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </section>
  );
}

