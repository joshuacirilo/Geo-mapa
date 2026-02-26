import prisma from '../../../../lib/prisma';
import { extractGeometry, validatePolygonGeometry } from '../../../../lib/geo/extractGeometry';

export const runtime = 'nodejs';

/**
 * @typedef {Object} AnalyzeGeoResponse
 * @property {number} area_total_m2
 * @property {number} vegetacion_pct
 * @property {number} built_up_pct
 * @property {number} other_pct
 * @property {{ srid: number, classes_used: { veg: number[], built: number[] } }} meta
 */

const SRID = 4326;
const VEG_CLASSES = [10, 20, 30];
const BUILT_CLASSES = [50];
const DEFAULT_MAX_COORDS = 15000;
const MAX_COORDS = Number(process.env.GEO_MAX_COORDS ?? DEFAULT_MAX_COORDS);

const round2 = (value) => Number(Number(value ?? 0).toFixed(2));

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export async function POST(request) {
  try {
    const body = await request.json();
    const extracted = extractGeometry(body);

    if (extracted.error) {
      return Response.json({ error: extracted.error }, { status: 400 });
    }

    const validation = validatePolygonGeometry(extracted.geometry, MAX_COORDS);
    if (validation.error) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const geometryJson = JSON.stringify(extracted.geometry);

    const rows = await prisma.$queryRaw`
      WITH input_geom AS (
        SELECT ST_SetSRID(
          ST_GeomFromGeoJSON(${geometryJson}),
          CAST(${SRID} AS integer)
        ) AS geom
      ),
      geom_check AS (
        SELECT
          geom,
          ST_IsValid(geom) AS is_valid,
          GeometryType(geom) AS geom_type,
          ST_Area(ST_Transform(geom, 3857)) AS area_total_m2
        FROM input_geom
      ),
      clipped AS (
        SELECT ST_Clip(w.rast, g.geom, true) AS rast_clip
        FROM geo_data.worldcover_gt w
        JOIN geom_check g
          ON g.is_valid = true
         AND ST_Intersects(w.rast, g.geom)
      ),
      value_counts AS (
        SELECT
          (vc).value::int AS class_value,
          SUM((vc).count)::bigint AS pixel_count
        FROM (
          SELECT ST_ValueCount(rast_clip, 1, true) AS vc
          FROM clipped
        ) s
        WHERE vc IS NOT NULL
        GROUP BY (vc).value
      ),
      totals AS (
        SELECT
          COALESCE(SUM(pixel_count), 0)::double precision AS total_pixels,
          COALESCE(SUM(CASE WHEN class_value IN (10, 20, 30) THEN pixel_count ELSE 0 END), 0)::double precision AS veg_pixels,
          COALESCE(SUM(CASE WHEN class_value IN (50) THEN pixel_count ELSE 0 END), 0)::double precision AS built_pixels
        FROM value_counts
      )
      SELECT
        g.is_valid,
        g.geom_type,
        g.area_total_m2::double precision AS area_total_m2,
        t.total_pixels,
        CASE WHEN t.total_pixels > 0 THEN (t.veg_pixels / t.total_pixels) * 100 ELSE 0 END AS vegetacion_pct,
        CASE WHEN t.total_pixels > 0 THEN (t.built_pixels / t.total_pixels) * 100 ELSE 0 END AS built_up_pct
      FROM geom_check g
      CROSS JOIN totals t;
    `;

    const result = rows?.[0];
    if (!result) {
      return Response.json({ error: 'No fue posible procesar la geometria.' }, { status: 400 });
    }

    if (!result.is_valid) {
      return Response.json({ error: 'El poligono no es valido (ST_IsValid=false).' }, { status: 400 });
    }

    if (result.geom_type !== 'POLYGON' && result.geom_type !== 'MULTIPOLYGON') {
      return Response.json(
        { error: `Tipo de geometria no soportado por backend: ${result.geom_type}.` },
        { status: 400 }
      );
    }

    const vegetacionPct = round2(result.vegetacion_pct);
    const builtUpPct = round2(result.built_up_pct);
    const otherPct = round2(clamp(100 - (vegetacionPct + builtUpPct), 0, 100));

    const response = {
      area_total_m2: round2(result.area_total_m2),
      vegetacion_pct: vegetacionPct,
      built_up_pct: builtUpPct,
      other_pct: otherPct,
      meta: {
        srid: SRID,
        classes_used: {
          veg: VEG_CLASSES,
          built: BUILT_CLASSES
        }
      }
    };

    // Optional cache pattern (if you later create table zone_metrics):
    // 1) normalize geometry JSON
    // 2) create sha256 hash
    // 3) read/write cached metrics by hash + class version

    return Response.json(response);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('POST /api/geo/analyze failed:', detail);
    return Response.json(
      {
        error: 'Error interno al analizar geometrias.',
        ...(process.env.NODE_ENV !== 'production' ? { detail } : {})
      },
      { status: 500 }
    );
  }
}
