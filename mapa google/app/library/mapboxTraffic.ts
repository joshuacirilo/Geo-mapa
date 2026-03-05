const MAPBOX_TRAFFIC_TILEJSON_URL =
  "https://api.mapbox.com/v4/mapbox.mapbox-traffic-v1.json";

function getMapboxToken(): string {
  const token =
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_ACCESS_TOKEN ?? "";
  return String(token).trim();
}

export async function fetchMapboxTrafficTileJson(): Promise<any> {
  const token = getMapboxToken();
  if (!token) {
    throw new Error("Falta token Mapbox para validar trafico.");
  }

  const url = `${MAPBOX_TRAFFIC_TILEJSON_URL}?access_token=${encodeURIComponent(token)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Mapbox Traffic HTTP ${response.status}`);
  }

  return response.json();
}

