import prisma from '../../../../lib/prisma';
import {
  LIMITS,
  chooseTolerance,
  extractGeometries,
  normalizeGeometryForDB,
  normalizeZoom
} from '../../../../lib/geojson';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const extracted = extractGeometries(body?.geojson ?? body);
    if (extracted.error) {
      return Response.json({ error: extracted.error }, { status: 400 });
    }

    const zoom = normalizeZoom(body?.zoom);
    const tolerance = chooseTolerance(zoom);
    const geomsJson = JSON.stringify(extracted.geometries.map(normalizeGeometryForDB).map(JSON.parse));

    const rows = await prisma.$queryRaw`
      WITH input AS (
        SELECT
          ${geomsJson}::jsonb AS geoms_json,
          CAST(${zoom} AS integer) AS zoom,
          CAST(${tolerance} AS double precision) AS tolerance_m,
          CAST(${LIMITS.maxOutputFeatures} AS integer) AS max_output
      ),
      source_geoms AS (
        SELECT ST_SetSRID(ST_GeomFromGeoJSON(g.value::text), 4326) AS geom
        FROM input i,
        LATERAL jsonb_array_elements(i.geoms_json) AS g(value)
      ),
      valid_geoms AS (
        SELECT ST_MakeValid(geom) AS geom
        FROM source_geoms
        WHERE geom IS NOT NULL
      ),
      selected AS (
        SELECT ST_UnaryUnion(ST_Collect(geom)) AS selected_geom_4326
        FROM valid_geoms
      ),
      selected_ctx AS (
        SELECT
          selected_geom_4326,
          ST_Transform(selected_geom_4326, 3857) AS selected_3857,
          ST_Area(ST_Transform(selected_geom_4326, 3857)) / 1000000.0 AS selected_area_km2
        FROM selected
        WHERE selected_geom_4326 IS NOT NULL
      ),
      candidates AS (
        SELECT
          l.way,
          l.name,
          l.waterway
        FROM planet_osm_line l
        JOIN selected_ctx s ON l.way && ST_Envelope(s.selected_3857)
        WHERE l.waterway IS NOT NULL
          AND ST_Intersects(l.way, s.selected_3857)
      ),
      clipped AS (
        SELECT
          c.name,
          c.waterway,
          ST_CollectionExtract(ST_Intersection(c.way, s.selected_3857), 2) AS geom_3857
        FROM candidates c
        CROSS JOIN selected_ctx s
      ),
      simplified AS (
        SELECT
          name,
          waterway,
          ST_Transform(
            ST_Simplify(geom_3857, (SELECT tolerance_m FROM input)),
            4326
          ) AS geom_4326
        FROM clipped
        WHERE NOT ST_IsEmpty(geom_3857)
      ),
      valid_output AS (
        SELECT *
        FROM simplified
        WHERE geom_4326 IS NOT NULL AND NOT ST_IsEmpty(geom_4326)
      ),
      counts AS (
        SELECT COUNT(*)::int AS total_count
        FROM valid_output
      ),
      limited AS (
        SELECT *
        FROM valid_output
        LIMIT (SELECT max_output FROM input)
      ),
      features AS (
        SELECT jsonb_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(geom_4326)::jsonb,
          'properties', jsonb_build_object(
            'kind', 'waterway',
            'waterway', waterway,
            'name', name
          )
        ) AS feature
        FROM limited
      )
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE((SELECT jsonb_agg(feature) FROM features), '[]'::jsonb),
        'meta', jsonb_build_object(
          'zoom', (SELECT zoom FROM input),
          'tolerance_m', (SELECT tolerance_m FROM input),
          'selected_area_km2', COALESCE((SELECT selected_area_km2 FROM selected_ctx), 0),
          'count', COALESCE((SELECT total_count FROM counts), 0),
          'truncated', COALESCE((SELECT total_count FROM counts), 0) > (SELECT max_output FROM input)
        )
      ) AS payload;
    `;

    const payload = rows?.[0]?.payload;
    if (!payload) {
      return Response.json({ error: 'No fue posible construir el overlay de vías de agua.' }, { status: 500 });
    }

    return Response.json(payload);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('POST /api/osm/waterways failed:', detail);
    return Response.json(
      {
        error: 'Error interno al generar vías de agua.',
        ...(process.env.NODE_ENV !== 'production' ? { detail } : {})
      },
      { status: 500 }
    );
  }
}
