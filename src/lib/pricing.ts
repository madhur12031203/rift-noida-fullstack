/**
 * Pricing logic per provider (Uber, Ola, Rapido).
 * Uses distance (meters) and duration to compute fare.
 */

import type { FareResult } from "@/types";

// Example base + per-km rates (replace with real logic)
const RATES = {
  Uber: { base: 40, perKm: 18, perMin: 1.5 },
  Ola: { base: 35, perKm: 16, perMin: 1.2 },
  Rapido: { base: 30, perKm: 14, perMin: 1 },
} as const;

export function calculateFares(
  distanceMeters: number,
  durationMinutes: number
): FareResult[] {
  const km = distanceMeters / 1000;

  return [
    {
      provider: "Uber",
      price: Math.round(
        RATES.Uber.base + RATES.Uber.perKm * km + RATES.Uber.perMin * durationMinutes
      ),
      duration: `~${Math.round(durationMinutes)} min`,
      distance: `${km.toFixed(1)} km`,
      icon: "uber.png",
    },
    {
      provider: "Ola",
      price: Math.round(
        RATES.Ola.base + RATES.Ola.perKm * km + RATES.Ola.perMin * durationMinutes
      ),
      duration: `~${Math.round(durationMinutes)} min`,
      distance: `${km.toFixed(1)} km`,
      icon: "ola.png",
    },
    {
      provider: "Rapido",
      price: Math.round(
        RATES.Rapido.base + RATES.Rapido.perKm * km + RATES.Rapido.perMin * durationMinutes
      ),
      duration: `~${Math.round(durationMinutes)} min`,
      distance: `${km.toFixed(1)} km`,
      icon: "rapido.png",
    },
  ];
}
