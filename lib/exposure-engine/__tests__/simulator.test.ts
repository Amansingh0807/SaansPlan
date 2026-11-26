import { describe, expect, it } from 'vitest';
import { simulateIndoorMassBalance } from '../simulator';
import type { IndoorSimInput } from '../types';

const UNIFORM_OUTDOOR_PM25 = Array(24).fill(200);

describe('Indoor Simulator - Mass-Balance ODE Integration', () => {
  const baseInput: IndoorSimInput = {
    outdoorHourlyPm25: UNIFORM_OUTDOOR_PM25,
    roomVolumeM3: 40,
    homeType: 'apartment_low',
    windowsFacingRoad: false,
    windowsOpen: false,
    doorGapSealed: false,
    purifierType: 'none',
    purifierOn: false,
    cookingFuel: 'png_piped',
    cookingHours: [8, 20],
    hasChimney: true,
  };

  it('generates exactly 24 time steps representing hours 00:00 to 23:00', () => {
    const result = simulateIndoorMassBalance(baseInput);
    expect(result.points).toHaveLength(24);
    expect(result.points[0].hour).toBe(0);
    expect(result.points[23].hour).toBe(23);
  });

  it('proves that running a HEPA purifier reduces indoor PM2.5 significantly', () => {
    const baseline = simulateIndoorMassBalance(baseInput);
    const withPurifier = simulateIndoorMassBalance({
      ...baseInput,
      purifierType: 'hepa_standard',
      purifierOn: true,
    });

    expect(withPurifier.simulatedMeanPm25).toBeLessThan(baseline.simulatedMeanPm25);
    expect(withPurifier.reductionPercent).toBeGreaterThan(40);
  });

  it('demonstrates that DIY Corsi-Rosenthal box achieves substantial filtration (~220 CADR)', () => {
    const diy = simulateIndoorMassBalance({
      ...baseInput,
      purifierType: 'corsi_rosenthal_diy',
      purifierOn: true,
    });

    expect(diy.reductionPercent).toBeGreaterThan(35);
    expect(diy.simulatedPeakPm25).toBeLessThan(diy.baselinePeakPm25);
  });

  it('proves biomass chulha creates dangerous indoor PM2.5 spikes compared to induction', () => {
    const induction = simulateIndoorMassBalance({
      ...baseInput,
      cookingFuel: 'induction',
    });
    const chulha = simulateIndoorMassBalance({
      ...baseInput,
      cookingFuel: 'biomass_chulha',
      hasChimney: false,
    });

    expect(chulha.simulatedPeakPm25).toBeGreaterThan(induction.simulatedPeakPm25);
    expect(chulha.simulatedMeanPm25).toBeGreaterThan(induction.simulatedMeanPm25);
  });

  it('validates that an active kitchen exhaust chimney dampens the cooking spike', () => {
    const noChimney = simulateIndoorMassBalance({
      ...baseInput,
      cookingFuel: 'lpg_no_chimney',
      hasChimney: false,
    });
    const withChimney = simulateIndoorMassBalance({
      ...baseInput,
      cookingFuel: 'lpg_chimney',
      hasChimney: true,
    });

    expect(withChimney.simulatedPeakPm25).toBeLessThan(noChimney.simulatedPeakPm25);
  });

  it('handles small and large room volume edge cases safely without division by zero', () => {
    const tinyRoom = simulateIndoorMassBalance({
      ...baseInput,
      roomVolumeM3: 5, // below 15 clamp
    });
    const hugeRoom = simulateIndoorMassBalance({
      ...baseInput,
      roomVolumeM3: 250,
    });

    expect(tinyRoom.simulatedMeanPm25).toBeGreaterThan(0);
    expect(hugeRoom.simulatedMeanPm25).toBeGreaterThan(0);
    expect(Number.isFinite(tinyRoom.reductionPercent)).toBe(true);
  });
});
