export type HomeType =
  | 'apartment_high'
  | 'apartment_low'
  | 'independent_house'
  | 'informal_settlement';

export type CookingFuel =
  | 'induction'
  | 'png_piped'
  | 'lpg_chimney'
  | 'lpg_no_chimney'
  | 'biomass_chulha';

export type PurifierType =
  | 'none'
  | 'hepa_standard'
  | 'hepa_high_cadr'
  | 'corsi_rosenthal_diy';

export type CommuteMode =
  | 'wfh_indoor'
  | 'metro_ac'
  | 'car_ac_recirc'
  | 'bus_open'
  | 'two_wheeler'
  | 'walk_cycle';

export type ActivityLevel =
  | 'sleep'
  | 'rest_indoor'
  | 'light_indoor'
  | 'cooking'
  | 'commute'
  | 'brisk_walk'
  | 'outdoor_play';

export type RiskSensitivity =
  | 'standard'
  | 'child_under_12'
  | 'elderly_60_plus'
  | 'asthma_respiratory'
  | 'pregnant';

export type RiskBand =
  | 'good'
  | 'satisfactory'
  | 'moderate'
  | 'poor'
  | 'very_poor'
  | 'severe';

export interface HomeProfile {
  type: HomeType;
  floor: number;
  windowsFacingRoad: boolean;
  hasKitchenChimney: boolean;
  cookingFuel: CookingFuel;
  purifierType: PurifierType;
  purifierCadrM3h?: number;
  roomVolumeM3: number;
  doorGapSealed: boolean;
}

export interface TimeSlot {
  id: string;
  label: string;
  startHour: number; // 0..23
  endHour: number; // 1..24
  location:
    | 'indoor_home'
    | 'indoor_school_office'
    | 'outdoor_road'
    | 'outdoor_park'
    | 'commute';
  activity: ActivityLevel;
  commuteMode?: CommuteMode;
  windowsOpen?: boolean;
  purifierOn?: boolean;
  maskN95?: boolean;
  cookingActive?: boolean;
}

export interface HouseholdMember {
  id: string;
  name: string;
  role: string;
  age: number;
  sensitivity: RiskSensitivity;
  commuteMode: CommuteMode;
  schedule: TimeSlot[];
}

export interface HouseholdTwin {
  id: string;
  name: string;
  city: string;
  locality: string;
  pincode: string;
  lat: number;
  lon: number;
  budgetMode: boolean;
  home: HomeProfile;
  members: HouseholdMember[];
}

export interface SlotExposureBreakdown {
  slotId: string;
  label: string;
  startHour: number;
  endHour: number;
  durationHours: number;
  outdoorPm25: number;
  effectivePm25: number;
  breathingRateM3h: number;
  sensitivityMultiplier: number;
  slotExposureScore: number; // µg/m³ * h * BR * S
  inhaledDoseUg: number; // µg PM2.5 inhaled
}

export interface MemberExposureResult {
  memberId: string;
  name: string;
  role: string;
  age: number;
  sensitivity: RiskSensitivity;
  dailyExposureScore: number;
  timeWeightedPm25: number;
  totalInhaledUg: number;
  approxCigarettesPerDay: number;
  riskBand: RiskBand;
  riskLabel: string;
  peakSlot: SlotExposureBreakdown | null;
  slots: SlotExposureBreakdown[];
}

export interface HouseholdExposureSummary {
  householdId: string;
  cityAqi: number;
  outdoorMeanPm25: number;
  householdMeanScore: number;
  highestRiskMember: MemberExposureResult | null;
  members: MemberExposureResult[];
}

export interface IndoorSimInput {
  outdoorHourlyPm25: number[]; // length 24
  roomVolumeM3: number;
  homeType: HomeType;
  windowsFacingRoad: boolean;
  windowsOpen: boolean;
  doorGapSealed: boolean;
  purifierType: PurifierType;
  purifierOn: boolean;
  customCadrM3h?: number;
  cookingFuel: CookingFuel;
  cookingHours: number[]; // hours 0..23 when cooking happens
  hasChimney: boolean;
}

export interface IndoorSimPoint {
  hour: number;
  label: string;
  outdoorPm25: number;
  baselineIndoorPm25: number;
  simulatedIndoorPm25: number;
}

export interface IndoorSimResult {
  points: IndoorSimPoint[];
  baselineMeanPm25: number;
  simulatedMeanPm25: number;
  baselinePeakPm25: number;
  simulatedPeakPm25: number;
  reductionPercent: number;
  whoGuidelinePm25: number;
}
