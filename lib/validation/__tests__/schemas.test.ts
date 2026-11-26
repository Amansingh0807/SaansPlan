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

  describe('HouseholdMemberSchema & HouseholdTwinSchema', () => {
    it('validates a complete household member model', () => {
      const validMember = {
        id: 'mem-1',
        name: 'Aarav Sharma',
        role: 'School Kid',
        age: 8,
        sensitivity: 'child_under_12',
        commuteMode: 'bus_open',
        schedule: [
          {
            id: 'slot-1',
            label: 'School Bus Commute',
            startHour: 7,
            endHour: 8,
            location: 'commute',
            activity: 'commute',
            commuteMode: 'bus_open',
            maskN95: true,
          },
        ],
      };
      expect(HouseholdMemberSchema.safeParse(validMember).success).toBe(true);

      const invalidAge = { ...validMember, age: -5 };
      expect(HouseholdMemberSchema.safeParse(invalidAge).success).toBe(false);
    });

    it('validates a full HouseholdTwin configuration', () => {
      const validTwin = {
        id: 'twin-101',
        name: 'Kapoor Residence',
        city: 'Delhi',
        locality: 'Dwarka Sector 10',
        pincode: '110075',
        lat: 28.59,
        lon: 77.05,
        budgetMode: false,
        home: {
          type: 'apartment_low',
          floor: 3,
          windowsFacingRoad: true,
          hasKitchenChimney: true,
          cookingFuel: 'png_piped',
          purifierType: 'hepa_standard',
          roomVolumeM3: 45,
          doorGapSealed: true,
        },
        members: [
          {
            id: 'mem-1',
            name: 'Sunita Kapoor',
            role: 'Mother',
            age: 36,
            sensitivity: 'standard',
            commuteMode: 'car_ac_recirc',
            schedule: [
              {
                id: 's-1',
                label: 'Office Work',
                startHour: 9,
                endHour: 17,
                location: 'indoor_school_office',
                activity: 'light_indoor',
              },
            ],
          },
        ],
      };
      expect(HouseholdTwinSchema.safeParse(validTwin).success).toBe(true);
    });
  });

  describe('ExposureRequestSchema', () => {
    it('validates valid exposure calculation request', () => {
      const validRequest = {
        household: {
          id: 'twin-202',
          name: 'Verma House',
          city: 'Noida',
          locality: 'Sector 62',
          pincode: '201309',
          lat: 28.62,
          lon: 77.37,
          budgetMode: false,
          home: {
            type: 'independent_house',
            floor: 1,
            windowsFacingRoad: false,
            hasKitchenChimney: false,
            cookingFuel: 'png_piped',
            purifierType: 'none',
            roomVolumeM3: 55,
            doorGapSealed: false,
          },
          members: [
            {
              id: 'm-1',
              name: 'Amit Verma',
              role: 'Consultant',
              age: 34,
              sensitivity: 'standard',
              commuteMode: 'wfh_indoor',
              schedule: [
                {
                  id: 's-1',
                  label: 'WFH Desk',
                  startHour: 9,
                  endHour: 18,
                  location: 'indoor_home',
                  activity: 'light_indoor',
                },
              ],
            },
          ],
        },
        hourlyPm25: Array.from({ length: 24 }, () => 150),
      };
      expect(ExposureRequestSchema.safeParse(validRequest).success).toBe(true);

      const invalidHourlyLength = {
        ...validRequest,
        hourlyPm25: [100, 200], // Must be exactly 24 hours
      };
      expect(ExposureRequestSchema.safeParse(invalidHourlyLength).success).toBe(false);
    });
  });
});
