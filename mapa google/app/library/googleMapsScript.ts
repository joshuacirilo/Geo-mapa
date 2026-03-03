const GOOGLE_MAPS_SCRIPT_BASE_URL = "https://maps.googleapis.com/maps/api/js";

export function getGoogleMapsScriptSrc(apiKey: string, libraries: string[] = []): string {
  const params = new URLSearchParams({
    key: apiKey,
    v: "beta",
  });

  if (libraries.length > 0) {
    params.set("libraries", libraries.join(","));
  }

  return `${GOOGLE_MAPS_SCRIPT_BASE_URL}?${params.toString()}`;
}

