import { AlertTriangle, Clock, Percent, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatAmountOrDash, formatPayback, formatRate, formatRoi, NOT_REACHABLE } from '@/lib/financeFormat';
import { cn } from '@/lib/utils';
import type { FinancialComputed, FinancialInput } from '@/types';

function Row({
  icon,
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'positive' | 'negative';
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="text-xs font-bold text-slate-700">{label}</p>
          <p
            className={cn(
              'text-sm font-extrabold tabular-nums',
              tone === 'positive' && 'text-emerald-600',
              tone === 'negative' && 'text-rose-600',
              tone === 'neutral' && 'text-slate-900',
            )}
          >
            {value}
          </p>
        </div>
        {hint ? <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{hint}</p> : null}
      </div>
    </div>
  );
}

/**
 * Seuil de rentabilité, ROI et délai de récupération.
 * Les valeurs non calculables sont explicitement énoncées.
 */
export function BreakEvenCard({
  input,
  computed,
}: {
  input: FinancialInput;
  computed: FinancialComputed;
}) {
  const breakEvenRevenue = computed.breakEvenReachable
    ? formatAmountOrDash(computed.breakEvenRevenue)
    : NOT_REACHABLE;
  const breakEvenUnits =
    computed.breakEvenReachable && computed.breakEvenUnits !== null
      ? `${computed.breakEvenUnits.toFixed(1).replace('.', ',')} ventes / mois`
      : NOT_REACHABLE;

  const payback = formatPayback(computed.paybackMonths, input.initialInvestment);
  const roi = formatRoi(computed.roiAnnual);

  const safety =
    computed.safetyMarginRate === null
      ? '—'
      : computed.safetyMarginRate >= 0
        ? formatRate(computed.safetyMarginRate)
        : `${formatRate(computed.safetyMarginRate)} (sous le seuil)`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-4 w-4 text-brand-600" />
          Seuil de rentabilité, ROI et payback
        </CardTitle>
        <p className="text-xs text-slate-500">
          À partir de quel volume l&apos;activité devient-elle rentable, et en combien de temps
          l&apos;investissement de départ est-il récupéré ?
        </p>
      </CardHeader>
      <CardContent className="divide-y divide-slate-100 pt-0">
        <Row
          icon={<Target className="h-4 w-4" />}
          label="Seuil de rentabilité (chiffre d'affaires)"
          value={breakEvenRevenue}
          hint="Charges fixes ÷ taux de marge sur coûts variables"
        />
        <Row
          icon={<TrendingUp className="h-4 w-4" />}
          label="Seuil de rentabilité (nombre de ventes)"
          value={breakEvenUnits}
          hint="Charges fixes ÷ marge unitaire (prix − coût variable)"
        />
        <Row
          icon={<Percent className="h-4 w-4" />}
          label="Marge de sécurité"
          value={safety}
          hint="Écart entre votre chiffre d'affaires et le seuil de rentabilité"
        />
        <Row
          icon={<Percent className="h-4 w-4" />}
          label="ROI annuel estimé"
          value={roi}
          hint="Résultat annuel ÷ investissement initial"
          tone={
            computed.roiAnnual === null
              ? 'neutral'
              : computed.roiAnnual >= 0
                ? 'positive'
                : 'negative'
          }
        />
        <Row
          icon={<Clock className="h-4 w-4" />}
          label="Délai de récupération (payback)"
          value={payback}
          hint="Investissement initial ÷ résultat mensuel"
          tone={
            computed.paybackMonths === null
              ? 'negative'
              : input.initialInvestment === 0
                ? 'neutral'
                : 'positive'
          }
        />
        {!computed.breakEvenReachable ? (
          <div className="flex items-start gap-2 pt-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-[11px] leading-relaxed text-slate-500">
              Le seuil de rentabilité n&apos;existe pas lorsque la marge unitaire est nulle ou
              négative : aucun volume de ventes ne permet de couvrir les charges fixes.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
