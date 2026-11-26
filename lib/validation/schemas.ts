import { z } from 'zod';

export const TimeSlotSchema = z
  .object({
    id: z.string().min(1).max(64),
    label: z.string().min(1).max(100),
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(1).max(24),
    location: z.enum([
      'indoor_home',
      'indoor_school_office',
      'outdoor_road',
      'outdoor_park',
      'commute',
    ]),
    activity: z.enum([
      'sleep',
      'rest_indoor',
      'light_indoor',
      'cooking',
      'commute',
      'brisk_walk',
      'outdoor_play',
    ]),
    commuteMode: z
      .enum([
        'wfh_indoor',
        'metro_ac',
        'car_ac_recirc',
        'bus_open',
        'two_wheeler',
        'walk_cycle',
      ])
      .optional(),
    windowsOpen: z.boolean().optional(),
    purifierOn: z.boolean().optional(),
    maskN95: z.boolean().optional(),
    cookingActive: z.boolean().optional(),
  })
  .strict();

export const HomeProfileSchema = z
  .object({
    type: z.enum([
      'apartment_high',
      'apartment_low',
      'independent_house',
      'informal_settlement',
    ]),
    floor: z.number().int().min(0).max(60),
    windowsFacingRoad: z.boolean(),
    hasKitchenChimney: z.boolean(),
    cookingFuel: z.enum([
      'induction',
      'png_piped',
      'lpg_chimney',
      'lpg_no_chimney',
      'biomass_chulha',
    ]),
    purifierType: z.enum([
      'none',
      'hepa_standard',
      'hepa_high_cadr',
      'corsi_rosenthal_diy',
    ]),
    purifierCadrM3h: z.number().min(0).max(1200).optional(),
    roomVolumeM3: z.number().min(12).max(300),
    doorGapSealed: z.boolean(),
  })
  .strict();

export const HouseholdMemberSchema = z
  .object({
    id: z.string().min(1).max(64),
    name: z.string().min(1).max(80),
    role: z.string().min(1).max(80),
    age: z.number().int().min(0).max(115),
    sensitivity: z.enum([
      'standard',
      'child_under_12',
      'elderly_60_plus',
      'asthma_respiratory',
      'pregnant',
    ]),
    commuteMode: z.enum([
      'wfh_indoor',
      'metro_ac',
      'car_ac_recirc',
      'bus_open',
      'two_wheeler',
      'walk_cycle',
    ]),
    schedule: z.array(TimeSlotSchema).min(1).max(24),
  })
  .strict();

export const HouseholdTwinSchema = z
  .object({
    id: z.string().min(1).max(80),
    name: z.string().min(1).max(100),
    city: z.string().min(1).max(80),
    locality: z.string().min(1).max(100),
    pincode: z.string().min(4).max(12),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    budgetMode: z.boolean(),
    home: HomeProfileSchema,
    members: z.array(HouseholdMemberSchema).min(1).max(12),
  })
  .strict();

export const ExposureRequestSchema = z
  .object({
    household: HouseholdTwinSchema,
    hourlyPm25: z.array(z.number().min(0).max(1500)).length(24),
  })
  .strict();

export const SimulateRequestSchema = z
  .object({
    outdoorHourlyPm25: z.array(z.number().min(0).max(1500)).length(24),
    roomVolumeM3: z.number().min(12).max(300),
    homeType: HomeProfileSchema.shape.type,
    windowsFacingRoad: z.boolean(),
    windowsOpen: z.boolean(),
    doorGapSealed: z.boolean(),
    purifierType: HomeProfileSchema.shape.purifierType,
    purifierOn: z.boolean(),
    customCadrM3h: z.number().min(0).max(1200).optional(),
    cookingFuel: HomeProfileSchema.shape.cookingFuel,
    cookingHours: z.array(z.number().int().min(0).max(23)).max(12),
    hasChimney: z.boolean(),
  })
  .strict();

export const PlanRequestSchema = z
  .object({
    household: HouseholdTwinSchema,
    language: z.enum(['en', 'hi', 'hinglish']).default('en'),
  })
  .strict();

export const LedgerActionSchema = z
  .object({
    householdId: z.string().min(1).max(80),
    actionId: z.string().min(1).max(80),
    actionTitle: z.string().min(1).max(200),
    status: z.enum(['done', 'skipped']),
    pm25SavedUgM3: z.number().min(0).max(1000),
    percentSaved: z.number().min(0).max(100),
    co2SavedKg: z.number().min(0).max(100),
    moneySavedInr: z.number().min(0).max(100000),
  })
  .strict();
