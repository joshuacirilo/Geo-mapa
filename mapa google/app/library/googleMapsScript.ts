const GOOGLE_MAPS_SCRIPT_BASE_URL = "/api/google-maps-js";

export function getGoogleMapsScriptSrc(libraries: string[] = []): string {
  const params = new URLSearchParams({
    v: "beta",
  });

  if (libraries.length > 0) {
    params.set("libraries", libraries.join(","));
  }

  return `${GOOGLE_MAPS_SCRIPT_BASE_URL}?${params.toString()}`;
}
