import {
  COOKING_SOURCE_UG_PER_M3_PER_H,
  HOME_BASE_INFILTRATION,
  NATURAL_DECAY_RATE_PER_H,
  PURIFIER_DEFAULT_CADR_M3H,
  WHO_24H_PM25_GUIDELINE,
} from './constants';
import type { IndoorSimInput, IndoorSimPoint, IndoorSimResult } from './types';

/**
 * Simulates 24-hour indoor PM2.5 concentration using a single-zone mass-balance ODE:
 *   dC_in/dt = (k_inf * C_out) - (k_decay + CADR / V) * C_in + S_cook / V
 * Integrated in 15-minute (0.25h) steps for numerical stability.
 */
export function simulateIndoorMassBalance(
  input: IndoorSimInput
): IndoorSimResult {
  const dt = 0.25; // 15-minute step
  const stepsPerHour = 4;
  const volume = Math.max(15, input.roomVolumeM3);

  const baseInf = HOME_BASE_INFILTRATION[input.homeType];
  const roadFactor = input.windowsFacingRoad ? 1.12 : 1.0;

  // Baseline: windows closed, no purifier, current cooking fuel
  const baselineKInf = baseInf * roadFactor;
  const baselineRemoval = NATURAL_DECAY_RATE_PER_H;

  // Simulated: user's slider configuration
  let simKInf = baseInf * roadFactor;
  if (input.doorGapSealed) simKInf *= 0.84;
  if (input.windowsOpen) simKInf = Math.min(0.95, simKInf + 0.38);

  const cadr =
    input.purifierOn && input.purifierType !== 'none'
      ? input.customCadrM3h ?? PURIFIER_DEFAULT_CADR_M3H[input.purifierType]
      : 0;
  const simRemoval = NATURAL_DECAY_RATE_PER_H + cadr / volume;

  const cookingSet = new Set(input.cookingHours);
  let baseCookRate = COOKING_SOURCE_UG_PER_M3_PER_H[input.cookingFuel];
  if (input.hasChimney) baseCookRate *= 0.45;
  if (input.windowsOpen) baseCookRate *= 0.72;

  const initialOut = input.outdoorHourlyPm25[0] ?? 180;
  let cBase = initialOut * baselineKInf;
  let cSim = initialOut * simKInf;

  const points: IndoorSimPoint[] = [];

  for (let h = 0; h < 24; h++) {
    const cOut = Math.max(5, input.outdoorHourlyPm25[h] ?? initialOut);
    const isCooking = cookingSet.has(h);
    const cookInput = isCooking ? baseCookRate : 0;

    for (let s = 0; s < stepsPerHour; s++) {
      const dBase =
        (baselineKInf * cOut - baselineRemoval * cBase + cookInput) * dt;
      cBase = Math.max(5, cBase + dBase);

      const dSim = (simKInf * cOut - simRemoval * cSim + cookInput) * dt;
      cSim = Math.max(5, cSim + dSim);
    }

    points.push({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      outdoorPm25: Math.round(cOut),
      baselineIndoorPm25: Math.round(cBase * 10) / 10,
      simulatedIndoorPm25: Math.round(cSim * 10) / 10,
    });
  }

  const baselineMeanPm25 =
    Math.round(
      (points.reduce((a, p) => a + p.baselineIndoorPm25, 0) / points.length) *
        10
    ) / 10;
  const simulatedMeanPm25 =
    Math.round(
      (points.reduce((a, p) => a + p.simulatedIndoorPm25, 0) / points.length) *
        10
    ) / 10;

  const baselinePeakPm25 = Math.max(
    ...points.map((p) => p.baselineIndoorPm25)
  );
  const simulatedPeakPm25 = Math.max(
    ...points.map((p) => p.simulatedIndoorPm25)
  );

  const reductionPercent =
    baselineMeanPm25 > 0
      ? Math.round(
          ((baselineMeanPm25 - simulatedMeanPm25) / baselineMeanPm25) * 1000
        ) / 10
      : 0;

  return {
    points,
    baselineMeanPm25,
    simulatedMeanPm25,
    baselinePeakPm25,
    simulatedPeakPm25,
    reductionPercent,
    whoGuidelinePm25: WHO_24H_PM25_GUIDELINE,
  };
}
