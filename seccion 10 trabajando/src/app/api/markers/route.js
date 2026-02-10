import prisma from '../../../lib/prisma';

export const runtime = 'nodejs';

const isValidLat = (lat) => typeof lat === 'number' && lat >= -90 && lat <= 90;
const isValidLng = (lng) => typeof lng === 'number' && lng >= -180 && lng <= 180;

const toFeature = (marker) => ({
  type: 'Feature',
  id: marker.id_public,
  geometry: marker.geojson,
  properties: {
    title: marker.title,
    categoria: marker.categoria
  }
});

export async function GET() {
  const markers = await prisma.marker.findMany();
  const featureCollection = {
    type: 'FeatureCollection',
    features: markers.map(toFeature)
  };
  return Response.json(featureCollection);
}

export async function POST(request) {
  const body = await request.json();

  const id_public = body?.id_public?.trim();
  const title = body?.title?.trim();
  const categoria = body?.categoria?.trim();

  const lat = typeof body?.lat === 'string' ? Number(body.lat) : body?.lat;
  const lng = typeof body?.lng === 'string' ? Number(body.lng) : body?.lng;
  const geojson = body?.geojson ?? null;

  if (!id_public || !title || !categoria) {
    return Response.json({ error: 'id_public, title y categoria son requeridos.' }, { status: 400 });
  }

  let point = geojson;
  if (!point) {
    if (!isValidLat(lat) || !isValidLng(lng)) {
      return Response.json({ error: 'Coordenadas invalidas.' }, { status: 400 });
    }
    point = { type: 'Point', coordinates: [lng, lat] };
  }

  const existing = await prisma.marker.findUnique({ where: { id_public } });
  if (existing) {
    return Response.json({ error: 'id_public ya existe.' }, { status: 409 });
  }

  const created = await prisma.marker.create({
    data: {
      id_public,
      title,
      categoria,
      geojson: point
    }
  });

  return Response.json(created, { status: 201 });
}
