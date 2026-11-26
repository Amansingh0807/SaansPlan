import { GoogleGenAI } from '@google/genai';
import {
  calcHouseholdExposure,
  compareRoutineImpact,
  type HouseholdMember,
  type HouseholdTwin,
} from '@/lib/exposure-engine';
import type { EnvironmentalSnapshot } from '@/lib/data/environment';
import { retrieveGuidance } from '@/lib/data/guidance-rag';

export type PlanLanguage = 'en' | 'hi' | 'hinglish';

export interface PlanActionItem {
  id: string;
  timeWindow: string;
  memberId: string;
  memberName: string;
  title: string;
  titleHi: string;
  actionType:
    | 'shift_walk'
    | 'seal_and_purify'
    | 'commute_switch'
    | 'mask_n95'
    | 'cooking_vent'
    | 'diy_corsi';
  percentExposureSaved: number;
  pm25SavedUgM3: number;
  co2SavedKg: number;
  moneySavedInr: number;
  reason: string;
  citation: string;
  citationAgency: string;
  effort: 'free' | 'low' | 'medium';
  status: 'pending' | 'done' | 'skipped';
}

export interface DailyCleanAirPlan {
  householdId: string;
  generatedAt: string;
  language: PlanLanguage;
  summaryHeadline: string;
  totalPotentialReductionPercent: number;
  usedLlm: boolean;
  actions: PlanActionItem[];
}

function formatHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

