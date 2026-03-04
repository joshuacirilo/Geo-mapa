import { getThirdIsoPolygonStyle, type IsoPolygonStyle } from "./thirdIsoStyle";

export type IsoStyleOption = "basica" | "segunda-opcion" | "tercera-opcion";

// Orden solicitado (centro -> exterior): azul, celeste, verde, limon, amarillo, rojo.
// Como el index 0 es el anillo exterior, usamos la secuencia invertida en runtime.
const SECOND_STYLE_CENTER_TO_OUTER = [
  "#2563eb", // azul
  "#38bdf8", // celeste
  "#22c55e", // verde
  "#60a5fa", // azul
  "#facc15", // amarillo
  "#dc2626", // rojo
];

function clampOpacity(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0.05, Math.min(1, value));
}

export function getIsoPolygonStyle(
  option: IsoStyleOption,
  feature: any,
  featureIndex: number,
): IsoPolygonStyle {
  if (option === "segunda-opcion") {
    const palette = [...SECOND_STYLE_CENTER_TO_OUTER].reverse(); // exterior -> centro
    const paletteIndex = featureIndex % palette.length;
    const strokeColor = palette[paletteIndex];
    const fillColor = strokeColor;
    const isOuterRing = featureIndex === 0;
    const isInnerRing = paletteIndex === palette.length - 1;
    return {
      fillColor,
      strokeColor,
      fillOpacity: isInnerRing ? 0.42 : 0.34,
      strokeOpacity: 1,
      strokeWeight: isOuterRing ? 3.2 : 2.2,
    };
  }

  if (option === "tercera-opcion") {
    const thirdStyle = getThirdIsoPolygonStyle(feature, featureIndex);
    return {
      ...thirdStyle,
      strokeOpacity: 0,
      strokeWeight: 0,
    };
  }

  const baseFillColor = String(
    feature?.properties?.fillColor ?? feature?.properties?.fill ?? "#ef4444",
  );
  const rawFillOpacity = Number(
    feature?.properties?.["fill-opacity"] ?? feature?.properties?.fillOpacity ?? 0.18,
  );

  return {
    fillColor: baseFillColor,
    strokeColor: baseFillColor,
    fillOpacity: clampOpacity(rawFillOpacity, 0.18),
    strokeOpacity: 0,
    strokeWeight: 0,
  };
}
