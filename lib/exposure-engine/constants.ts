import type {
  ActivityLevel,
  CommuteMode,
  CookingFuel,
  HomeType,
  PurifierType,
  RiskBand,
  RiskSensitivity,
} from './types';

/**
 * WHO 24-hour PM2.5 Air Quality Guideline (2021): 15 µg/m³.
 */
export const WHO_24H_PM25_GUIDELINE = 15;

/**
 * Berkeley Earth approximate equivalence: ~22 µg/m³ of 24h average PM2.5 ≈ 1 cigarette/day.
 * Always presented in UI as an educational approximation, never a clinical diagnosis.
 */
export const PM25_PER_CIGARETTE_APPROX = 22;

/**
 * Natural indoor particle deposition/decay rate (h⁻¹) in typical urban dwellings.
 */
export const NATURAL_DECAY_RATE_PER_H = 0.35;

/**
 * Base air exchange / infiltration factor (indoor/outdoor ratio when windows closed).
 */
export const HOME_BASE_INFILTRATION: Record<HomeType, number> = {
  apartment_high: 0.42,
  apartment_low: 0.52,
  independent_house: 0.58,
  informal_settlement: 0.78,
};

/**
 * Default Clean Air Delivery Rate (CADR in m³/h) by purifier category.
 */
export const PURIFIER_DEFAULT_CADR_M3H: Record<PurifierType, number> = {
  none: 0,
  hepa_standard: 260,
  hepa_high_cadr: 450,
  corsi_rosenthal_diy: 220, // 4x MERV-13 + box fan DIY build
};

/**
 * Effective indoor PM2.5 source spike (µg/m³) added during active cooking hour
 * when ventilation/chimney is accounted for separately.
 */
export const COOKING_SOURCE_UG_PER_M3_PER_H: Record<CookingFuel, number> = {
  induction: 8,
  png_piped: 45,
  lpg_chimney: 32,
  lpg_no_chimney: 85,
  biomass_chulha: 320,
};

/**
 * Commute microenvironment PM2.5 multiplier relative to ambient station PM2.5.
 */
export const COMMUTE_PM25_FACTOR: Record<CommuteMode, number> = {
  wfh_indoor: 0.48,
  metro_ac: 0.42,
  car_ac_recirc: 0.52,
  bus_open: 1.25,
  two_wheeler: 1.48, // on-road tailpipe + resuspended dust
  walk_cycle: 1.32,
};

/**
 * Activity-based breathing rate (m³/hour) for a reference adult.
 */
export const ACTIVITY_BREATHING_RATE_M3H: Record<ActivityLevel, number> = {
  sleep: 0.42,
  rest_indoor: 0.54,
  light_indoor: 0.72,
  cooking: 0.85,
  commute: 0.95,
  brisk_walk: 1.65,
  outdoor_play: 1.95,
};

/**
 * Physiological sensitivity multiplier S(member) for personal exposure scoring.
 */
export const SENSITIVITY_MULTIPLIER: Record<RiskSensitivity, number> = {
  standard: 1.0,
  child_under_12: 1.35,
  elderly_60_plus: 1.3,
  asthma_respiratory: 1.55,
  pregnant: 1.25,
};

/**
 * Properly fitted N95 / FFP2 respirator fractional PM2.5 reduction.
 */
export const N95_FILTRATION_EFFICIENCY = 0.82;

export const RISK_BAND_META: Record<
  RiskBand,
  { label: string; labelHi: string; maxPm25: number; color: string }
> = {
  good: {
    label: 'Good',
    labelHi: 'अच्छा (Good)',
    maxPm25: 30,
    color: 'emerald',
  },
  satisfactory: {
    label: 'Satisfactory',
    labelHi: 'संतोषजनक (Satisfactory)',
    maxPm25: 60,
    color: 'teal',
  },
  moderate: {
    label: 'Moderate',
    labelHi: 'मध्यम (Moderate)',
    maxPm25: 90,
    color: 'amber',
  },
  poor: {
    label: 'Poor',
    labelHi: 'खराब (Poor)',
    maxPm25: 120,
    color: 'orange',
  },
  very_poor: {
    label: 'Very Poor',
    labelHi: 'बहुत खराब (Very Poor)',
    maxPm25: 250,
    color: 'red',
  },
  severe: {
    label: 'Severe',
    labelHi: 'गंभीर (Severe)',
    maxPm25: Infinity,
    color: 'purple',
  },
};
