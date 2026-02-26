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
          p.way,
          p.name,
          p.landuse,
          p.natural AS natural_tag,
          p.leisure,
          p.water,
          CASE
            WHEN p.natural IN ('water', 'wetland')
              OR p.landuse IN ('reservoir', 'basin')
              OR p.water IS NOT NULL THEN 'water'
            WHEN p.landuse IN (
              'farmland',
              'orchard',
              'vineyard',
              'plant_nursery',
              'farmyard',
              'allotments',
              'greenhouse_horticulture'
            ) THEN 'farmland'
            WHEN p.leisure IN ('park', 'garden', 'nature_reserve')
              OR p.natural IN ('wood', 'scrub', 'grassland', 'heath', 'grass')
              OR p.landuse IN ('forest', 'grass', 'meadow', 'recreation_ground', 'village_green') THEN 'green'
            ELSE NULL
          END AS kind
        FROM planet_osm_polygon p
        JOIN selected_ctx s ON p.way && ST_Envelope(s.selected_3857)
        WHERE ST_Intersects(p.way, s.selected_3857)
      ),
      categorized AS (
        SELECT *
        FROM candidates
        WHERE landuse IS NOT NULL
          OR natural_tag IS NOT NULL
          OR leisure IS NOT NULL
          OR water IS NOT NULL
      ),
      clipped AS (
        SELECT
          c.kind,
          c.name,
          c.landuse,
          c.natural_tag,
          c.leisure,
          c.water,
          ST_Intersection(c.way, s.selected_3857) AS geom_3857
        FROM categorized c
        CROSS JOIN selected_ctx s
      ),
      simplified AS (
        SELECT
          kind,
          name,
          landuse,
          natural_tag,
          leisure,
          water,
          ST_Transform(
            ST_SimplifyPreserveTopology(geom_3857, (SELECT tolerance_m FROM input)),
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
        SELECT
          COUNT(*) FILTER (WHERE kind = 'green')::int AS green,
          COUNT(*) FILTER (WHERE kind = 'water')::int AS water,
          COUNT(*) FILTER (WHERE kind = 'farmland')::int AS farmland,
          COUNT(*) FILTER (WHERE kind IS NULL)::int AS uncategorized,
          COUNT(*)::int AS total_count
        FROM valid_output
      ),
      available_landuse AS (
        SELECT
          landuse AS value,
          COUNT(*)::int AS count
        FROM candidates
        WHERE landuse IS NOT NULL
        GROUP BY landuse
        ORDER BY count DESC
        LIMIT 12
      ),
      available_natural AS (
        SELECT
          natural_tag AS value,
          COUNT(*)::int AS count
        FROM candidates
        WHERE natural_tag IS NOT NULL
        GROUP BY natural_tag
        ORDER BY count DESC
        LIMIT 12
      ),
      available_leisure AS (
        SELECT
          leisure AS value,
          COUNT(*)::int AS count
        FROM candidates
        WHERE leisure IS NOT NULL
        GROUP BY leisure
        ORDER BY count DESC
        LIMIT 12
      ),
      available_water AS (
        SELECT
          water AS value,
          COUNT(*)::int AS count
        FROM candidates
        WHERE water IS NOT NULL
        GROUP BY water
        ORDER BY count DESC
        LIMIT 12
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
            'kind', kind,
            'name', name,
            'landuse', landuse,
            'natural', natural_tag,
            'leisure', leisure,
            'water', water
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
          'counts', jsonb_build_object(
            'green', COALESCE((SELECT green FROM counts), 0),
            'water', COALESCE((SELECT water FROM counts), 0),
            'farmland', COALESCE((SELECT farmland FROM counts), 0),
            'uncategorized', COALESCE((SELECT uncategorized FROM counts), 0)
          ),
          'available_categories', jsonb_build_object(
            'landuse', COALESCE((
              SELECT jsonb_agg(jsonb_build_object('value', value, 'count', count))
              FROM available_landuse
            ), '[]'::jsonb),
            'natural', COALESCE((
              SELECT jsonb_agg(jsonb_build_object('value', value, 'count', count))
              FROM available_natural
            ), '[]'::jsonb),
            'leisure', COALESCE((
              SELECT jsonb_agg(jsonb_build_object('value', value, 'count', count))
              FROM available_leisure
            ), '[]'::jsonb),
            'water', COALESCE((
              SELECT jsonb_agg(jsonb_build_object('value', value, 'count', count))
              FROM available_water
            ), '[]'::jsonb)
          ),
          'truncated', COALESCE((SELECT total_count FROM counts), 0) > (SELECT max_output FROM input)
        )
      ) AS payload;
    `;

    const payload = rows?.[0]?.payload;
    if (!payload) {
      return Response.json({ error: 'No fue posible construir el overlay de polígonos.' }, { status: 500 });
    }

    return Response.json(payload);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('POST /api/osm/overlay-polygons failed:', detail);
    return Response.json(
      {
        error: 'Error interno al generar overlay de polígonos.',
        ...(process.env.NODE_ENV !== 'production' ? { detail } : {})
      },
      { status: 500 }
    );
  }
}
