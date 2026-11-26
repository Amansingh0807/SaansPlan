import {
  ACTIVITY_BREATHING_RATE_M3H,
  COMMUTE_PM25_FACTOR,
  COOKING_SOURCE_UG_PER_M3_PER_H,
  HOME_BASE_INFILTRATION,
  N95_FILTRATION_EFFICIENCY,
  NATURAL_DECAY_RATE_PER_H,
  PM25_PER_CIGARETTE_APPROX,
  PURIFIER_DEFAULT_CADR_M3H,
  RISK_BAND_META,
  SENSITIVITY_MULTIPLIER,
} from './constants';
import type {
  HomeProfile,
  HouseholdExposureSummary,
  HouseholdMember,
  HouseholdTwin,
  MemberExposureResult,
  RiskBand,
  SlotExposureBreakdown,
  TimeSlot,
} from './types';

/**
 * Converts PM2.5 concentration (µg/m³) to Indian CPCB National AQI (PM2.5 sub-index).
 */
export function pm25ToCpcbAqi(pm25: number): number {
  const c = Math.max(0, pm25);
  const breakpoints: Array<[number, number, number, number]> = [
    [0, 30, 0, 50],
    [30, 60, 51, 100],
    [60, 90, 101, 200],
    [90, 120, 201, 300],
    [120, 250, 301, 400],
    [250, 500, 401, 500],
  ];

  for (const [cLow, cHigh, iLow, iHigh] of breakpoints) {
    if (c <= cHigh) {
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (c - cLow) + iLow);
    }
  }
  return Math.min(999, Math.round(500 + (c - 500) * 0.6));
}

/**
 * Maps an effective 24h PM2.5 exposure (µg/m³) to a CPCB-aligned risk band.
 */
export function getRiskBand(effectivePm25: number): {
  band: RiskBand;
  label: string;
  labelHi: string;
} {
  const order: RiskBand[] = [
    'good',
    'satisfactory',
    'moderate',
    'poor',
    'very_poor',
    'severe',
  ];
  for (const band of order) {
    if (effectivePm25 <= RISK_BAND_META[band].maxPm25) {
      return {
        band,
        label: RISK_BAND_META[band].label,
        labelHi: RISK_BAND_META[band].labelHi,
      };
    }
  }
  return {
    band: 'severe',
    label: RISK_BAND_META.severe.label,
    labelHi: RISK_BAND_META.severe.labelHi,
  };
}

/**
 * Computes age-adjusted breathing rate (m³/h) for a given activity.
 */
export function getBreathingRate(
  activity: TimeSlot['activity'],
  age: number
): number {
  const base = ACTIVITY_BREATHING_RATE_M3H[activity];
  if (age < 12) return Number((base * 0.68).toFixed(3));
  if (age >= 60) return Number((base * 0.88).toFixed(3));
  return base;
}

/**
 * Computes indoor infiltration factor F_inf based on building envelope,
 * road proximity, floor height, door-gap sealing, and window state.
 */
export function calcInfiltrationFactor(
  home: HomeProfile,
  windowsOpen: boolean
): number {
  let factor = HOME_BASE_INFILTRATION[home.type];

  if (home.floor >= 5) {
    factor *= 0.9;
  }
  if (home.windowsFacingRoad) {
    factor *= 1.12;
  }
  if (home.doorGapSealed) {
    factor *= 0.84;
  }
  if (windowsOpen) {
    factor = Math.min(0.95, factor + 0.36);
  }

  return Math.min(0.96, Math.max(0.22, Number(factor.toFixed(3))));
}

/**
 * Computes effective PM2.5 concentration (µg/m³) at a specific place & time slot.
 * Formula:
 *   C_place = C_out * F_inf * purifierAttenuation + cookingSpike
 *   (or outdoor/commute multiplier * maskAttenuation)
 */
