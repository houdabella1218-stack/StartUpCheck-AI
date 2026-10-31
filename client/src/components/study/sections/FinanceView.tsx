import {
  BadgeDollarSign,
  Calculator,
  ExternalLink,
  Landmark,
  RefreshCw,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import type { FinanceSection } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FinancialHealthBadge } from '@/components/finance/FinancialHealthBadge';
import {
  formatAmountOrDash,
  formatPayback,
  formatRate,
  formatRoi,
} from '@/lib/financeFormat';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Callout, StudyCard } from '../StudyBlocks';
import { SECTION_INDEX } from '../StudyEditContext';
import { EditableBlock } from '../StudyText';

function Kpi({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p
        className={cn(
          'mt-1 text-base font-extrabold tabular-nums',
          tone === 'success' && 'text-emerald-600',
          tone === 'danger' && 'text-rose-600',
          tone === 'neutral' && 'text-slate-900',
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[10px] leading-snug text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function FinanceView({
  section,
  onOpenFinanceTab,
}: {
  section: FinanceSection;
  onOpenFinanceTab: () => void;
}) {
  const base = `sections.${SECTION_INDEX.finance}`;

  if (!section.available || !section.computed || !section.health) {
    return (
      <div className="space-y-4">
        <StudyCard
          title="Étude financière"
          icon={<Wallet className="h-4 w-4 text-brand-600" />}
          description="Cette section réutilise le module Financial Check : aucun chiffre n’est inventé."
        >
          <Callout tone="warning" title="Données financières non disponibles">
            <EditableBlock block={section.missingNotice ?? section.summary} path={`${base}.summary`} />
          </Callout>

          <button type="button" className="btn-primary" onClick={onOpenFinanceTab}>
            <ExternalLink className="h-4 w-4" aria-hidden />
            Compléter le Financial Check
          </button>
        </StudyCard>
      </div>
    );
  }

  const computed = section.computed;
  const health = section.health;

  return (
    <div className="space-y-4">
      <Callout tone="info" title="Copie figée du Financial Check">
        <div className="space-y-2">
          <p>
            Chiffres capturés le <strong>{section.capturedAt ? formatDate(section.capturedAt) : '—'}</strong>.
            Aucun montant n’est recalculé dans l’étude : cette section reflète exactement le module
            Finance existant.
          </p>
          <div className="no-print flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" onClick={onOpenFinanceTab}>
              <Calculator className="h-4 w-4" aria-hidden />
              Ouvrir le module Finance
            </button>
          </div>
        </div>
      </Callout>

      <StudyCard
        title="Synthèse financière"
        icon={<BadgeDollarSign className="h-4 w-4 text-emerald-600" />}
        action={
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
            <RefreshCw className="h-3 w-3" aria-hidden />
            Régénérez l’étude après mise à jour du Financial Check
          </span>
        }
      >
        <EditableBlock block={section.summary} path={`${base}.summary`} />
      </StudyCard>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi
          label="Chiffre d’affaires mensuel"
          value={formatAmountOrDash(computed.monthlyRevenue)}
          hint={`Annuel : ${formatAmountOrDash(computed.annualRevenue)}`}
        />
        <Kpi
          label="Résultat mensuel"
          value={formatAmountOrDash(computed.monthlyResult)}
          hint={`Annuel : ${formatAmountOrDash(computed.annualResult)}`}
          tone={computed.monthlyResult >= 0 ? 'success' : 'danger'}
        />
        <Kpi
          label="Marge unitaire"
          value={formatAmountOrDash(computed.unitMargin)}
          hint={`Marge sur coûts variables : ${formatRate(computed.contributionMarginRate)}`}
          tone={computed.unitMargin > 0 ? 'success' : 'danger'}
        />
        <Kpi
          label="Seuil de rentabilité"
          value={formatAmountOrDash(computed.breakEvenRevenue)}
          hint={
            computed.breakEvenUnits !== null
              ? `Soit ${Math.round(computed.breakEvenUnits)} ventes / mois`
              : 'Non atteignable avec ces hypothèses'
          }
        />
        <Kpi
          label="ROI annuel"
          value={formatRoi(computed.roiAnnual)}
          hint="Rendement du capital investi"
        />
        <Kpi
          label="Délai de récupération"
          value={formatPayback(computed.paybackMonths, section.input?.initialInvestment ?? 0)}
          hint="Payback de l’investissement initial"
        />
      </div>

      <FinancialHealthBadge health={health} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-violet-500" />
            Scénarios financiers
          </CardTitle>
          <p className="text-xs text-slate-500">
            Coefficients appliqués aux hypothèses saisies, calculés par le module Finance.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-separate border-spacing-y-2 text-left text-[13px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-3 pb-1 font-bold">Scénario</th>
                  <th className="px-3 pb-1 font-bold">CA mensuel</th>
                  <th className="px-3 pb-1 font-bold">Résultat mensuel</th>
                  <th className="px-3 pb-1 font-bold">Santé</th>
                </tr>
              </thead>
              <tbody>
                {section.scenarios.map((scenario) => (
                  <tr key={scenario.key} className="bg-slate-50/80">
                    <td className="rounded-l-xl px-3 py-2.5 font-bold text-slate-800">
                      {scenario.label}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-600">
                      {formatAmountOrDash(scenario.computed.monthlyRevenue)}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-2.5 font-semibold tabular-nums',
                        scenario.computed.monthlyResult >= 0 ? 'text-emerald-600' : 'text-rose-600',
                      )}
                    >
                      {formatAmountOrDash(scenario.computed.monthlyResult)}
                    </td>
                    <td className="rounded-r-xl px-3 py-2.5 text-slate-600">
                      {scenario.health.label} ({scenario.health.score}/100)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {section.warnings.length > 0 ? (
        <Callout tone="warning" title="Points de vigilance du Financial Check">
          <ul className="list-disc space-y-1 pl-4">
            {section.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Callout>
      ) : null}

      {health.factors.some((factor) => factor.impact < 0) ? (
        <Callout tone="danger" title="Facteurs défavorables identifiés">
          <ul className="list-disc space-y-1 pl-4">
            {health.factors
              .filter((factor) => factor.impact < 0)
              .map((factor) => (
                <li key={factor.label}>
                  <ShieldAlert className="mr-1 inline h-3 w-3" aria-hidden />
                  {factor.label} ({factor.impact})
                </li>
              ))}
          </ul>
        </Callout>
      ) : null}
    </div>
  );
}
