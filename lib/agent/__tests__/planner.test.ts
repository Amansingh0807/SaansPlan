import { describe, expect, it } from 'vitest';
import { generateDailyCleanAirPlan } from '../planner';
import { SHARMA_FAMILY_TWIN, MEENA_EQUITY_TWIN } from '@/lib/exposure-engine';
import type { EnvironmentalSnapshot } from '@/lib/data/environment';

const MOCK_ENV_SNAPSHOT: EnvironmentalSnapshot = {
  city: 'New Delhi',
  locality: 'Rohini Sector 13',
  lat: 28.7041,
  lon: 77.1025,
  currentPm25: 280,
  currentPm10: 410,
  currentAqi: 330,
  windSpeedKmh: 4.5,
  boundaryLayerHeightM: 290,
  temperatureC: 15.2,
  inversionRisk: 'high',
  stubbleFireCount: 156,
  stubbleFireNote: 'Regional smoke plume active',
  hourlyPm25: [
    240, 250, 260, 275, 290, 310, 325, 315, 285, 240, 195, 165, 145, 135,
    130, 140, 160, 195, 235, 270, 295, 305, 290, 265,
  ],
  bestOutdoorWindow: { startHour: 13, endHour: 15, meanPm25: 132 },
  worstOutdoorWindow: { startHour: 6, endHour: 8, meanPm25: 320 },
  source: 'Mock Winter Smog',
  isStale: false,
  fetchedAt: new Date().toISOString(),
};

describe('Agentic Planner - Clean Air Plan Generation', () => {
  it('generates deterministic candidate actions verified against exposure engine', async () => {
    const plan = await generateDailyCleanAirPlan(SHARMA_FAMILY_TWIN, MOCK_ENV_SNAPSHOT, 'en');

    expect(plan.householdId).toBe(SHARMA_FAMILY_TWIN.id);
    expect(plan.actions.length).toBeGreaterThan(0);
    expect(plan.totalPotentialReductionPercent).toBeGreaterThan(0);
    expect(plan.totalPotentialReductionPercent).toBeLessThanOrEqual(72);

    for (const action of plan.actions) {
      expect(action.percentExposureSaved).toBeGreaterThan(0);
      expect(action.pm25SavedUgM3).toBeGreaterThan(0);
      expect(action.citation).toBeDefined();
      expect(action.reason).toBeTruthy();
    }
  });

  it('generates localized copy in Hindi and Hinglish', async () => {
    const hiPlan = await generateDailyCleanAirPlan(SHARMA_FAMILY_TWIN, MOCK_ENV_SNAPSHOT, 'hi');
    const hinglishPlan = await generateDailyCleanAirPlan(SHARMA_FAMILY_TWIN, MOCK_ENV_SNAPSHOT, 'hinglish');

    expect(hiPlan.language).toBe('hi');
    expect(hiPlan.summaryHeadline).toContain('AQI');
    expect(hinglishPlan.language).toBe('hinglish');
    expect(hinglishPlan.summaryHeadline).toContain('AQI');
  });

  it('proposes DIY Corsi-Rosenthal and biomass ventilation actions for Meena equity persona', async () => {
    const plan = await generateDailyCleanAirPlan(MEENA_EQUITY_TWIN, MOCK_ENV_SNAPSHOT, 'en');

    const diyAction = plan.actions.find((a) => a.actionType === 'diy_corsi');
    const ventAction = plan.actions.find((a) => a.actionType === 'cooking_vent');

    expect(diyAction).toBeDefined();
    expect(diyAction!.title).toContain('Corsi-Rosenthal');
    expect(ventAction).toBeDefined();
  });
});
