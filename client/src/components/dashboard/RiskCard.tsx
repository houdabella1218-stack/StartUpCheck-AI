import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { riskTheme } from '@/lib/theme';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { cn } from '@/lib/utils';
import type { Analysis } from '@/types';

export function RiskCard({ analysis }: { analysis: Analysis }) {
  const risk = analysis.scores.find((s) => s.key === 'risk');
  const theme = riskTheme[analysis.riskLevel];
  const value = risk?.value ?? 0;

  // Les 3 facteurs qui pèsent le plus lourd dans le risque
  const topFactors = [...(risk?.factors ?? [])].sort((a, b) => b.value - a.value).slice(0, 3);

  const Icon = analysis.riskLevel === 'faible' ? ShieldCheck : analysis.riskLevel === 'modere' ? ShieldCheck : ShieldAlert;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Niveau de risque</CardTitle>
            <CardDescription>
              Risque global du projet, agrégé puis inversé dans le score de viabilité.
            </CardDescription>
          </div>
          <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', theme.badge)}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className={cn('text-4xl font-extrabold tabular-nums', theme.text)}>
                <AnimatedNumber value={value} />
              </span>
              <span className="text-sm font-bold text-slate-400">/100</span>
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Plus la note est haute, plus le risque est élevé
            </p>
          </div>
          <Badge tone="neutral" size="md" className={theme.badge}>
            {analysis.riskLabel}
          </Badge>
        </div>

        <ProgressBar value={value} gradient={theme.bar} height="lg" />

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <AlertTriangle className="h-3.5 w-3.5" />
            Principaux facteurs de risque
          </p>
          <ul className="space-y-2">
            {topFactors.map((factor) => (
              <li key={factor.label} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-600">{factor.label}</span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                    <span
                      className={cn('block h-full rounded-full', theme.bar)}
                      style={{ width: `${Math.min(100, factor.value)}%` }}
                    />
                  </span>
                  <span className="w-7 text-right font-bold tabular-nums text-slate-700">{factor.value}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
