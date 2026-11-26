'use client';

import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Skull,
} from 'lucide-react';
import type { RiskBand } from '@/lib/exposure-engine';

const BAND_STYLES: Record<
  RiskBand,
  { bg: string; text: string; border: string; Icon: typeof CheckCircle2 }
> = {
  good: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    Icon: ShieldCheck,
  },
  satisfactory: {
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    Icon: CheckCircle2,
  },
  moderate: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    Icon: AlertTriangle,
  },
  poor: {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    Icon: ShieldAlert,
  },
  very_poor: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    Icon: AlertOctagon,
  },
  severe: {
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    border: 'border-purple-300',
    Icon: Skull,
  },
};

export function RiskBadge({
  band,
  label,
  size = 'sm',
}: {
  band: RiskBand;
  label: string;
  size?: 'sm' | 'md';
}) {
  const style = BAND_STYLES[band];
  const Icon = style.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${style.bg} ${style.text} ${style.border} ${
        size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
      }`}
    >
      <Icon className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
