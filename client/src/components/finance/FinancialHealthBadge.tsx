import { Activity, Minus, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { healthTheme } from '@/lib/financeTheme';
import { cn } from '@/lib/utils';
import type { FinancialHealth } from '@/types';

/**
 * Indicateur visuel de santé financière (score déterministe 0-100).
 * Le détail des facteurs est affiché pour la transparence.
 */
export function FinancialHealthBadge({ health }: { health: FinancialHealth }) {
  const theme = healthTheme[health.status];

  // Somme des points AVANT plafonnement : le score final est borné entre 0 et 100,
  // on l'explique donc explicitement pour éviter un détail qui semble incohérent.
  const rawTotal = health.factors.reduce((sum, factor) => sum + factor.impact, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-600" />
          Santé financière
        </CardTitle>
        <p className="text-xs text-slate-500">
          Indicateur déterministe, calculé par règles à partir de vos hypothèses.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className={cn('rounded-2xl px-3 py-2 text-2xl font-extrabold tabular-nums', theme.badge)}>
            {health.score}
            <span className="ml-0.5 text-sm font-bold opacity-70">/100</span>
          </span>
          <Badge tone="neutral" className={cn('font-bold', theme.badge)}>
            {health.label}
          </Badge>
        </div>

        <ProgressBar value={health.score} gradient={theme.bar} />

        <p className="text-xs leading-relaxed text-slate-600">{health.summary}</p>

        {health.factors.length > 0 ? (
          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Détail du calcul
            </p>
            <ul className="space-y-1">
              {health.factors.map((factor) => (
                <li key={factor.label} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-600">{factor.label}</span>
                  {factor.impact === 0 ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-400">
                      <Minus className="h-3 w-3" />
                      0
                    </span>
                  ) : (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 font-bold tabular-nums',
                        factor.impact > 0 ? 'text-emerald-600' : 'text-rose-600',
                      )}
                    >
                      {factor.impact > 0 ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {Math.abs(factor.impact)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {rawTotal !== health.score ? (
              <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] leading-snug text-slate-500">
                Total des points : <span className="font-bold tabular-nums">{rawTotal}</span> → ramené à{' '}
                <span className="font-bold tabular-nums">{health.score}/100</span> (le score de santé est
                borné entre 0 et 100).
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
