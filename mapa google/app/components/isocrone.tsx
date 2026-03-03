"use client";

export type MapboxProfile = "driving" | "driving-traffic" | "walking" | "cycling";

type IsochroneOptions = {
  profile?: MapboxProfile;
  minutes?: number;
  visualization?: "polygon" | "street_network";
};

type LatLngLiteral = { lat: number; lng: number };

type IsochroneResult = {
  source: "mapbox";
  profile: MapboxProfile;
  minutes: number;
  visualization: "polygon" | "street_network";
  features: any[];
  polygonPaths: LatLngLiteral[];
  raw: any;
};

const MAPBOX_ISOCHRONE_BASE_URL = "https://api.mapbox.com/isochrone/v1/mapbox";

function getMapboxToken(): string {
  const token =
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_ACCESS_TOKEN ?? "";
  return String(token).trim();
}

function normalizeMinutes(value: number | undefined): number {
  const parsed = Number(value ?? 10);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(60, Math.max(1, Math.round(parsed)));
}

function toLatLngPathFromPolygonCoordinates(coordinates: any): LatLngLiteral[] {
  if (!Array.isArray(coordinates) || !Array.isArray(coordinates[0])) return [];
  const outerRing = coordinates[0];
  return outerRing
    .map((pair: any) => {
      if (!Array.isArray(pair) || pair.length < 2) return null;
      const lng = Number(pair[0]);
      const lat = Number(pair[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    })
    .filter(Boolean) as LatLngLiteral[];
}

function extractPolygonPath(features: any[]): LatLngLiteral[] {
  for (const feature of features) {
    const geometry = feature?.geometry;
    if (!geometry?.type || !geometry?.coordinates) continue;

    if (geometry.type === "Polygon") {
      const path = toLatLngPathFromPolygonCoordinates(geometry.coordinates);
      if (path.length >= 3) return path;
    }

    if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
      for (const polygonCoords of geometry.coordinates) {
        const path = toLatLngPathFromPolygonCoordinates(polygonCoords);
        if (path.length >= 3) return path;
      }
    }
  }

  return [];
}

export async function getIsocroneFromMapbox(
  lat: number,
  lng: number,
  options: IsochroneOptions = {},
): Promise<IsochroneResult> {
  const token = getMapboxToken();
  if (!token) {
    throw new Error("Falta NEXT_PUBLIC_ACCESS_TOKEN o NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN en .env");
  }

  const profile = options.profile ?? "driving";
  const minutes = normalizeMinutes(options.minutes);
  const visualization = options.visualization ?? "polygon";

  const params = new URLSearchParams({
    contours_minutes: String(minutes),
    polygons: "true",
    access_token: token,
  });

  const url = `${MAPBOX_ISOCHRONE_BASE_URL}/${profile}/${lng},${lat}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Mapbox Isochrone HTTP ${response.status}`);
  }

  const geoJson = await response.json();
  console.log("MAPBOX_ISO_GEOJSON:", geoJson);

  const features = Array.isArray(geoJson?.features) ? geoJson.features : [];
  const polygonPaths = extractPolygonPath(features);

  if (!features.length) {
    throw new Error("Mapbox no devolvio features para la isocrona.");
  }

  if (!polygonPaths.length && visualization === "polygon") {
    throw new Error("Mapbox devolvio la isocrona sin coordenadas de poligono utilizables.");
  }

  return {
    source: "mapbox",
    profile,
    minutes,
    visualization,
    features,
    polygonPaths,
    raw: geoJson,
  };
}
