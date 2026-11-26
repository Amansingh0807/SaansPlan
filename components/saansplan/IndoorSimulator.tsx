'use client';

import { useMemo, useState } from 'react';
import { Sliders, Wind, Flame, Shield, Sparkles } from 'lucide-react';
import {
  simulateIndoorMassBalance,
  type CookingFuel,
  type HomeProfile,
  type PurifierType,
} from '@/lib/exposure-engine';

interface IndoorSimulatorProps {
  hourlyOutdoorPm25: number[];
  initialHome: HomeProfile;
  language: 'en' | 'hi' | 'hinglish';
}

export function IndoorSimulator({
  hourlyOutdoorPm25,
  initialHome,
  language,
}: IndoorSimulatorProps) {
  const [purifierOn, setPurifierOn] = useState(
    initialHome.purifierType !== 'none'
  );
  const [purifierType, setPurifierType] = useState<PurifierType>(
    initialHome.purifierType === 'none'
      ? 'corsi_rosenthal_diy'
      : initialHome.purifierType
  );
  const [windowsOpen, setWindowsOpen] = useState(false);
  const [doorGapSealed, setDoorGapSealed] = useState(initialHome.doorGapSealed);
  const [roomVolumeM3, setRoomVolumeM3] = useState(
    initialHome.roomVolumeM3 || 40
  );
  const [cookingFuel, setCookingFuel] = useState<CookingFuel>(
    initialHome.cookingFuel
  );
  const [hasChimney, setHasChimney] = useState(initialHome.hasKitchenChimney);

  const sim = useMemo(
    () =>
      simulateIndoorMassBalance({
        outdoorHourlyPm25: hourlyOutdoorPm25,
        roomVolumeM3,
        homeType: initialHome.type,
        windowsFacingRoad: initialHome.windowsFacingRoad,
        windowsOpen,
        doorGapSealed,
        purifierType,
        purifierOn,
        cookingFuel,
        cookingHours: [8, 20],
        hasChimney,
      }),
    [
      hourlyOutdoorPm25,
      roomVolumeM3,
      initialHome.type,
      initialHome.windowsFacingRoad,
      windowsOpen,
      doorGapSealed,
      purifierType,
      purifierOn,
      cookingFuel,
      hasChimney,
    ]
  );

  // Build crisp SVG paths
  const width = 680;
  const height = 220;
  const padL = 36;
  const padR = 14;
  const padT = 16;
  const padB = 26;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const maxY = Math.max(
    100,
    ...sim.points.map((p) =>
      Math.max(p.baselineIndoorPm25, p.simulatedIndoorPm25)
    )
  );

  const toX = (i: number) => padL + (i / 23) * plotW;
  const toY = (val: number) => padT + plotH - (val / maxY) * plotH;

  const basePath = sim.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.baselineIndoorPm25).toFixed(1)}`)
    .join(' ');

  const simPath = sim.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.simulatedIndoorPm25).toFixed(1)}`)
    .join(' ');

  const simArea = `${simPath} L ${toX(23).toFixed(1)} ${(padT + plotH).toFixed(1)} L ${toX(0).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;
  const whoY = toY(sim.whoGuidelinePm25);

  return (
    <section
      aria-labelledby="simulator-heading"
      className="rounded-2xl border border-[#E4E1D8] bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#EFECE4] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-teal-800">
            <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {language === 'hi'
                ? 'इनडोर व्हाट-इफ सिम्युलेटर (Mass-Balance Model)'
                : 'Indoor What-If Simulator · Single-Zone Mass-Balance'}
            </span>
          </div>
          <h2
            id="simulator-heading"
            className="mt-1 text-lg font-semibold tracking-tight text-slate-900"
          >
            {language === 'hi'
              ? 'कमरे की हवा पर प्यूरीफायर, खिड़की और ईंधन का असर देखें'
              : 'Test how purifier CADR, window sealing & cooking fuel change indoor PM2.5'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-teal-200 bg-teal-50/70 px-3.5 py-2 text-right">
            <div className="text-[11px] font-medium text-teal-900/75">
              24h Indoor Reduction
            </div>
            <div className="font-mono text-xl font-bold tabular-nums text-teal-800">
              {sim.reductionPercent > 0 ? `-${sim.reductionPercent}%` : '0%'}
            </div>
          </div>
          <div className="rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] px-3.5 py-2 text-right">
            <div className="text-[11px] font-medium text-slate-500">
              Mean PM2.5
            </div>
            <div className="font-mono text-sm font-semibold tabular-nums text-slate-900">
              <span className="line-through text-slate-400 mr-1.5">
                {sim.baselineMeanPm25}
              </span>
              <span className="text-teal-800">{sim.simulatedMeanPm25}</span>{' '}
              <span className="text-[11px] font-normal text-slate-500">µg/m³</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Purifier toggle & type */}
          <div className="rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-3.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="sim-purifier-toggle"
                className="flex items-center gap-2 text-sm font-medium text-slate-800"
              >
                <Sparkles className="h-4 w-4 text-teal-700" aria-hidden="true" />
                <span>Air Filtration</span>
              </label>
              <button
                id="sim-purifier-toggle"
                type="button"
                role="switch"
                aria-checked={purifierOn}
                onClick={() => setPurifierOn((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  purifierOn ? 'bg-teal-700' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    purifierOn ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {purifierOn && (
              <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['corsi_rosenthal_diy', 'DIY Box (220)'],
                    ['hepa_standard', 'HEPA (260)'],
                    ['hepa_high_cadr', 'Pro (450)'],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPurifierType(val)}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                      purifierType === val
                        ? 'border-teal-700 bg-teal-700 text-white'
                        : 'border-[#E4E1D8] bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Windows & Door Gap */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setWindowsOpen((v) => !v)}
              className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs font-medium transition-colors ${
                !windowsOpen
                  ? 'border-teal-300 bg-teal-50/60 text-teal-900'
                  : 'border-orange-300 bg-orange-50 text-orange-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5" aria-hidden="true" />
                Windows
              </span>
              <span className="font-mono font-semibold">
                {windowsOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDoorGapSealed((v) => !v)}
              className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs font-medium transition-colors ${
                doorGapSealed
                  ? 'border-teal-300 bg-teal-50/60 text-teal-900'
                  : 'border-[#E4E1D8] bg-[#FAF9F5] text-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                Door Gaps
              </span>
              <span className="font-mono font-semibold">
                {doorGapSealed ? 'SEALED' : 'OPEN'}
              </span>
            </button>
          </div>

          {/* Room Volume Slider */}
          <div className="rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-3.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700">
              <label htmlFor="sim-room-vol">Room Volume</label>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {roomVolumeM3} m³
              </span>
            </div>
            <input
              id="sim-room-vol"
              type="range"
              min={18}
              max={90}
              step={2}
              value={roomVolumeM3}
              onChange={(e) => setRoomVolumeM3(Number(e.target.value))}
              className="saans-slider mt-2 w-full"
            />
          </div>

          {/* Cooking Fuel */}
          <div className="rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-3.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                Cooking Fuel & Chimney
              </span>
              <button
                type="button"
                onClick={() => setHasChimney((v) => !v)}
                className="font-mono text-[11px] underline text-teal-800"
              >
                Chimney: {hasChimney ? 'Yes' : 'No'}
              </button>
            </div>
            <select
              aria-label="Cooking fuel"
              value={cookingFuel}
              onChange={(e) => setCookingFuel(e.target.value as CookingFuel)}
              className="w-full rounded-lg border border-[#E4E1D8] bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800"
            >
              <option value="induction">Electric Induction (Lowest PM2.5)</option>
              <option value="png_piped">Piped PNG</option>
              <option value="lpg_chimney">LPG + Exhaust Chimney</option>
              <option value="lpg_no_chimney">LPG (No Chimney)</option>
              <option value="biomass_chulha">Biomass / Chulha (Severe Spike)</option>
            </select>
          </div>
        </div>

        {/* Live SVG Chart */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 mb-2">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 border-t-2 border-dashed border-slate-500" />
                Baseline Indoor
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-teal-800">
                <span className="h-2 w-2 rounded-full bg-teal-700" />
                With Interventions
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <span className="h-0.5 w-4 border-t border-dotted border-emerald-600" />
                WHO 24h (15 µg/m³)
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              Peak: {sim.simulatedPeakPm25} µg/m³
            </span>
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible"
            role="img"
            aria-label="24-hour indoor PM2.5 simulation chart comparing baseline and intervention concentration"
          >
            <defs>
              <linearGradient id="simFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f766e" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#0f766e" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const y = padT + plotH * (1 - t);
              const val = Math.round(maxY * t);
              return (
                <g key={t}>
                  <line
                    x1={padL}
                    x2={width - padR}
                    y1={y}
                    y2={y}
                    stroke="#E5E2D9"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-slate-400 font-mono text-[10px]"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* WHO 15 µg/m³ guideline line */}
            <line
              x1={padL}
              x2={width - padR}
              y1={whoY}
              y2={whoY}
              stroke="#059669"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />

            {/* Baseline dashed line */}
            <path
              d={basePath}
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray="5 4"
            />

            {/* Simulated area + solid line */}
            <path d={simArea} fill="url(#simFill)" />
            <path
              d={simPath}
              fill="none"
              stroke="#0f766e"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* X-axis hour labels */}
            {[0, 4, 8, 12, 16, 20, 23].map((h) => (
              <text
                key={h}
                x={toX(h)}
                y={height - 6}
                textAnchor="middle"
                className="fill-slate-500 font-mono text-[10px]"
              >
                {String(h).padStart(2, '0')}:00
              </text>
            ))}
          </svg>

          <p className="mt-2 text-[11px] text-slate-500">
            ODE: <code className="font-mono">dC/dt = k_inf·C_out − (k_decay + CADR/V)·C_in + S_cook/V</code> · Cooking spikes modeled at 08:00 & 20:00.
          </p>
        </div>
      </div>
    </section>
  );
}
