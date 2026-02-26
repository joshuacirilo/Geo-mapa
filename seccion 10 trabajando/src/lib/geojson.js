const POLYGON_TYPES = new Set(['Polygon', 'MultiPolygon']);
const MAX_INPUT_FEATURES = 3000;

const isObject = (value) => typeof value === 'object' && value !== null;

const isGeometry = (value) => isObject(value) && typeof value.type === 'string';

const isPolygonGeometry = (geometry) => isGeometry(geometry) && POLYGON_TYPES.has(geometry.type);

const collectPolygonGeometries = (value, bucket) => {
  if (!isObject(value)) return;

  if (value.type === 'FeatureCollection') {
    const features = Array.isArray(value.features) ? value.features : [];
    for (const feature of features) {
      collectPolygonGeometries(feature, bucket);
    }
    return;
  }

  if (value.type === 'Feature') {
    collectPolygonGeometries(value.geometry, bucket);
    return;
  }

  if (value.type === 'GeometryCollection' && Array.isArray(value.geometries)) {
    for (const geometry of value.geometries) {
      collectPolygonGeometries(geometry, bucket);
    }
    return;
  }

  if (isPolygonGeometry(value)) {
    bucket.push(value);
  }
};

export function extractGeometries(input) {
  const source = isObject(input) && input.geojson ? input.geojson : input;
  const geometries = [];
  collectPolygonGeometries(source, geometries);

  if (geometries.length === 0) {
    return { error: 'No se encontraron geometrías Polygon/MultiPolygon válidas.' };
  }

  if (geometries.length > MAX_INPUT_FEATURES) {
    return {
      error: `El máximo de figuras permitidas es ${MAX_INPUT_FEATURES}.`
    };
  }

  return { geometries };
}

export function chooseTolerance(zoomInput) {
  const zoom = Number.isFinite(Number(zoomInput)) ? Number(zoomInput) : 13;

  if (zoom <= 11) return 25;
  if (zoom <= 13) return 10;
  if (zoom <= 15) return 5;
  return 2;
}

export function normalizeGeometryForDB(geometry) {
  return JSON.stringify(geometry);
}

export function normalizeZoom(zoomInput) {
  const zoom = Number.isFinite(Number(zoomInput)) ? Number(zoomInput) : 13;
  return Math.max(0, Math.min(22, Math.round(zoom)));
}

export const LIMITS = {
  maxInputFeatures: MAX_INPUT_FEATURES,
  maxOutputFeatures: 3000
};
