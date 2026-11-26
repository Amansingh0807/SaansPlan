'use client';

import { useState } from 'react';
import { X, Home, Users, Plus, Trash2 } from 'lucide-react';
import {
  type CommuteMode,
  type CookingFuel,
  type HomeType,
  type HouseholdMember,
  type HouseholdTwin,
  type PurifierType,
  type RiskSensitivity,
} from '@/lib/exposure-engine';
import { INDIAN_CITY_PRESETS } from '@/lib/data/environment';

interface OnboardingModalProps {
  open: boolean;
  initialTwin: HouseholdTwin;
  onClose: () => void;
  onSave: (twin: HouseholdTwin) => void;
}

export function OnboardingModal({
  open,
  initialTwin,
  onClose,
  onSave,
}: OnboardingModalProps) {
  const [name, setName] = useState(initialTwin.name);
  const [cityId, setCityId] = useState(INDIAN_CITY_PRESETS[0].id);
  const [homeType, setHomeType] = useState<HomeType>(initialTwin.home.type);
  const [floor, setFloor] = useState(initialTwin.home.floor);
  const [windowsFacingRoad, setWindowsFacingRoad] = useState(
    initialTwin.home.windowsFacingRoad
  );
  const [cookingFuel, setCookingFuel] = useState<CookingFuel>(
    initialTwin.home.cookingFuel
  );
  const [purifierType, setPurifierType] = useState<PurifierType>(
    initialTwin.home.purifierType
  );
  const [budgetMode, setBudgetMode] = useState(initialTwin.budgetMode);
  const [members, setMembers] = useState<HouseholdMember[]>(
    initialTwin.members
  );

  if (!open) return null;

  const addMember = () => {
    const id = `member-${Date.now()}`;
    setMembers((prev) => [
      ...prev,
      {
        id,
        name: 'New Member',
        role: 'Family Member',
        age: 30,
        sensitivity: 'standard',
        commuteMode: 'metro_ac',
        schedule: initialTwin.members[0].schedule,
      },
    ]);
  };

  const updateMember = (
    idx: number,
    patch: Partial<HouseholdMember>
  ) => {
    setMembers((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, ...patch } : m))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cityPreset =
      INDIAN_CITY_PRESETS.find((c) => c.id === cityId) ??
      INDIAN_CITY_PRESETS[0];

    const updated: HouseholdTwin = {
      id: `custom-${Date.now()}`,
      name: name.trim() || 'My Household',
      city: cityPreset.city,
      locality: cityPreset.locality,
      pincode: cityPreset.pincode,
      lat: cityPreset.lat,
      lon: cityPreset.lon,
      budgetMode,
      home: {
        ...initialTwin.home,
        type: homeType,
        floor,
        windowsFacingRoad,
        cookingFuel,
        purifierType,
      },
      members: members.map((m) => ({
        ...m,
        schedule: m.schedule.map((s) =>
          s.location === 'commute' ? { ...s, commuteMode: m.commuteMode } : s
        ),
      })),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#E4E1D8] bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#EFECE4] pb-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-teal-800">
              60-Second Digital Twin Setup
            </span>
            <h2
              id="onboarding-title"
              className="text-lg font-semibold text-slate-900"
            >
              Configure Your Household Profile
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup"
            className="rounded-lg border border-[#E4E1D8] p-1.5 text-slate-500 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Household & Location */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Household Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[#E4E1D8] px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                City / Monitoring Zone
              </label>
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="w-full rounded-lg border border-[#E4E1D8] px-3 py-2 text-sm bg-white"
              >
                {INDIAN_CITY_PRESETS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.city} · {c.locality} ({c.pincode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Home Envelope */}
          <div className="rounded-xl border border-[#E4E1D8] bg-[#FAF9F5] p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Home className="h-4 w-4 text-teal-700" aria-hidden="true" />
              <span>Home & Appliances</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Home Type
                </label>
                <select
                  value={homeType}
                  onChange={(e) => setHomeType(e.target.value as HomeType)}
                  className="w-full rounded-lg border border-[#E4E1D8] bg-white px-2.5 py-1.5 text-xs"
                >
                  <option value="apartment_high">High-Rise Flat (5+ floor)</option>
                  <option value="apartment_low">Low-Rise Flat (0–4 floor)</option>
                  <option value="independent_house">Independent House</option>
                  <option value="informal_settlement">Informal / High-Vent</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Cooking Fuel
                </label>
                <select
                  value={cookingFuel}
                  onChange={(e) =>
                    setCookingFuel(e.target.value as CookingFuel)
                  }
                  className="w-full rounded-lg border border-[#E4E1D8] bg-white px-2.5 py-1.5 text-xs"
                >
                  <option value="induction">Induction</option>
                  <option value="png_piped">PNG Piped</option>
                  <option value="lpg_chimney">LPG + Chimney</option>
                  <option value="lpg_no_chimney">LPG (No Chimney)</option>
                  <option value="biomass_chulha">Biomass / Chulha</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Air Purifier
                </label>
                <select
                  value={purifierType}
                  onChange={(e) =>
                    setPurifierType(e.target.value as PurifierType)
                  }
                  className="w-full rounded-lg border border-[#E4E1D8] bg-white px-2.5 py-1.5 text-xs"
                >
                  <option value="none">None</option>
                  <option value="corsi_rosenthal_diy">DIY Corsi-Rosenthal</option>
                  <option value="hepa_standard">HEPA Standard</option>
                  <option value="hepa_high_cadr">HEPA High CADR</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-700">
              <label className="inline-flex items-center gap-1.5">
                Floor:
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value))}
                  className="w-14 rounded border border-[#E4E1D8] bg-white px-2 py-0.5 text-xs"
                />
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={windowsFacingRoad}
                  onChange={(e) => setWindowsFacingRoad(e.target.checked)}
                />
                Windows face main road
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={budgetMode}
                  onChange={(e) => setBudgetMode(e.target.checked)}
                />
                Prioritize zero-cost / DIY advice
              </label>
            </div>
          </div>

          {/* Family Members */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Users className="h-4 w-4 text-teal-700" aria-hidden="true" />
                <span>Family Members ({members.length})</span>
              </div>
              <button
                type="button"
                onClick={addMember}
                className="inline-flex items-center gap-1 rounded-lg border border-teal-700 px-2.5 py-1 text-xs font-medium text-teal-800 hover:bg-teal-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Member
              </button>
            </div>

            {members.map((m, idx) => (
              <div
                key={m.id}
                className="grid grid-cols-1 gap-2 rounded-xl border border-[#E4E1D8] p-3 sm:grid-cols-12 items-center"
              >
                <input
                  type="text"
                  value={m.name}
                  onChange={(e) => updateMember(idx, { name: e.target.value })}
                  placeholder="Name"
                  className="sm:col-span-3 rounded border border-[#E4E1D8] px-2 py-1 text-xs"
                />
                <input
                  type="number"
                  min={1}
                  max={110}
                  value={m.age}
                  onChange={(e) =>
                    updateMember(idx, { age: Number(e.target.value) })
                  }
                  aria-label="Age"
                  className="sm:col-span-2 rounded border border-[#E4E1D8] px-2 py-1 text-xs"
                />
                <select
                  value={m.sensitivity}
                  onChange={(e) =>
                    updateMember(idx, {
                      sensitivity: e.target.value as RiskSensitivity,
                    })
                  }
                  className="sm:col-span-3 rounded border border-[#E4E1D8] bg-white px-2 py-1 text-xs"
                >
                  <option value="standard">Standard Risk</option>
                  <option value="child_under_12">Child (&lt;12 yrs)</option>
                  <option value="elderly_60_plus">Elderly (60+ yrs)</option>
                  <option value="asthma_respiratory">Asthma / Respiratory</option>
                  <option value="pregnant">Pregnant</option>
                </select>
                <select
                  value={m.commuteMode}
                  onChange={(e) =>
                    updateMember(idx, {
                      commuteMode: e.target.value as CommuteMode,
                    })
                  }
                  className="sm:col-span-3 rounded border border-[#E4E1D8] bg-white px-2 py-1 text-xs"
                >
                  <option value="wfh_indoor">Stay / WFH</option>
                  <option value="metro_ac">AC Metro</option>
                  <option value="car_ac_recirc">Car (AC Recirc)</option>
                  <option value="bus_open">Open Bus</option>
                  <option value="two_wheeler">Two-Wheeler</option>
                  <option value="walk_cycle">Walk / Cycle</option>
                </select>
                <div className="sm:col-span-1 flex justify-end">
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setMembers((prev) => prev.filter((_, i) => i !== idx))
                      }
                      aria-label={`Remove ${m.name}`}
                      className="rounded p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-[#EFECE4] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#E4E1D8] px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
          >
            Save Digital Twin & Recalculate
          </button>
        </div>
      </form>
    </div>
  );
}