export function calcSlotConcentration(
  outdoorPm25: number,
  slot: TimeSlot,
  home: HomeProfile
): number {
  const baseOut = Math.max(5, outdoorPm25);

  if (slot.location === 'indoor_home') {
    const fInf = calcInfiltrationFactor(home, Boolean(slot.windowsOpen));
    const cadr =
      slot.purifierOn && home.purifierType !== 'none'
        ? home.purifierCadrM3h ?? PURIFIER_DEFAULT_CADR_M3H[home.purifierType]
        : 0;
    const roomVol = Math.max(15, home.roomVolumeM3 || 40);
    // Steady-state dilution factor: decay / (decay + CADR/V)
    const airCleaningRatio =
      NATURAL_DECAY_RATE_PER_H /
      (NATURAL_DECAY_RATE_PER_H + cadr / roomVol);

    let indoorPm25 = baseOut * fInf * airCleaningRatio;

    if (slot.cookingActive) {
      let spike = COOKING_SOURCE_UG_PER_M3_PER_H[home.cookingFuel];
      if (home.hasKitchenChimney) {
        spike *= 0.45;
      }
      if (slot.windowsOpen) {
        spike *= 0.7;
      }
      indoorPm25 += spike * airCleaningRatio;
    }

    return Math.round(indoorPm25 * 10) / 10;
  }

  if (slot.location === 'indoor_school_office') {
    // Typical urban school/office infiltration without home purifier
    const schoolPm25 = baseOut * 0.56;
    return Math.round(schoolPm25 * 10) / 10;
  }

  // Outdoor or Commute
  let factor = 1.0;
  if (slot.location === 'commute' && slot.commuteMode) {
    factor = COMMUTE_PM25_FACTOR[slot.commuteMode];
  } else if (slot.location === 'outdoor_road') {
    factor = 1.28;
  } else if (slot.location === 'outdoor_park') {
    factor = 0.92;
  }

  let effective = baseOut * factor;
  if (slot.maskN95) {
    effective *= 1 - N95_FILTRATION_EFFICIENCY;
  }

  return Math.round(effective * 10) / 10;
}

function getSlotMeanOutdoorPm25(
  slot: TimeSlot,
  hourlyOutdoorPm25: number[]
): number {
  const start = Math.max(0, Math.min(23, Math.floor(slot.startHour)));
  const end = Math.max(start + 1, Math.min(24, Math.ceil(slot.endHour)));
  let sum = 0;
  let count = 0;
  for (let h = start; h < end; h++) {
    sum += hourlyOutdoorPm25[h] ?? hourlyOutdoorPm25[0] ?? 180;
    count++;
  }
  return count > 0 ? sum / count : 180;
}

/**
 * Calculates the deterministic 24-hour Personal Exposure Score for one member:
 *   exposure_i = Σ ( C_place(t) × Δt × BR(activity, age) × S(member) )
 */
export function calcMemberExposure(
  member: HouseholdMember,
  home: HomeProfile,
  hourlyOutdoorPm25: number[]
): MemberExposureResult {
  const sensitivityMultiplier = SENSITIVITY_MULTIPLIER[member.sensitivity];
  const slots: SlotExposureBreakdown[] = [];

  let totalScore = 0;
  let totalInhaledUg = 0;
  let weightedPm25Hours = 0;
  let totalHours = 0;

  for (const slot of member.schedule) {
    const durationHours = Math.max(0.25, slot.endHour - slot.startHour);
    const outdoorPm25 = getSlotMeanOutdoorPm25(slot, hourlyOutdoorPm25);
    const effectivePm25 = calcSlotConcentration(outdoorPm25, slot, home);
    const breathingRateM3h = getBreathingRate(slot.activity, member.age);

    const inhaledDoseUg = effectivePm25 * durationHours * breathingRateM3h;
    const slotExposureScore = inhaledDoseUg * sensitivityMultiplier;

    totalScore += slotExposureScore;
    totalInhaledUg += inhaledDoseUg;
    weightedPm25Hours += effectivePm25 * durationHours;
    totalHours += durationHours;

    slots.push({
      slotId: slot.id,
      label: slot.label,
      startHour: slot.startHour,
      endHour: slot.endHour,
      durationHours,
      outdoorPm25: Math.round(outdoorPm25 * 10) / 10,
      effectivePm25,
      breathingRateM3h,
      sensitivityMultiplier,
      slotExposureScore: Math.round(slotExposureScore * 10) / 10,
      inhaledDoseUg: Math.round(inhaledDoseUg * 10) / 10,
    });
  }

  const timeWeightedPm25 =
    totalHours > 0 ? Math.round((weightedPm25Hours / totalHours) * 10) / 10 : 0;
  const approxCigarettesPerDay =
    Math.round((timeWeightedPm25 / PM25_PER_CIGARETTE_APPROX) * 10) / 10;

  const { band, label } = getRiskBand(timeWeightedPm25);
  const peakSlot =
    slots.length > 0
      ? slots.reduce((max, curr) =>
          curr.slotExposureScore > max.slotExposureScore ? curr : max
        )
      : null;

  return {
    memberId: member.id,
    name: member.name,
    role: member.role,
    age: member.age,
    sensitivity: member.sensitivity,
    dailyExposureScore: Math.round(totalScore),
    timeWeightedPm25,
    totalInhaledUg: Math.round(totalInhaledUg),
    approxCigarettesPerDay,
    riskBand: band,
    riskLabel: label,
    peakSlot,
    slots,
  };
}

