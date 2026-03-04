export type IsoPolygonStyle = {
  fillColor: string;
  strokeColor: string;
  fillOpacity: number;
  strokeOpacity: number;
  strokeWeight: number;
};

const THIRD_STYLE_BY_MINUTES: Record<number, string> = {
  10: "#1A2B44",
  20: "#1D3D6E",
  30: "#3C3B82",
  40: "#7D3888",
  50: "#C23482",
};
const THIRD_STYLE_MINUTES = Object.keys(THIRD_STYLE_BY_MINUTES)
  .map(Number)
  .sort((a, b) => a - b);

function getClosestPaletteMinutes(contour: number): number {
  return THIRD_STYLE_MINUTES.reduce((closest, current) =>
    Math.abs(current - contour) < Math.abs(closest - contour) ? current : closest,
  );
}

export function getThirdIsoPolygonStyle(feature: any, featureIndex: number): IsoPolygonStyle {
  const contour = Number(feature?.properties?.contour);
  const minutesKey = Number.isFinite(contour)
    ? getClosestPaletteMinutes(contour)
    : THIRD_STYLE_MINUTES[featureIndex % THIRD_STYLE_MINUTES.length];
  const color = THIRD_STYLE_BY_MINUTES[minutesKey];
  const isOuterRing = featureIndex === 0;
  const isDarkBand = minutesKey <= 30;

  return {
    fillColor: color,
    strokeColor: color,
    fillOpacity: isDarkBand ? 0.42 : 0.5,
    strokeOpacity: 1,
    strokeWeight: isOuterRing ? 3 : 2.2,
  };
}
