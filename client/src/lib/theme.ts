/**
 * Thème visuel associé aux verdicts, niveaux de risque et scores.
 */

import type { RiskLevel, ScoreKey, Verdict } from '@/types';

export const verdictTheme: Record<
  Verdict,
  {
    label: string;
    badge: string;
    banner: string;
    accent: string;
    ring: string;
    from: string;
    to: string;
    description: string;
  }
> = {
  developper: {
    label: 'À développer',
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    banner: 'from-emerald-500 to-teal-500',
    accent: 'text-emerald-600',
    ring: '#059669',
    from: '#34d399',
    to: '#0d9488',
    description:
      "Le projet réunit les conditions d'un lancement. Les priorités portent désormais sur l'exécution et la conquête des premiers clients.",
  },
  ameliorer: {
    label: 'À améliorer',
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    banner: 'from-amber-500 to-orange-500',
    accent: 'text-amber-600',
    ring: '#d97706',
    from: '#fbbf24',
    to: '#ea580c',
    description:
      "Le socle est présent, mais des points bloquants subsistent. Corrigez-les avant d'engager davantage de ressources.",
  },
  risque: {
    label: 'Risqué',
    badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    banner: 'from-rose-500 to-red-600',
    accent: 'text-rose-600',
    ring: '#e11d48',
    from: '#fb7185',
    to: '#dc2626',
    description:
      "Les facteurs défavorables dominent à ce stade. Un repositionnement ou un test de marché réduit est nécessaire avant d'investir.",
  },
};

export const riskTheme: Record<RiskLevel, { label: string; badge: string; bar: string; text: string }> = {
  faible: {
    label: 'Faible',
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    bar: 'bg-emerald-500',
    text: 'text-emerald-600',
  },
  modere: {
    label: 'Modéré',
    badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    bar: 'bg-sky-500',
    text: 'text-sky-600',
  },
  eleve: {
    label: 'Élevé',
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    bar: 'bg-amber-500',
    text: 'text-amber-600',
  },
  tres_eleve: {
    label: 'Très élevé',
    badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    bar: 'bg-rose-500',
    text: 'text-rose-600',
  },
};

export const scoreTheme: Record<
  ScoreKey,
  { color: string; track: string; text: string; icon: string; bar: string }
> = {
  market: {
    color: '#6366f1',
    track: 'rgba(99,102,241,0.14)',
    text: 'text-indigo-600',
    icon: 'text-indigo-600',
    bar: 'from-indigo-500 to-indigo-400',
  },
  feasibility: {
    color: '#0ea5e9',
    track: 'rgba(14,165,233,0.14)',
    text: 'text-sky-600',
    icon: 'text-sky-600',
    bar: 'from-sky-500 to-sky-400',
  },
  innovation: {
    color: '#a855f7',
    track: 'rgba(168,85,247,0.14)',
    text: 'text-purple-600',
    icon: 'text-purple-600',
    bar: 'from-purple-500 to-purple-400',
  },
  growth: {
    color: '#10b981',
    track: 'rgba(16,185,129,0.14)',
    text: 'text-emerald-600',
    icon: 'text-emerald-600',
    bar: 'from-emerald-500 to-emerald-400',
  },
  risk: {
    color: '#f43f5e',
    track: 'rgba(244,63,94,0.14)',
    text: 'text-rose-600',
    icon: 'text-rose-600',
    bar: 'from-rose-500 to-rose-400',
  },
};

export const priorityTheme: Record<
  'haute' | 'moyenne' | 'basse',
  { label: string; badge: string }
> = {
  haute: { label: 'Priorité haute', badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' },
  moyenne: { label: 'Priorité moyenne', badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  basse: { label: 'Priorité basse', badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
};