/**
 * Computes exposure across all members of a Household Digital Twin.
 */
export function calcHouseholdExposure(
  twin: HouseholdTwin,
  hourlyOutdoorPm25: number[]
): HouseholdExposureSummary {
  const safeHourly =
    hourlyOutdoorPm25.length === 24
      ? hourlyOutdoorPm25
      : Array.from({ length: 24 }, (_, i) => hourlyOutdoorPm25[i] ?? 200);

  const outdoorMeanPm25 =
    Math.round(
      (safeHourly.reduce((acc, v) => acc + v, 0) / safeHourly.length) * 10
    ) / 10;

  const members = twin.members.map((m) =>
    calcMemberExposure(m, twin.home, safeHourly)
  );

  const householdMeanScore =
    members.length > 0
      ? Math.round(
          members.reduce((acc, m) => acc + m.dailyExposureScore, 0) /
            members.length
        )
      : 0;

  const highestRiskMember =
    members.length > 0
      ? members.reduce((max, curr) =>
          curr.dailyExposureScore > max.dailyExposureScore ? curr : max
        )
      : null;

  return {
    householdId: twin.id,
    cityAqi: pm25ToCpcbAqi(outdoorMeanPm25),
    outdoorMeanPm25,
    householdMeanScore,
    highestRiskMember,
    members,
  };
}

/**
 * Quantifies the exact exposure reduction achieved by replacing a member's
 * baseline schedule/home setting with an intervention.
 */
export function compareRoutineImpact(
  member: HouseholdMember,
  baselineHome: HomeProfile,
  modifiedMember: HouseholdMember,
  modifiedHome: HomeProfile,
  hourlyOutdoorPm25: number[]
): {
  baselineScore: number;
  modifiedScore: number;
  scoreSaved: number;
  percentSaved: number;
  pm25SavedUgM3: number;
} {
  const before = calcMemberExposure(member, baselineHome, hourlyOutdoorPm25);
  const after = calcMemberExposure(
    modifiedMember,
    modifiedHome,
    hourlyOutdoorPm25
  );

  const scoreSaved = Math.max(
    0,
    before.dailyExposureScore - after.dailyExposureScore
  );
  const percentSaved =
    before.dailyExposureScore > 0
      ? Math.round((scoreSaved / before.dailyExposureScore) * 1000) / 10
      : 0;
  const pm25SavedUgM3 =
    Math.round(
      Math.max(0, before.timeWeightedPm25 - after.timeWeightedPm25) * 10
    ) / 10;

  return {
    baselineScore: before.dailyExposureScore,
    modifiedScore: after.dailyExposureScore,
    scoreSaved,
    percentSaved,
    pm25SavedUgM3,
  };
}
