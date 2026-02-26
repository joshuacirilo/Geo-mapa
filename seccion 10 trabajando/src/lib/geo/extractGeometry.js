const ALLOWED_GEOMETRY_TYPES = new Set(['Polygon', 'MultiPolygon']);

/**
 * @typedef {Object} GeoJsonGeometry
 * @property {string} type
 * @property {any} coordinates
 */

const isObject = (value) => typeof value === 'object' && value !== null;

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

const countCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates)) return 0;
  if (coordinates.length === 0) return 0;

  if (typeof coordinates[0] === 'number') {
    if (coordinates.length < 2) return 0;
    const lng = coordinates[0];
    const lat = coordinates[1];
    return isNumber(lng) && isNumber(lat) ? 1 : 0;
  }

  return coordinates.reduce((sum, child) => sum + countCoordinates(child), 0);
};

const isGeometry = (value) => isObject(value) && typeof value.type === 'string';

const getFeatureGeometry = (feature) => {
  if (!isObject(feature) || feature.type !== 'Feature') return null;
  if (!isGeometry(feature.geometry)) return null;
  return feature.geometry;
};

export function extractGeometry(input) {
  const candidate = isObject(input)
    ? input.geojson ?? input.geometry ?? input.feature ?? input
    : input;

  if (!isObject(candidate) || typeof candidate.type !== 'string') {
    return { error: 'No se encontro un GeoJSON valido en el body.' };
  }

  if (candidate.type === 'FeatureCollection') {
    const first = Array.isArray(candidate.features) ? candidate.features[0] : null;
    const geometry = getFeatureGeometry(first);
    if (!geometry) {
      return { error: 'FeatureCollection sin geometria utilizable.' };
    }
    return { geometry };
  }

  if (candidate.type === 'Feature') {
    const geometry = getFeatureGeometry(candidate);
    if (!geometry) {
      return { error: 'Feature sin geometry valida.' };
    }
    return { geometry };
  }

  if (!isGeometry(candidate)) {
    return { error: 'Objeto GeoJSON invalido.' };
  }

  return { geometry: candidate };
}

export function validatePolygonGeometry(geometry, maxCoordinates) {
  if (!isObject(geometry) || typeof geometry.type !== 'string') {
    return { error: 'Geometry requerida.' };
  }

  if (!ALLOWED_GEOMETRY_TYPES.has(geometry.type)) {
    return { error: 'Solo se admite geometry Polygon o MultiPolygon.' };
  }

  const totalCoords = countCoordinates(geometry.coordinates);
  if (totalCoords <= 0) {
    return { error: 'Geometry sin coordenadas validas.' };
  }

  if (totalCoords > maxCoordinates) {
    return {
      error: `Geometry excede el maximo permitido de coordenadas (${maxCoordinates}).`
    };
  }

  return { totalCoords };
}
