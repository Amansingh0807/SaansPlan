import { describe, expect, it } from 'vitest';
import {
  ExposureRequestSchema,
  HomeProfileSchema,
  HouseholdMemberSchema,
  HouseholdTwinSchema,
  LedgerActionSchema,
  SimulateRequestSchema,
  TimeSlotSchema,
} from '../schemas';

describe('Validation Schemas - Strict Input Gatekeeping', () => {
  describe('TimeSlotSchema', () => {
    it('accepts valid time slot object', () => {
      const valid = {
        id: 'slot-1',
        label: 'Night Sleep',
        startHour: 0,
        endHour: 7,
        location: 'indoor_home',
        activity: 'sleep',
        windowsOpen: false,
        purifierOn: true,
      };
      const res = TimeSlotSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('rejects out-of-range hours or invalid locations', () => {
      const invalid = {
        id: 'slot-bad',
        label: 'Bad',
        startHour: -2,
        endHour: 28,
        location: 'spaceship',
        activity: 'sleep',
      };
      const res = TimeSlotSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it('rejects unknown fields under strict mode', () => {
      const extra = {
        id: 'slot-extra',
        label: 'Sleep',
        startHour: 0,
        endHour: 7,
        location: 'indoor_home',
        activity: 'sleep',
        hackedField: true,
      };
      const res = TimeSlotSchema.safeParse(extra);
      expect(res.success).toBe(false);
    });
  });

  describe('HomeProfileSchema', () => {
    it('validates building envelope and appliances', () => {
      const valid = {
        type: 'apartment_low',
        floor: 3,
        windowsFacingRoad: true,
        hasKitchenChimney: false,
        cookingFuel: 'png_piped',
        purifierType: 'hepa_standard',
        purifierCadrM3h: 260,
        roomVolumeM3: 40,
        doorGapSealed: false,
      };
      expect(HomeProfileSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects negative or impossible room volumes', () => {
      const invalid = {
        type: 'apartment_low',
        floor: 1,
        windowsFacingRoad: false,
        hasKitchenChimney: true,
        cookingFuel: 'induction',
        purifierType: 'none',
        roomVolumeM3: 2, // min 12
        doorGapSealed: true,
      };
      expect(HomeProfileSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('SimulateRequestSchema', () => {
    it('strictly requires 24 hourly PM2.5 data points', () => {
      const invalid = {
        outdoorHourlyPm25: [100, 200], // length must be 24
        roomVolumeM3: 40,
        homeType: 'apartment_low',
        windowsFacingRoad: false,
        windowsOpen: false,
        doorGapSealed: false,
        purifierType: 'none',
        purifierOn: false,
        cookingFuel: 'png_piped',
        cookingHours: [8],
        hasChimney: true,
      };
      expect(SimulateRequestSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('LedgerActionSchema', () => {
    it('validates verified before/after ledger savings', () => {
      const valid = {
        householdId: 'h-1',
        actionId: 'act-1',
        actionTitle: 'Shifted Walk',
        status: 'done',
        pm25SavedUgM3: 45.2,
        percentSaved: 38.5,
        co2SavedKg: 1.8,
        moneySavedInr: 50,
      };
      expect(LedgerActionSchema.safeParse(valid).success).toBe(true);
    });
  });
});