function buildDeterministicCandidates(
  twin: HouseholdTwin,
  env: EnvironmentalSnapshot
): PlanActionItem[] {
  const actions: PlanActionItem[] = [];
  const bestStart = env.bestOutdoorWindow.startHour;
  const bestEnd = env.bestOutdoorWindow.endHour;

  for (const member of twin.members) {
    // 1. Shift morning/evening outdoor walk or play to afternoon trough
    const riskyOutdoor = member.schedule.find(
      (s) =>
        (s.location === 'outdoor_park' || s.location === 'outdoor_road') &&
        (s.startHour < 10 || s.startHour >= 18)
    );

    if (riskyOutdoor) {
      const modifiedMember: HouseholdMember = {
        ...member,
        schedule: member.schedule.map((s) =>
          s.id === riskyOutdoor.id
            ? {
                ...s,
                startHour: bestStart,
                endHour: Math.min(bestEnd, bestStart + (s.endHour - s.startHour)),
                location: 'outdoor_park',
              }
            : s
        ),
      };
      const impact = compareRoutineImpact(
        member,
        twin.home,
        modifiedMember,
        twin.home,
        env.hourlyPm25
      );
      if (impact.percentSaved > 1) {
        const cite = retrieveGuidance('morning inversion walk exercise', [
          'walk',
          'inversion',
        ])[0];
        actions.push({
          id: `act-walk-${member.id}`,
          timeWindow: `${formatHour(riskyOutdoor.startHour)} → ${formatHour(bestStart)}`,
          memberId: member.id,
          memberName: member.name,
          title: `Shift ${riskyOutdoor.label} to ${formatHour(bestStart)}–${formatHour(bestEnd)}`,
          titleHi: `${riskyOutdoor.label} ko ${formatHour(bestStart)}–${formatHour(bestEnd)} pe shift karein`,
          actionType: 'shift_walk',
          percentExposureSaved: impact.percentSaved,
          pm25SavedUgM3: impact.pm25SavedUgM3,
          co2SavedKg: 0,
          moneySavedInr: 0,
          reason: `Inversion traps ${env.hourlyPm25[riskyOutdoor.startHour] ?? env.currentPm25} µg/m³ at ${formatHour(riskyOutdoor.startHour)}. Sunlight lifts boundary layer by ${formatHour(bestStart)} (~${env.bestOutdoorWindow.meanPm25} µg/m³).`,
          citation: cite.citation,
          citationAgency: cite.agency,
          effort: 'free',
          status: 'pending',
        });
      }
    }

    // 2. Commute optimization (two-wheeler or open bus -> metro AC or N95)
    const commuteSlots = member.schedule.filter(
      (s) =>
        s.location === 'commute' &&
        (s.commuteMode === 'two_wheeler' ||
          s.commuteMode === 'bus_open' ||
          s.commuteMode === 'walk_cycle')
    );

    if (commuteSlots.length > 0) {
      const canSwitchMetro = !twin.budgetMode && member.age >= 15;
      const modifiedMember: HouseholdMember = {
        ...member,
        schedule: member.schedule.map((s) =>
          s.location === 'commute'
            ? canSwitchMetro
              ? { ...s, commuteMode: 'metro_ac' }
              : { ...s, maskN95: true }
            : s
        ),
      };
      const impact = compareRoutineImpact(
        member,
        twin.home,
        modifiedMember,
        twin.home,
        env.hourlyPm25
      );
      if (impact.percentSaved > 1) {
        const cite = retrieveGuidance('commute N95 mask', ['commute', 'mask'])[0];
        actions.push({
          id: `act-commute-${member.id}`,
          timeWindow: `${formatHour(commuteSlots[0].startHour)}–${formatHour(commuteSlots[0].endHour)}`,
          memberId: member.id,
          memberName: member.name,
          title: canSwitchMetro
            ? `Switch ${member.name.split(' ')[0]}'s commute to Metro / Carpool`
            : `Fitted N95 mask for ${member.name.split(' ')[0]}'s commute`,
          titleHi: canSwitchMetro
            ? `${member.name.split(' ')[0]} ke liye Metro / Carpool lein`
            : `Commute mein fitted N95 mask pehnein`,
          actionType: canSwitchMetro ? 'commute_switch' : 'mask_n95',
          percentExposureSaved: impact.percentSaved,
          pm25SavedUgM3: impact.pm25SavedUgM3,
          co2SavedKg: canSwitchMetro ? 1.8 : 0,
          moneySavedInr: canSwitchMetro ? 45 : 0,
          reason: canSwitchMetro
            ? `On-road two-wheeler PM2.5 is ~1.48x station average. AC Metro cuts commute exposure & saves ~1.8 kg CO₂/day.`
            : `A snug N95/FFP2 respirator filters ~82% of roadside PM2.5 during peak traffic.`,
          citation: cite.citation,
          citationAgency: cite.agency,
          effort: canSwitchMetro ? 'medium' : 'low',
          status: 'pending',
        });
      }
    }
  }

  // 3. Home-wide indoor defense (close road-facing windows + purifier or DIY Corsi-Rosenthal)
  const targetMemberId =
    calcHouseholdExposure(twin, env.hourlyPm25).highestRiskMember?.memberId ??
    twin.members[0]?.id;
  const rawMember = twin.members.find((m) => m.id === targetMemberId);

  if (rawMember) {
    const useDiy = twin.home.purifierType === 'none';
    const modifiedHome = {
      ...twin.home,
      doorGapSealed: true,
      purifierType: useDiy ? ('corsi_rosenthal_diy' as const) : twin.home.purifierType,
      purifierCadrM3h: useDiy ? 220 : twin.home.purifierCadrM3h ?? 280,
    };
    const modifiedMember: HouseholdMember = {
      ...rawMember,
      schedule: rawMember.schedule.map((s) =>
        s.location === 'indoor_home'
          ? { ...s, windowsOpen: false, purifierOn: true }
          : s
      ),
    };

    const impact = compareRoutineImpact(
      rawMember,
      twin.home,
      modifiedMember,
      modifiedHome,
      env.hourlyPm25
    );

    if (impact.percentSaved > 2) {
      const cite = retrieveGuidance('indoor purifier corsi rosenthal windows', [
        'indoor',
        'diy',
      ])[0];
      actions.push({
        id: 'act-indoor-defense',
        timeWindow: '06:00–11:00 & 18:00–23:00',
        memberId: rawMember.id,
        memberName: `${rawMember.name} & Home`,
        title: useDiy
          ? 'Seal door gaps + run DIY Corsi-Rosenthal Box (₹1,800)'
          : 'Close road-facing windows + run HEPA purifier on Sleep/Evening',
        titleHi: useDiy
          ? 'Darwaze ki jhiri band karein + DIY Corsi-Rosenthal Box chalayein'
          : 'Road-facing khidki band karein + HEPA purifier on rakhein',
        actionType: useDiy ? 'diy_corsi' : 'seal_and_purify',
        percentExposureSaved: impact.percentSaved,
        pm25SavedUgM3: impact.pm25SavedUgM3,
        co2SavedKg: 0,
        moneySavedInr: useDiy ? 8000 : 0,
        reason: useDiy
          ? `Sealing door gaps + a ₹1,800 box-fan MERV-13 filter delivers ~220 m³/h CADR, cutting indoor PM2.5 by ${impact.percentSaved}%.`
          : `Keeping road-facing windows shut during ${env.inversionRisk} inversion + running HEPA drops ${rawMember.name.split(' ')[0]}'s exposure by ${impact.percentSaved}%.`,
        citation: cite.citation,
        citationAgency: cite.agency,
        effort: useDiy ? 'low' : 'free',
        status: 'pending',
      });
    }
  }

  // 4. Cooking ventilation / cleaner fuel tip
  if (
    twin.home.cookingFuel === 'biomass_chulha' ||
    twin.home.cookingFuel === 'lpg_no_chimney' ||
    !twin.home.hasKitchenChimney
  ) {
    const cookMember =
      twin.members.find((m) => m.schedule.some((s) => s.cookingActive)) ??
      twin.members[0];
    if (cookMember) {
      const modifiedHome = {
        ...twin.home,
        hasKitchenChimney: true,
        cookingFuel:
          twin.home.cookingFuel === 'biomass_chulha'
            ? ('lpg_chimney' as const)
            : twin.home.cookingFuel,
      };
      const impact = compareRoutineImpact(
        cookMember,
        twin.home,
        cookMember,
        modifiedHome,
        env.hourlyPm25
      );
      if (impact.percentSaved > 1) {
        const cite = retrieveGuidance('cooking biomass chimney', ['cooking'])[0];
        actions.push({
          id: 'act-cooking-vent',
          timeWindow: '07:00–08:30 & 19:00–20:30',
          memberId: cookMember.id,
          memberName: cookMember.name,
          title:
            twin.home.cookingFuel === 'biomass_chulha'
              ? 'Cook near open leeward window / shift to LPG/Induction'
              : 'Run exhaust fan & keep kitchen door shut while tadka/cooking',
          titleHi:
            twin.home.cookingFuel === 'biomass_chulha'
              ? 'Khuli khidki ke paas khana banayein / LPG use karein'
              : 'Khana banate waqt exhaust fan chalayein aur kitchen door band rakhein',
          actionType: 'cooking_vent',
          percentExposureSaved: impact.percentSaved,
          pm25SavedUgM3: impact.pm25SavedUgM3,
          co2SavedKg: twin.home.cookingFuel === 'biomass_chulha' ? 1.2 : 0,
          moneySavedInr: 0,
          reason: `Indoor cooking spikes PM2.5 sharply; exhaust ventilation + cleaner fuel cuts ${cookMember.name.split(' ')[0]}'s daily dose by ${impact.percentSaved}%.`,
          citation: cite.citation,
          citationAgency: cite.agency,
          effort: 'free',
          status: 'pending',
        });
      }
    }
  }

  // Sort by highest verified exposure reduction first
  actions.sort((a, b) => b.percentExposureSaved - a.percentExposureSaved);
  return actions;
}

