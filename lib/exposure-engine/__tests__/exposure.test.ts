import { describe, expect, it } from 'vitest';
import {
  calcHouseholdExposure,
  compareRoutineImpact,
  getRiskBand,
  pm25ToCpcbAqi,
  SHARMA_FAMILY_TWIN,
  MEENA_EQUITY_TWIN,
  simulateIndoorMassBalance,
} from '../index';

const SAMPLE_WINTER_SMOG_HOURLY_PM25 = [
  240, 250, 260, 275, 290, 310, // 00-05: inversion builds
  325, 315, 285, 240, 195, 165, // 06-11: morning peak then sun breaks inversion
  145, 135, 130, 140, 160, 195, // 12-17: afternoon trough
  235, 270, 295, 305, 290, 265, // 18-23: evening inversion + traffic
];

describe('Exposure Engine - Deterministic Core', () => {
  it('converts PM2.5 to CPCB AQI accurately across breakpoints', () => {
    expect(pm25ToCpcbAqi(0)).toBe(0);
    expect(pm25ToCpcbAqi(30)).toBe(50);
    expect(pm25ToCpcbAqi(60)).toBe(100);
    expect(pm25ToCpcbAqi(120)).toBe(300);
    expect(pm25ToCpcbAqi(250)).toBe(400);
  });

  it('assigns higher exposure score to asthmatic elderly member than healthy adult in same city', () => {
    const summary = calcHouseholdExposure(
      SHARMA_FAMILY_TWIN,
      SAMPLE_WINTER_SMOG_HOURLY_PM25
    );
    const dadi = summary.members.find((m) => m.memberId === 'dadi');
    const priya = summary.members.find((m) => m.memberId === 'priya');

    expect(dadi).toBeDefined();
    expect(priya).toBeDefined();
    expect(dadi!.dailyExposureScore).toBeGreaterThan(priya!.dailyExposureScore);
    expect(summary.highestRiskMember?.memberId).toBe('dadi');
  });

  it('quantifies real exposure reduction when shifting 6am walk to 3pm and running purifier', () => {
    const dadi = SHARMA_FAMILY_TWIN.members[0];
    const modifiedDadi = {
      ...dadi,
      schedule: dadi.schedule.map((slot) => {
        if (slot.id === 'dadi-walk') {
          return {
            ...slot,
            startHour: 15,
            endHour: 16,
            maskN95: true,
          };
        }
        return { ...slot, windowsOpen: false, purifierOn: true };
      }),
    };

    const impact = compareRoutineImpact(
      dadi,
      SHARMA_FAMILY_TWIN.home,
      modifiedDadi,
      { ...SHARMA_FAMILY_TWIN.home, doorGapSealed: true },
      SAMPLE_WINTER_SMOG_HOURLY_PM25
    );

    expect(impact.scoreSaved).toBeGreaterThan(0);
    expect(impact.percentSaved).toBeGreaterThan(25);
  });

  it('detects severe indoor exposure in biomass-cooking equity persona', () => {
    const summary = calcHouseholdExposure(
      MEENA_EQUITY_TWIN,
      SAMPLE_WINTER_SMOG_HOURLY_PM25
    );
    expect(summary.members[0].timeWeightedPm25).toBeGreaterThan(100);
    expect(['poor', 'very_poor', 'severe']).toContain(
      summary.members[0].riskBand
    );
  });

  it('simulates indoor mass-balance ODE with purifier reducing indoor PM2.5 significantly', () => {
    const sim = simulateIndoorMassBalance({
      outdoorHourlyPm25: SAMPLE_WINTER_SMOG_HOURLY_PM25,
      roomVolumeM3: 40,
      homeType: 'apartment_low',
      windowsFacingRoad: true,
      windowsOpen: false,
      doorGapSealed: true,
      purifierType: 'hepa_standard',
      purifierOn: true,
      cookingFuel: 'png_piped',
      cookingHours: [8, 20],
      hasChimney: true,
    });

    expect(sim.points).toHaveLength(24);
    expect(sim.simulatedMeanPm25).toBeLessThan(sim.baselineMeanPm25);
    expect(sim.reductionPercent).toBeGreaterThan(40);
  });

  it('maps risk bands deterministically', () => {
    expect(getRiskBand(25).band).toBe('good');
    expect(getRiskBand(55).band).toBe('satisfactory');
    expect(getRiskBand(110).band).toBe('poor');
    expect(getRiskBand(260).band).toBe('severe');
  });
});
