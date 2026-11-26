import { describe, expect, it } from 'vitest';
import {
  calcHouseholdExposure,
  calcInfiltrationFactor,
  calcMemberExposure,
  calcSlotConcentration,
  compareRoutineImpact,
  getBreathingRate,
  getRiskBand,
  pm25ToCpcbAqi,
  SHARMA_FAMILY_TWIN,
  MEENA_EQUITY_TWIN,
} from '../index';
import type { HomeProfile, HouseholdMember, TimeSlot } from '../types';

const SAMPLE_WINTER_SMOG_HOURLY_PM25 = [
  240, 250, 260, 275, 290, 310, // 00-05: ground inversion builds
  325, 315, 285, 240, 195, 165, // 06-11: morning traffic peak then boundary layer rises
  145, 135, 130, 140, 160, 195, // 12-17: afternoon sunlight dispersion trough
  235, 270, 295, 305, 290, 265, // 18-23: evening inversion traps traffic emissions
];

describe('Exposure Engine - Core Mathematical Verification', () => {
  describe('pm25ToCpcbAqi()', () => {
    it('accurately maps to Indian National AQI breakpoints', () => {
      expect(pm25ToCpcbAqi(0)).toBe(0);
      expect(pm25ToCpcbAqi(15)).toBe(25);
      expect(pm25ToCpcbAqi(30)).toBe(50);
      expect(pm25ToCpcbAqi(60)).toBe(100);
      expect(pm25ToCpcbAqi(90)).toBe(200);
      expect(pm25ToCpcbAqi(120)).toBe(300);
      expect(pm25ToCpcbAqi(250)).toBe(400);
      expect(pm25ToCpcbAqi(500)).toBe(500);
    });

    it('handles negative or zero inputs safely without NaN', () => {
      expect(pm25ToCpcbAqi(-20)).toBe(0);
      expect(pm25ToCpcbAqi(0)).toBe(0);
    });

    it('caps severe hazardous concentrations smoothly', () => {
      const aqi600 = pm25ToCpcbAqi(600);
      const aqi1200 = pm25ToCpcbAqi(1200);
      expect(aqi600).toBeGreaterThan(500);
      expect(aqi1200).toBeLessThanOrEqual(999);
    });
  });

  describe('getRiskBand()', () => {
    it('assigns correct public health bands to PM2.5 levels', () => {
      expect(getRiskBand(15).band).toBe('good');
      expect(getRiskBand(30).band).toBe('good');
      expect(getRiskBand(45).band).toBe('satisfactory');
      expect(getRiskBand(75).band).toBe('moderate');
      expect(getRiskBand(105).band).toBe('poor');
      expect(getRiskBand(180).band).toBe('very_poor');
      expect(getRiskBand(320).band).toBe('severe');
    });

    it('provides bilingual labels for accessibility', () => {
      const band = getRiskBand(85);
      expect(band.label).toBe('Moderate');
      expect(band.labelHi).toContain('मध्यम');
    });
  });

  describe('getBreathingRate()', () => {
    it('scales minute ventilation by activity level', () => {
      const sleepRate = getBreathingRate('sleep', 30);
      const restRate = getBreathingRate('rest_indoor', 30);
      const walkRate = getBreathingRate('brisk_walk', 30);
      const playRate = getBreathingRate('outdoor_play', 30);

      expect(sleepRate).toBeLessThan(restRate);
      expect(restRate).toBeLessThan(walkRate);
      expect(walkRate).toBeLessThan(playRate);
    });

    it('applies physiological scaling for children and elderly', () => {
      const adultWalk = getBreathingRate('brisk_walk', 30);
      const childWalk = getBreathingRate('brisk_walk', 8);
      const elderWalk = getBreathingRate('brisk_walk', 70);

      expect(childWalk).toBeLessThan(adultWalk);
      expect(elderWalk).toBeLessThan(adultWalk);
      expect(childWalk).toBe(Number((adultWalk * 0.68).toFixed(3)));
      expect(elderWalk).toBe(Number((adultWalk * 0.88).toFixed(3)));
    });
  });

  describe('calcInfiltrationFactor()', () => {
    const baseHome: HomeProfile = {
      type: 'apartment_low',
      floor: 2,
      windowsFacingRoad: false,
      hasKitchenChimney: true,
      cookingFuel: 'png_piped',
      purifierType: 'none',
      roomVolumeM3: 40,
      doorGapSealed: false,
    };

    it('increases infiltration when windows face main road', () => {
      const clean = calcInfiltrationFactor(baseHome, false);
      const roadFacing = calcInfiltrationFactor(
        { ...baseHome, windowsFacingRoad: true },
        false
      );
      expect(roadFacing).toBeGreaterThan(clean);
    });

    it('decreases infiltration on high floors above surface boundary layer', () => {
      const lowFloor = calcInfiltrationFactor({ ...baseHome, floor: 2 }, false);
      const highFloor = calcInfiltrationFactor({ ...baseHome, floor: 12 }, false);
      expect(highFloor).toBeLessThan(lowFloor);
    });

    it('reduces infiltration when door gaps are sealed', () => {
      const unsealed = calcInfiltrationFactor(baseHome, false);
      const sealed = calcInfiltrationFactor({ ...baseHome, doorGapSealed: true }, false);
      expect(sealed).toBeLessThan(unsealed);
    });

    it('sharply increases infiltration when windows are open', () => {
      const closed = calcInfiltrationFactor(baseHome, false);
      const open = calcInfiltrationFactor(baseHome, true);
      expect(open).toBeGreaterThan(closed);
    });
  });

  describe('calcSlotConcentration()', () => {
    const home: HomeProfile = {
      type: 'apartment_low',
      floor: 3,
      windowsFacingRoad: true,
      hasKitchenChimney: true,
      cookingFuel: 'png_piped',
      purifierType: 'hepa_standard',
      purifierCadrM3h: 260,
      roomVolumeM3: 42,
      doorGapSealed: false,
    };

    it('drastically reduces indoor PM2.5 when purifier is active', () => {
      const slotOff: TimeSlot = {
        id: '1',
        label: 'Sleep',
        startHour: 0,
        endHour: 6,
        location: 'indoor_home',
        activity: 'sleep',
        purifierOn: false,
      };
      const slotOn: TimeSlot = {
        ...slotOff,
        purifierOn: true,
      };

      const concOff = calcSlotConcentration(250, slotOff, home);
      const concOn = calcSlotConcentration(250, slotOn, home);

      expect(concOn).toBeLessThan(concOff);
      expect(concOn).toBeLessThan(concOff * 0.4); // At least 60% attenuation
    });

    it('models roadside commute spikes and N95 protection efficiency', () => {
      const scooterSlot: TimeSlot = {
        id: '2',
        label: 'Scooter Commute',
        startHour: 9,
        endHour: 10,
        location: 'commute',
        activity: 'commute',
        commuteMode: 'two_wheeler',
        maskN95: false,
      };
      const maskedSlot: TimeSlot = {
        ...scooterSlot,
        maskN95: true,
      };

      const unmasked = calcSlotConcentration(200, scooterSlot, home);
      const masked = calcSlotConcentration(200, maskedSlot, home);

      expect(unmasked).toBeGreaterThan(200); // 1.48x on-road multiplier
      expect(masked).toBeLessThan(unmasked * 0.25); // ~82% filtration
    });
  });

  describe('calcMemberExposure() & calcHouseholdExposure()', () => {
    it('quantifies higher risk score for asthmatic member than healthy adult', () => {
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

    it('computes approximate cigarette equivalence reasonably', () => {
      const member = SHARMA_FAMILY_TWIN.members[0];
      const result = calcMemberExposure(
        member,
        SHARMA_FAMILY_TWIN.home,
        SAMPLE_WINTER_SMOG_HOURLY_PM25
      );
      expect(result.approxCigarettesPerDay).toBeGreaterThan(0);
      expect(result.approxCigarettesPerDay).toBeLessThan(30);
    });
  });

  describe('compareRoutineImpact()', () => {
    it('verifies exposure reduction when moving walk to afternoon sunlight slot', () => {
      const dadi = SHARMA_FAMILY_TWIN.members[0];
      const modifiedDadi: HouseholdMember = {
        ...dadi,
        schedule: dadi.schedule.map((slot) => {
          if (slot.id === 'dadi-walk') {
            return {
              ...slot,
              startHour: 14,
              endHour: 15,
              maskN95: true,
            };
          }
          return slot;
        }),
      };

      const impact = compareRoutineImpact(
        dadi,
        SHARMA_FAMILY_TWIN.home,
        modifiedDadi,
        SHARMA_FAMILY_TWIN.home,
        SAMPLE_WINTER_SMOG_HOURLY_PM25
      );

      expect(impact.scoreSaved).toBeGreaterThan(0);
      expect(impact.percentSaved).toBeGreaterThan(15);
      expect(impact.pm25SavedUgM3).toBeGreaterThan(5);
    });
  });
});
