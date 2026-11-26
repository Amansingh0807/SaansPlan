'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  BookOpen,
  Check,
  Clock,
  CloudFog,
  Contrast,
  Flame,
  Leaf,
  MapPin,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Type,
  Users,
  Volume2,
  Wind,
  Wrench,
  X,
} from 'lucide-react';
import { Show, SignInButton, UserButton } from '@clerk/nextjs';
import {
  calcHouseholdExposure,
  DEMO_PERSONAS,
  getRiskBand,
  type HouseholdTwin,
  type MemberExposureResult,
} from '@/lib/exposure-engine';
import {
  INDIAN_CITY_PRESETS,
  type EnvironmentalSnapshot,
} from '@/lib/data/environment';
import type {
  DailyCleanAirPlan,
  PlanActionItem,
  PlanLanguage,
} from '@/lib/agent/planner';
import { RiskBadge } from './RiskBadge';
import { IndoorSimulator } from './IndoorSimulator';
import { DiyEquityDrawer } from './DiyEquityDrawer';
import { OnboardingModal } from './OnboardingModal';

interface SaansPlanCockpitProps {
  initialEnv: EnvironmentalSnapshot;
  initialPlan: DailyCleanAirPlan;
  clerkEnabled: boolean;
  supabaseEnabled: boolean;
}