/**
 * Generates the Agentic Daily Clean Air Plan:
 * 1. Deterministic engine proposes & verifies every action's exact % exposure saved.
 * 2. Optional Gemini layer rewrites the headline & reasons in the user's language
 *    without ever modifying the deterministic numbers.
 */
export async function generateDailyCleanAirPlan(
  twin: HouseholdTwin,
  env: EnvironmentalSnapshot,
  language: PlanLanguage = 'en'
): Promise<DailyCleanAirPlan> {
  const actions = buildDeterministicCandidates(twin, env);
  const totalPotentialReductionPercent = Math.min(
    72,
    Math.round(
      actions.reduce((acc, a) => acc + a.percentExposureSaved * 0.45, 0) * 10
    ) / 10
  );

  let summaryHeadline = `City AQI is ${env.currentAqi} (${env.inversionRisk} inversion). Follow ${actions.length} verified steps to cut family exposure by ~${totalPotentialReductionPercent}%.`;
  if (language === 'hi') {
    summaryHeadline = `शहर का AQI ${env.currentAqi} है। परिवार का PM2.5 एक्सपोज़र ~${totalPotentialReductionPercent}% कम करने के लिए ये ${actions.length} प्रमाणित कदम अपनाएं।`;
  } else if (language === 'hinglish') {
    summaryHeadline = `Aaj AQI ${env.currentAqi} hai (${env.inversionRisk} inversion). Ye ${actions.length} verified steps follow karke family exposure ~${totalPotentialReductionPercent}% kam karein.`;
  }

  let usedLlm = false;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && actions.length > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are SaansPlan, an empathetic family air-defense copilot.
Rewrite the summary headline and each action's "reason" into clear, concise ${language === 'hi' ? 'Hindi (Devanagari)' : language === 'hinglish' ? 'Hinglish (warm conversational Hindi in Latin script)' : 'English'}.
STRICT RULE: Keep every number (${actions.map((a) => a.percentExposureSaved + '%').join(', ')}) exact. Do NOT invent new numbers or medical diagnoses.
Return valid JSON only: { "summaryHeadline": string, "reasons": { [id: string]: string } }.
Context: City=${env.city}, AQI=${env.currentAqi}, Wind=${env.windSpeedKmh} km/h, Inversion=${env.inversionRisk}.
Actions: ${JSON.stringify(actions.map((a) => ({ id: a.id, title: a.title, percent: a.percentExposureSaved, reason: a.reason })))}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as {
          summaryHeadline?: string;
          reasons?: Record<string, string>;
        };
        if (parsed.summaryHeadline) {
          summaryHeadline = parsed.summaryHeadline;
        }
        if (parsed.reasons) {
          for (const act of actions) {
            if (parsed.reasons[act.id]) {
              act.reason = parsed.reasons[act.id];
            }
          }
        }
        usedLlm = true;
      }
    } catch {
      // Fallback cleanly to deterministic explanations
      usedLlm = false;
    }
  }

  return {
    householdId: twin.id,
    generatedAt: new Date().toISOString(),
    language,
    summaryHeadline,
    totalPotentialReductionPercent,
    usedLlm,
    actions,
  };
}
