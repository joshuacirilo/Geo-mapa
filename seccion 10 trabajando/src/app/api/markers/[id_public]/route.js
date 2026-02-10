import prisma from '../../../../lib/prisma';

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

export async function GET(_request, { params }) {
  const id_public = params?.id_public;
  if (!id_public) {
    return Response.json({ error: 'id_public requerido.' }, { status: 400 });
  }

  const marker = await prisma.marker.findUnique({ where: { id_public } });
  if (!marker) {
    return Response.json({ error: 'Marker no encontrado.' }, { status: 404 });
  }

  return Response.json(marker);
}

export async function PUT(request, { params }) {
  const id_public = params?.id_public;
  if (!id_public) {
    return Response.json({ error: 'id_public requerido.' }, { status: 400 });
  }

  const body = await request.json();

  const title = body?.title?.trim();
  const categoria = body?.categoria?.trim();
  const lat = typeof body?.lat === 'string' ? Number(body.lat) : body?.lat;
  const lng = typeof body?.lng === 'string' ? Number(body.lng) : body?.lng;
  const geojson = body?.geojson ?? null;

  const updates = {};
  if (title) updates.title = title;
  if (categoria) updates.categoria = categoria;

  if (geojson) {
    updates.geojson = geojson;
  } else if (lat !== undefined || lng !== undefined) {
    if (!isValidLat(lat) || !isValidLng(lng)) {
      return Response.json({ error: 'Coordenadas invalidas.' }, { status: 400 });
    }
    updates.geojson = { type: 'Point', coordinates: [lng, lat] };
  }

  try {
    const updated = await prisma.marker.update({
      where: { id_public },
      data: updates
    });
    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: 'Marker no encontrado.' }, { status: 404 });
  }
}

export async function PATCH(request, context) {
  return PUT(request, context);
}

export async function DELETE(_request, { params }) {
  const id_public = params?.id_public;
  if (!id_public) {
    return Response.json({ error: 'id_public requerido.' }, { status: 400 });
  }

  try {
    const deleted = await prisma.marker.delete({ where: { id_public } });
    return Response.json(deleted);
  } catch (error) {
    return Response.json({ error: 'Marker no encontrado.' }, { status: 404 });
  }
}
