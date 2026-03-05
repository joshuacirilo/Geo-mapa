import type { MapboxProfile } from "../components/isocrone";

export type TrafficMinutesSelection = "15" | "30" | "45" | "interval-15";

export const TRAFFIC_ISO_PROFILE: MapboxProfile = "driving-traffic";

export function resolveTrafficMinutes(selection: TrafficMinutesSelection): number | number[] {
  if (selection === "interval-15") return [15, 30, 45];
  return Number(selection);
}

export function normalizeDepartAt(value: string): string | undefined {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;
  return trimmed;
}