export function SaansPlanCockpit({
  initialEnv,
  initialPlan,
  clerkEnabled,
  supabaseEnabled,
}: SaansPlanCockpitProps) {
  const [twin, setTwin] = useState<HouseholdTwin>(DEMO_PERSONAS[0]);
  const [env, setEnv] = useState<EnvironmentalSnapshot>(initialEnv);
  const [plan, setPlan] = useState<DailyCleanAirPlan>(initialPlan);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [language, setLanguage] = useState<PlanLanguage>('en');
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [diyOpen, setDiyOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [streakDays, setStreakDays] = useState(4);

  // Sync accessibility attributes on documentElement
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-contrast',
      highContrast ? 'high' : 'normal'
    );
    document.documentElement.setAttribute(
      'data-text-size',
      largeText ? 'large' : 'normal'
    );
  }, [highContrast, largeText]);

  // Load user's saved household from Supabase Postgres if logged in
  useEffect(() => {
    async function loadCloudHousehold() {
      try {
        const res = await fetch('/api/household');
        if (res.ok) {
          const data = await res.json();
          if (data.household) {
            setTwin(data.household);
            void refreshPlanAndEnv(data.household, language);
          }
        }
      } catch {
        // Fallback to initial preset
      }
    }
    loadCloudHousehold();
  }, [language]);

  // Deterministic exposure summary recalculates instantaneously on any twin/env change
  const exposureSummary = useMemo(
    () => calcHouseholdExposure(twin, env.hourlyPm25),
    [twin, env.hourlyPm25]
  );

  const selectedMember: MemberExposureResult | null = useMemo(() => {
    if (selectedMemberId === 'all') {
      return exposureSummary.highestRiskMember ?? exposureSummary.members[0] ?? null;
    }
    return (
      exposureSummary.members.find((m) => m.memberId === selectedMemberId) ??
      exposureSummary.members[0] ??
      null
    );
  }, [exposureSummary, selectedMemberId]);

  const filteredActions = useMemo(() => {
    if (selectedMemberId === 'all') return plan.actions;
    return plan.actions.filter(
      (a) =>
        a.memberId === selectedMemberId || a.id === 'act-indoor-defense'
    );
  }, [plan.actions, selectedMemberId]);

  // Quantified Impact Ledger totals from completed actions
  const ledgerTotals = useMemo(() => {
    const doneActions = plan.actions.filter((a) => a.status === 'done');
    const pm25Saved =
      Math.round(
        doneActions.reduce((acc, a) => acc + a.pm25SavedUgM3, 0) * 10
      ) / 10;
    const co2Saved =
      Math.round(
        doneActions.reduce((acc, a) => acc + a.co2SavedKg, 0) * 10
      ) / 10;
    const moneySaved = doneActions.reduce((acc, a) => acc + a.moneySavedInr, 0);
    const totalPct =
      Math.round(
        doneActions.reduce((acc, a) => acc + a.percentExposureSaved * 0.45, 0) *
          10
      ) / 10;

    return {
      completedCount: doneActions.length,
      totalCount: plan.actions.length,
      pm25Saved,
      co2Saved,
      moneySaved,
      totalPct,
    };
  }, [plan.actions]);

  async function refreshPlanAndEnv(
    nextTwin: HouseholdTwin,
    nextLang: PlanLanguage
  ) {
    setLoadingPlan(true);
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ household: nextTwin, language: nextLang }),
      });
      if (res.ok) {
        const data = await res.json();
        setEnv(data.environment);
        setPlan(data.plan);
      }
    } finally {
      setLoadingPlan(false);
    }
  }

  function handlePersonaSwitch(persona: HouseholdTwin) {
    setTwin(persona);
    setSelectedMemberId('all');
    void refreshPlanAndEnv(persona, language);
  }

  function handleCityChange(cityId: string) {
    const preset = INDIAN_CITY_PRESETS.find((c) => c.id === cityId);
    if (!preset) return;
    const nextTwin: HouseholdTwin = {
      ...twin,
      city: preset.city,
      locality: preset.locality,
      pincode: preset.pincode,
      lat: preset.lat,
      lon: preset.lon,
    };
    setTwin(nextTwin);
    void refreshPlanAndEnv(nextTwin, language);
  }

  function handleLanguageChange(nextLang: PlanLanguage) {
    setLanguage(nextLang);
    void refreshPlanAndEnv(twin, nextLang);
  }

  async function handleSaveCustomTwin(updated: HouseholdTwin) {
    setTwin(updated);
    setSelectedMemberId('all');
    void refreshPlanAndEnv(updated, language);
    try {
      await fetch('/api/household', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      // Local state already updated
    }
  }

  async function handleActionStatus(
    action: PlanActionItem,
    status: 'done' | 'skipped'
  ) {
    const nextStatus = action.status === status ? 'pending' : status;
    setPlan((prev) => ({
      ...prev,
      actions: prev.actions.map((a) =>
        a.id === action.id ? { ...a, status: nextStatus } : a
      ),
    }));
    if (nextStatus === 'done') {
      setStreakDays((s) => (s < 5 ? s + 1 : s));
      try {
        await fetch('/api/ledger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            householdId: twin.id,
            actionId: action.id,
            actionTitle: action.title,
            status: 'done',
            pm25SavedUgM3: action.pm25SavedUgM3,
            percentSaved: action.percentExposureSaved,
            co2SavedKg: action.co2SavedKg,
            moneySavedInr: action.moneySavedInr,
          }),
        });
      } catch {
        // Optimistic update preserved
      }
    }
  }

  function speakHeadline() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(plan.summaryHeadline);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  }

  const cityBand = getRiskBand(env.currentPm25);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Command Bar */}
      <header className="sticky top-0 z-30 border-b border-[#E4E1D8] bg-[#F7F6F2]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4E1D8] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              title="Return to Home Landing Page"
            >
              <span>← Home</span>
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-800 text-white shadow-sm">
              <Shield className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  SaansPlan
                </span>
                <span className="hidden sm:inline-block rounded-md border border-[#E4E1D8] bg-white px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                  EXPOSURE ENGINE v1
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Family Air Defense Copilot
              </p>
            </div>
          </div>

          {/* Persona + Location Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Persona Switcher */}
            <div
              className="inline-flex rounded-xl border border-[#E4E1D8] bg-white p-0.5"
              role="group"
              aria-label="Household Persona Switcher"
            >
              {DEMO_PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePersonaSwitch(p)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    twin.id === p.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.budgetMode ? 'Meena (DIY)' : 'Sharma (3BHK)'}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setOnboardingOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-teal-800 hover:bg-teal-50"
              >
                <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
                <span>Customize</span>
              </button>
            </div>

            {/* City Selector */}
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4E1D8] bg-white px-2.5 py-1">
              <MapPin className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
              <select
                aria-label="Select monitoring city"
                value={
                  INDIAN_CITY_PRESETS.find((c) => c.locality === twin.locality)
                    ?.id ?? 'delhi-rohini'
                }
                onChange={(e) => handleCityChange(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-800 outline-none"
              >
                {INDIAN_CITY_PRESETS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.city} · {c.locality}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Toggle */}
            <div
              className="inline-flex rounded-xl border border-[#E4E1D8] bg-white p-0.5"
              role="group"
              aria-label="Language toggle"
            >
              {(
                [
                  ['en', 'EN'],
                  ['hi', 'हिं'],
                  ['hinglish', 'Hinglish'],
                ] as const
              ).map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleLanguageChange(code)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
                    language === code
                      ? 'bg-teal-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Accessibility Toggles */}
            <button
              type="button"
              onClick={() => setHighContrast((v) => !v)}
              aria-pressed={highContrast}
              title="Toggle High Contrast"
              className={`rounded-xl border p-1.5 transition-colors ${
                highContrast
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-[#E4E1D8] bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Contrast className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setLargeText((v) => !v)}
              aria-pressed={largeText}
              title="Toggle Large Text"
              className={`rounded-xl border p-1.5 transition-colors ${
                largeText
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-[#E4E1D8] bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Type className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Clerk Auth or Cloud/Demo Status */}
            {clerkEnabled ? (
              <div className="flex items-center gap-2">
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="rounded-xl bg-teal-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-900"
                    >
                      Sign In
                    </button>
                  </SignInButton>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </div>
            ) : (
              <span
                title="Add Clerk & Supabase keys in .env.local to enable cloud sync"
                className="rounded-xl border border-[#E4E1D8] bg-white px-2.5 py-1 font-mono text-[11px] text-slate-600"
              >
                {supabaseEnabled ? 'Cloud Ready' : 'Demo Mode'}
              </span>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        {/* Screen Reader Announcement Live Region */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {loadingPlan ? 'Recalculating clean air plan...' : `Plan updated: ${plan.summaryHeadline}`}
        </div>
        {/* Atmospheric Telemetry Strip */}
        <section
          aria-label="Live atmospheric telemetry"
          className="grid grid-cols-2 gap-3 sm:grid-cols-5"
        >
          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>City AQI (CPCB)</span>
              <RiskBadge band={cityBand.band} label={cityBand.label} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                {env.currentAqi}
              </span>
              <span className="font-mono text-xs font-medium text-slate-600">
                PM2.5: {env.currentPm25} µg/m³
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Wind className="h-4 w-4 text-teal-700" aria-hidden="true" />
              <span>Wind & Inversion</span>
            </div>
            <div className="mt-2 font-mono text-lg font-bold tabular-nums text-slate-900">
              {env.windSpeedKmh} km/h
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Boundary layer {env.boundaryLayerHeightM}m ·{' '}
              <span className="font-bold uppercase text-slate-900">
                {env.inversionRisk}
              </span>{' '}
              inversion
            </p>
          </div>

          <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Clock className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <span>Safest Outdoor Slot</span>
            </div>
            <div className="mt-2 font-mono text-lg font-bold tabular-nums text-emerald-800">
              {String(env.bestOutdoorWindow.startHour).padStart(2, '0')}:00–
              {String(env.bestOutdoorWindow.endHour).padStart(2, '0')}:00
            </div>
            <p className="mt-1 text-xs text-slate-600">
              ~{env.bestOutdoorWindow.meanPm25} µg/m³ (vs{' '}
              {env.worstOutdoorWindow.meanPm25} peak)
            </p>
          </div>

          <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Flame className="h-4 w-4 text-orange-600" aria-hidden="true" />
              <span>Regional Stubble Fires</span>
            </div>
            <div className="mt-2 font-mono text-lg font-bold tabular-nums text-slate-900">
              {env.stubbleFireCount} active
            </div>
            <p className="mt-1 text-xs text-slate-600 line-clamp-1">
              {env.stubbleFireNote}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E4E1D8] bg-white p-4 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <CloudFog className="h-4 w-4 text-slate-600" aria-hidden="true" />
              <span>Telemetry Status</span>
            </div>
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${
                  env.isStale
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    env.isStale ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}
                />
                {env.isStale ? 'STALE FALLBACK' : 'LIVE OPEN-METEO'}
              </span>
              <p className="mt-1.5 text-xs text-slate-600 truncate">
                {env.source}
              </p>
            </div>
          </div>
        </section>

        {/* Section 1: City AQI vs Personal Exposure per Family Member */}
        <section
          aria-labelledby="exposure-heading"
          className="rounded-2xl border border-[#E4E1D8] bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-[#EFECE4] pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-teal-800">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  Deterministic Personal Exposure Engine · {twin.name}
                </span>
              </div>
              <h1
                id="exposure-heading"
                className="mt-1 text-xl font-bold tracking-tight text-slate-900"
              >
                {language === 'hi'
                  ? `शहर का AQI ${env.currentAqi} एक नंबर है — पर परिवार के हर सदस्य का एक्सपोज़र अलग है`
                  : `City AQI is ${env.currentAqi} — but each family member breathes a different dose`}
              </h1>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              Computed via{' '}
              <code className="font-mono text-slate-700">
                Σ C_place(t) × Δt × BR(activity, age) × S(member)
              </code>
              . Click a member to filter their daily plan.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {exposureSummary.members.map((m) => {
              const isSelected = selectedMemberId === m.memberId;
              return (
                <button
                  key={m.memberId}
                  type="button"
                  onClick={() =>
                    setSelectedMemberId((prev) =>
                      prev === m.memberId ? 'all' : m.memberId
                    )
                  }
                  className={`text-left rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-teal-700 bg-teal-50/40 ring-2 ring-teal-700/20'
                      : 'border-[#E4E1D8] bg-[#FAF9F5] hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-bold text-slate-900">
                        {m.name}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">{m.role}</div>
                    </div>
                    <RiskBadge band={m.riskBand} label={m.riskLabel} />
                  </div>

                  <div className="mt-3 flex items-baseline justify-between border-t border-[#E4E1D8]/70 pt-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Exposure Score
                      </div>
                      <div className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                        {m.dailyExposureScore.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold tabular-nums text-slate-900">
                        {m.timeWeightedPm25} µg/m³
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        ~{m.approxCigarettesPerDay} cig/day approx.
                      </div>
                    </div>
                  </div>

                  {m.peakSlot && (
                    <div className="mt-2.5 rounded-lg bg-white border border-[#E4E1D8] px-3 py-1.5 text-xs text-slate-700">
                      <span className="font-bold text-slate-900">
                        Peak Risk:
                      </span>{' '}
                      {m.peakSlot.label} ({m.peakSlot.effectivePm25} µg/m³)
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Member Slot Breakdown */}
          {selectedMember && (
            <div className="mt-4 rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-800">
                  <Activity
                    className="mr-1.5 inline h-3.5 w-3.5 text-teal-700"
                    aria-hidden="true"
                  />
                  24h Dose Breakdown: {selectedMember.name} (
                  {selectedMember.totalInhaledUg} µg inhaled today)
                </span>
                {selectedMemberId !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedMemberId('all')}
                    className="font-mono text-[11px] text-teal-800 underline"
                  >
                    Show all family members
                  </button>
                )}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {selectedMember.slots.map((s) => (
                  <div
                    key={s.slotId}
                    className="rounded-lg border border-[#E4E1D8] bg-white px-3 py-2 text-xs"
                  >
                    <div className="font-semibold text-slate-900">
                      {String(s.startHour).padStart(2, '0')}:00–
                      {String(s.endHour).padStart(2, '0')}:00 · {s.label}
                    </div>
                    <div className="font-mono text-xs text-slate-600 mt-0.5">
                      {s.effectivePm25} µg/m³ · Dose {Math.round(s.slotExposureScore)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Section 2: Agentic Daily Clean Air Plan (65%) + Impact Ledger (35%) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Daily Plan */}
          <section
            aria-labelledby="plan-heading"
            className="lg:col-span-8 rounded-2xl border border-[#E4E1D8] bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#EFECE4] pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-teal-800">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    Agentic Daily Clean Air Plan{' '}
                    {plan.usedLlm ? '· Gemini + CPCB/WHO RAG' : '· Verified Engine + RAG'}
                  </span>
                </div>
                <h2
                  id="plan-heading"
                  className="mt-1 text-lg font-semibold text-slate-900"
                >
                  {plan.summaryHeadline}
                </h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={speakHeadline}
                  title="Read aloud"
                  aria-label="Read plan summary aloud"
                  className="rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-2 text-slate-700 hover:bg-slate-100"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => refreshPlanAndEnv(twin, language)}
                  disabled={loadingPlan}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${loadingPlan ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>Recalculate</span>
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {filteredActions.map((act) => (
                <article
                  key={act.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    act.status === 'done'
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : act.status === 'skipped'
                        ? 'border-slate-200 bg-slate-50 opacity-65'
                        : 'border-[#E4E1D8] bg-[#FAF9F5]'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-900 px-2.5 py-0.5 font-mono text-xs font-semibold text-white">
                          {act.timeWindow}
                        </span>
                        <span className="rounded-md border border-[#E4E1D8] bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                          {act.memberName}
                        </span>
                        <span className="rounded-md bg-teal-100 px-2.5 py-0.5 font-mono text-xs font-bold text-teal-950">
                          -{act.percentExposureSaved}% exposure (
                          -{act.pm25SavedUgM3} µg/m³)
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        {language === 'en' ? act.title : act.titleHi}
                      </h3>

                      <p className="text-sm text-slate-700 leading-relaxed">
                        {act.reason}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          <BookOpen className="h-3.5 w-3.5 text-teal-700" aria-hidden="true" />
                          {act.citation}
                        </span>
                        {act.co2SavedKg > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 font-mono text-xs font-bold text-emerald-950">
                            <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
                            -{act.co2SavedKg} kg CO₂
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Done / Skip controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleActionStatus(act, 'done')}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          act.status === 'done'
                            ? 'border-emerald-700 bg-emerald-700 text-white'
                            : 'border-[#E4E1D8] bg-white text-slate-700 hover:border-emerald-600 hover:text-emerald-800'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{act.status === 'done' ? 'Done' : 'Mark Done'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleActionStatus(act, 'skipped')}
                        title="Skip action"
                        aria-label="Skip action"
                        className={`rounded-lg border p-1.5 transition-colors ${
                          act.status === 'skipped'
                            ? 'border-slate-700 bg-slate-700 text-white'
                            : 'border-[#E4E1D8] bg-white text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Impact Ledger + DIY Equity Card */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-[#E4E1D8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between border-b border-[#EFECE4] pb-3">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-teal-800">
                    Impact Ledger
                  </span>
                  <h2 className="text-base font-semibold text-slate-900">
                    Kya Badla, Kitna Badla
                  </h2>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-900">
                  {streakDays}d Streak
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-3.5">
                  <div className="text-xs font-semibold text-slate-600">
                    Exposure Avoided
                  </div>
                  <div className="mt-1 font-mono text-xl font-bold tabular-nums text-teal-800">
                    -{ledgerTotals.totalPct}%
                  </div>
                  <div className="font-mono text-xs text-slate-600 mt-0.5">
                    {ledgerTotals.pm25Saved} µg/m³ saved
                  </div>
                </div>

                <div className="rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-3.5">
                  <div className="text-xs font-semibold text-slate-600">
                    CO₂ & Cost Saved
                  </div>
                  <div className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-800">
                    {ledgerTotals.co2Saved} kg
                  </div>
                  <div className="font-mono text-xs text-slate-600 mt-0.5">
                    ₹{ledgerTotals.moneySaved} saved today
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-3.5 text-xs text-slate-700">
                <div className="font-bold text-slate-900">
                  Progress: {ledgerTotals.completedCount} /{' '}
                  {ledgerTotals.totalCount} actions logged
                </div>
                <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-teal-700 transition-all"
                    style={{
                      width: `${
                        ledgerTotals.totalCount > 0
                          ? (ledgerTotals.completedCount /
                              ledgerTotals.totalCount) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Mark actions as <strong>Done</strong> on the left to record verified exposure & CO₂ savings in your family ledger.
                </p>
              </div>
            </div>

            {/* Equity / DIY Mode Callout */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
              <div className="flex items-start gap-2.5">
                <Wrench
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-800"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-sm font-semibold text-amber-950">
                    No Purifier? Zero-Cost & DIY Defense
                  </h3>
                  <p className="mt-1 text-xs text-amber-900/80 leading-relaxed">
                    Build a ₹1,800 Corsi-Rosenthal box (~220 m³/h CADR), seal door gaps with damp cloth, and time cooking ventilation.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDiyOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-950"
                  >
                    Open DIY Playbook
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Section 3: Interactive Indoor What-If Simulator */}
        <IndoorSimulator
          key={twin.id}
          hourlyOutdoorPm25={env.hourlyPm25}
          initialHome={twin.home}
          language={language}
        />

        {/* Medical & Model Assumptions Disclaimer */}
        <footer className="rounded-2xl border border-[#E4E1D8] bg-white/70 p-4 text-[11px] text-slate-500 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span>
              <strong>Guidance Disclaimer:</strong> SaansPlan provides environmental exposure estimates and public-health guidance (WHO, CPCB, ICMR), not medical diagnosis. Cigarette-equivalent values are educational approximations (~22 µg/m³ ≈ 1 cig/day).
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 shrink-0">
            Deterministic Exposure Engine · Open-Meteo + RAG
          </span>
        </footer>
      </main>

      <DiyEquityDrawer open={diyOpen} onClose={() => setDiyOpen(false)} />
      <OnboardingModal
        open={onboardingOpen}
        initialTwin={twin}
        onClose={() => setOnboardingOpen(false)}
        onSave={handleSaveCustomTwin}
      />
    </div>
  );
}
