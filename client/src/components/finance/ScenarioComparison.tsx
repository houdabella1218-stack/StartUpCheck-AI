import { Info, TrendingDown, TrendingUp, Equal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { scenarioTheme } from '@/lib/financeTheme';
import { formatMAD } from '@/lib/format';
import { formatPayback, formatRate, NOT_REACHABLE, formatAmountOrDash } from '@/lib/financeFormat';
import { cn } from '@/lib/utils';
import type { FinancialAssumptions, FinancialScenario, ScenarioKey } from '@/types';

const scenarioIcon: Record<ScenarioKey, React.ReactNode> = {
  pessimiste: <TrendingDown className="h-4 w-4" />,
  realiste: <Equal className="h-4 w-4" />,
  optimiste: <TrendingUp className="h-4 w-4" />,
};

function figure(label: string, value: string, tone?: 'negative' | 'positive') {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span
        className={cn(
          'text-xs font-bold tabular-nums',
          tone === 'negative' ? 'text-rose-600' : tone === 'positive' ? 'text-emerald-600' : 'text-slate-800',
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Comparaison des trois scénarios (pessimiste / réaliste / optimiste), avec
 * les hypothèses appliquées affichées explicitement et un rappel pédagogique.
 */
export function ScenarioComparison({
  scenarios,
  assumptions,
}: {
  scenarios: FinancialScenario[];
  assumptions: FinancialAssumptions;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison des scénarios</CardTitle>
        <p className="text-xs text-slate-500">
          Les trois scénarios appliquent les mêmes formules à des hypothèses différentes. Le scénario
          réaliste correspond exactement à vos saisies.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid gap-3 lg:grid-cols-3">
          {scenarios.map((scenario) => {
            const theme = scenarioTheme[scenario.key];
            const isReference = scenario.key === 'realiste';
            const result = scenario.computed.annualResult;

            return (
              <div
                key={scenario.key}
                className={cn(
                  'rounded-2xl border p-4',
                  isReference ? 'border-brand-200 bg-brand-50/40' : 'border-slate-200 bg-white',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
                      theme.badge,
                    )}
                  >
                    {scenarioIcon[scenario.key]}
                    {scenario.label}
                  </span>
                  {isReference ? (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
                      Référence
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-[11px] leading-snug text-slate-500">{scenario.description}</p>

                <div className="mt-3 rounded-xl bg-slate-50/80 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Hypothèses appliquées
                  </p>
                  <ul className="space-y-0.5">
                    {scenario.assumptions.map((assumption) => (
                      <li key={assumption.label} className="flex justify-between gap-2 text-[11px]">
                        <span className="text-slate-500">{assumption.label}</span>
                        <span className="font-semibold text-slate-700">{assumption.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 divide-y divide-slate-100">
                  {figure('CA annuel', formatMAD(scenario.computed.annualRevenue))}
                  {figure(
                    'Résultat annuel',
                    formatMAD(result),
                    result < 0 ? 'negative' : result > 0 ? 'positive' : undefined,
                  )}
                  {figure('Taux de marge', formatRate(scenario.computed.contributionMarginRate))}
                  {figure(
                    'Seuil (CA)',
                    scenario.computed.breakEvenReachable
                      ? formatAmountOrDash(scenario.computed.breakEvenRevenue)
                      : NOT_REACHABLE,
                  )}
                  {figure(
                    'Payback',
                    formatPayback(scenario.computed.paybackMonths, scenario.input.initialInvestment),
                  )}
                  {figure('Santé', `${scenario.health.label} (${scenario.health.score}/100)`)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-amber-800">
              Hypothèses de simulation, et non prévisions
            </p>
            <ul className="space-y-1">
              {assumptions.notes.map((note) => (
                <li key={note} className="text-[11px] leading-relaxed text-amber-900/80">
                  • {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
