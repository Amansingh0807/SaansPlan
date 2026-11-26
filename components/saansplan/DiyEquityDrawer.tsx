'use client';

import { X, Wrench, CheckCircle2, IndianRupee } from 'lucide-react';

interface DiyEquityDrawerProps {
  open: boolean;
  onClose: () => void;
}

const DIY_PLAYBOOK = [
  {
    title: 'DIY Corsi-Rosenthal Box (~₹1,800)',
    impact: '~220 m³/h CADR · Cuts indoor PM2.5 by 45–60%',
    steps: [
      'Take a standard 16–20" box/exhaust fan + 4 pleated MERV-13 / HEPA-grade AC filters (or 2 filters in a V-wedge).',
      'Tape the edges tightly with duct tape so air only passes through the filters, not gaps.',
      'Place in the sleeping room with doors shut during 21:00–07:00 inversion hours.',
    ],
  },
  {
    title: 'Zero-Cost Door & Window Gap Sealing (₹0)',
    impact: 'Reduces outdoor smog infiltration by ~16%',
    steps: [
      'Roll a damp cotton cloth/towel along the bottom gap of the main entrance and balcony doors.',
      'Keep road-facing windows shut from 06:00–10:30 and 18:00–23:00; cross-ventilate only during 13:00–15:30.',
    ],
  },
  {
    title: 'Wet Mopping Instead of Dry Sweeping (₹0)',
    impact: 'Prevents PM10/PM2.5 dust resuspension',
    steps: [
      'Dry jhadu/brooming kicks settled toxic dust back into children’s breathing zone.',
      'Use a damp pocha (wet mop) once daily, especially near entryways.',
    ],
  },
  {
    title: 'N95 / FFP2 Fit Check for Two-Wheeler & Bus Commutes (₹40–80)',
    impact: 'Cuts roadside PM2.5 inhalation by ~80%',
    steps: [
      'Pinch the metal nose clip firmly; ensure no air leaks near glasses or cheeks.',
      'Cloth masks and surgical masks do NOT block PM2.5 effectively—use N95/KN95/FFP2.',
    ],
  },
];

export function DiyEquityDrawer({ open, onClose }: DiyEquityDrawerProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diy-drawer-title"
    >
      <div className="relative h-full w-full max-w-lg overflow-y-auto bg-[#F7F6F2] p-6 shadow-2xl border-l border-[#E4E1D8]">
        <div className="flex items-start justify-between border-b border-[#E4E1D8] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-900">
              <IndianRupee className="h-3 w-3" aria-hidden="true" />
              <span>Clean Air Equity · Zero & Low-Cost Mode</span>
            </div>
            <h2
              id="diy-drawer-title"
              className="mt-2 text-xl font-semibold text-slate-900"
            >
              DIY & Zero-Budget Air Defense Guide
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Clean air should not require a ₹15,000 purifier. Every step below is validated for low-income & rental homes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close DIY Guide"
            className="rounded-lg border border-[#E4E1D8] bg-white p-1.5 text-slate-600 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {DIY_PLAYBOOK.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-[#E4E1D8] bg-white p-4"
            >
              <div className="flex items-start gap-2.5">
                <Wrench
                  className="mt-0.5 h-4 w-4 shrink-0 text-teal-700"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 font-mono text-[11px] font-medium text-teal-800">
                    {item.impact}
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 pl-6">
                {item.steps.map((step) => (
                  <li
                    key={step}
                    className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
