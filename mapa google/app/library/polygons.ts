export type LatLngLiteral = { lat: number; lng: number };

type GoogleAny = any;

function normalizePath(points: any[]): LatLngLiteral[] {
  return points
    .map((pair: any) => {
      if (!Array.isArray(pair) || pair.length < 2) return null;
      const lng = Number(pair[0]);
      const lat = Number(pair[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    })
    .filter(Boolean) as LatLngLiteral[];
}

export function geoJsonGeometryToPolygonPaths(geometry: any): LatLngLiteral[][] {
  if (!geometry?.type || !geometry?.coordinates) return [];

  if (geometry.type === "Polygon") {
    const outerRing = geometry.coordinates[0];
    const path = normalizePath(outerRing);
    return path.length >= 3 ? [path] : [];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((polygon: any) => normalizePath(polygon?.[0] ?? []))
      .filter((path: LatLngLiteral[]) => path.length >= 3);
  }

  return [];
}

export function createGooglePolygonFromCoords(
  googleAny: GoogleAny,
  coords: LatLngLiteral[],
  options: Record<string, any> = {},
): any {
  return new googleAny.maps.Polygon({
    paths: coords,
    ...options,
  });
}

export function figureToPolygonPaths(googleAny: GoogleAny, figure: any): LatLngLiteral[][] {
  if (!googleAny || !figure) return [];

  if (figure instanceof googleAny.maps.Polygon) {
    const path = figure
      .getPath()
      .getArray()
      .map((point: any) => ({ lat: point.lat(), lng: point.lng() }));
    return path.length >= 3 ? [path] : [];
  }

  if (figure instanceof googleAny.maps.Circle) {
    const center = figure.getCenter();
    const radius = figure.getRadius();
    if (!center || !Number.isFinite(radius) || radius <= 0) return [];

    const segments = 64;
    const path: LatLngLiteral[] = [];
    for (let i = 0; i < segments; i += 1) {
      const heading = (i / segments) * 360;
      const point = googleAny.maps.geometry.spherical.computeOffset(center, radius, heading);
      path.push({ lat: point.lat(), lng: point.lng() });
    }
    return path.length >= 3 ? [path] : [];
  }

  if (figure instanceof googleAny.maps.Polyline) {
    const path = figure
      .getPath()
      .getArray()
      .map((point: any) => ({ lat: point.lat(), lng: point.lng() }));
    if (path.length < 3) return [];
    return [[...path, path[0]]];
  }

  return [];
}

