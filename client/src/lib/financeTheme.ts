/**
 * Thème visuel du module "Financial Check".
 *
 * Les libellés textuels ne sont PAS dupliqués ici : le serveur renvoie déjà
 * `health.label` et `scenario.label` (source unique de vérité, pas de dérive).
 * Ce fichier ne contient donc que les classes/teintes d'affichage réellement
 * utilisées par les composants.
 */

import type { FinancialHealthStatus, ScenarioKey } from '@/types';

export const healthTheme: Record<
  FinancialHealthStatus,
  { badge: string; bar: string }
> = {
  solide: {
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    bar: 'from-emerald-500 to-teal-500',
  },
  fragile: {
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    bar: 'from-amber-500 to-orange-500',
  },
  risque: {
    badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    bar: 'from-rose-500 to-red-600',
  },
  non_rentable: {
    badge: 'bg-slate-800 text-white ring-1 ring-slate-700',
    bar: 'from-slate-600 to-slate-800',
  },
};

export const scenarioTheme: Record<ScenarioKey, { badge: string }> = {
  pessimiste: {
    badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  },
  realiste: {
    badge: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  },
  optimiste: {
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  },
};
