import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Wallet } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SectionHeading,
} from '@/components/ui/Card';
import { KpiCard } from '@/components/finance/KpiCard';
import { FinancialHealthBadge } from '@/components/finance/FinancialHealthBadge';
import { BreakEvenCard } from '@/components/finance/BreakEvenCard';
import { ScenarioComparison } from '@/components/finance/ScenarioComparison';
import { RevenueCostChart } from '@/components/finance/RevenueCostChart';
import { FinancialSimulator } from '@/components/finance/FinancialSimulator';
import { FinancialDisclaimer } from '@/components/finance/FinancialDisclaimer';
import { useAppStore } from '@/store/analysisStore';
import { api, ApiError } from '@/lib/api';
import { formatMAD } from '@/lib/format';
import { formatRate, formatRoi } from '@/lib/financeFormat';
import type {
  Analysis,
  FinancialCheck,
  FinancialCheckRecord,
  FinancialInput,
} from '@/types';

const EMPTY_INPUT: FinancialInput = {
  initialInvestment: 0,
  unitPrice: 0,
  monthlyUnits: 0,
  fixedCostsMonthly: 0,
  variableCostPerUnit: 0,
};

function sameInput(a: FinancialInput, b: FinancialInput): boolean {
  return (
    a.initialInvestment === b.initialInvestment &&
    a.unitPrice === b.unitPrice &&
    a.monthlyUnits === b.monthlyUnits &&
    a.fixedCostsMonthly === b.fixedCostsMonthly &&
    a.variableCostPerUnit === b.variableCostPerUnit
  );
}

function toCheck(record: FinancialCheckRecord): FinancialCheck {
  return {
    currency: record.currency,
    input: record.input,
    computed: record.computed,
    health: record.health,
    scenarios: record.scenarios,
    assumptions: record.assumptions,
    warnings: record.warnings,
    meta: record.meta,
  };
}

/**
 * Onglet "Finance" du dashboard : indicateurs, graphiques, comparaison des
 * scénarios et simulateur. Tous les calculs proviennent du moteur financier
 * déterministe (aucun LLM).
 */
export function FinancialPanel({
  analysis,
  onSaved,
}: {
  analysis: Analysis;
  onSaved: (record: FinancialCheckRecord) => void;
}) {
  const meta = useAppStore((s) => s.meta);

  const sampleFinancial = useMemo<FinancialInput | null>(() => {
    const sample = meta?.samples?.find((s) => s.projectName === analysis.projectName);
    return sample?.financial ?? null;
  }, [meta, analysis.projectName]);

  const saved = analysis.financial;

  const [draft, setDraft] = useState<FinancialInput>(saved?.input ?? EMPTY_INPUT);
  const [touched, setTouched] = useState(Boolean(saved));
  const [preview, setPreview] = useState<FinancialCheck | null>(saved ? toCheck(saved) : null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);

  // Prévisualisation différée : recalcule côté serveur à chaque modification.
  useEffect(() => {
    if (!touched) return;

    const currentId = ++requestId.current;
    setPreviewing(true);

    const handle = setTimeout(async () => {
      try {
        const result = await api.previewFinancialCheck(draft);
        if (requestId.current !== currentId) return;
        setPreview(result);
        setError(null);
      } catch (err) {
        if (requestId.current !== currentId) return;
        setError(
          err instanceof ApiError
            ? err.message
            : 'Impossible de calculer la projection financière.',
        );
      } finally {
        if (requestId.current === currentId) setPreviewing(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [draft, touched]);

  const dirty = touched && (!saved || !sameInput(draft, saved.input));

  const handleChange = useCallback((next: FinancialInput) => {
    setTouched(true);
    setDraft(next);
  }, []);

  const handleLoadSample = useCallback(() => {
    if (!sampleFinancial) return;
    setTouched(true);
    setDraft(sampleFinancial);
  }, [sampleFinancial]);

  const handleReset = useCallback(() => {
    if (saved) {
      setDraft(saved.input);
      setTouched(true);
    } else {
      setDraft(EMPTY_INPUT);
      setTouched(false);
      setPreview(null);
    }
  }, [saved]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const record = await api.createFinancialCheck({ ...draft, analysisId: analysis.id });
      setPreview(toCheck(record));
      onSaved(record);
      setTouched(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "L'enregistrement des hypothèses financières a échoué.",
      );
    } finally {
      setSaving(false);
    }
  }, [draft, analysis.id, onSaved]);

  // On affiche les résultats dès que la prévisualisation est disponible, et on
  // garde la carte d'accueil uniquement tant qu'aucune saisie n'a été faite
  // (évite un « flash » de la carte pendant le premier calcul).
  const showResults = touched && (preview !== null || previewing);

  return (
    <div className="space-y-6">
      {!showResults ? (
        <Card className="border-brand-200/70 bg-gradient-to-br from-brand-50/70 to-violet-50/50">
          <CardContent className="flex flex-col gap-4 p-5 pt-5 sm:flex-row sm:items-start sm:gap-5 sm:p-6 sm:pt-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
              <Wallet className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                Analyse financière prévisionnelle
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                Renseignez cinq chiffres clés ci-dessous pour calculer votre chiffre d&apos;affaires
                prévisionnel, votre marge, votre seuil de rentabilité, votre ROI et votre délai de
                récupération. Aucune donnée n&apos;est inventée : seules vos saisies sont utilisées.
              </p>
              {sampleFinancial ? (
                <button type="button" className="btn-ghost mt-3" onClick={handleLoadSample}>
                  Charger les chiffres de l&apos;exemple « {analysis.projectName} »
                </button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <p className="text-xs leading-relaxed text-rose-700">{error}</p>
        </div>
      ) : null}

      {showResults && preview ? (
        <>
          <FinancialDisclaimer
            engineNotice={preview.meta.engineNotice}
            disclaimer={preview.meta.disclaimer}
          />

          {preview.warnings.length > 0 ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <p className="text-xs font-bold text-amber-900">Points de vigilance</p>
                <ul className="mt-1 space-y-1">
                  {preview.warnings.map((warning) => (
                    <li key={warning} className="text-[11px] leading-relaxed text-amber-900/90">
                      • {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <section className="pt-2">
            <SectionHeading
              eyebrow="Résultat réaliste"
              title="Indicateurs financiers clés"
              description="Calculés à partir de vos hypothèses actuelles. La devise par défaut est le dirham marocain (DH)."
              icon={<Wallet className="h-5 w-5 text-brand-600" />}
              action={
                previewing ? (
                  <span className="text-[11px] font-semibold text-slate-400">Recalcul…</span>
                ) : null
              }
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard
                label="Chiffre d'affaires mensuel"
                value={formatMAD(preview.computed.monthlyRevenue)}
                hint={`${preview.input.monthlyUnits} ventes × ${formatMAD(preview.input.unitPrice)}`}
                emoji="📈"
                tone="brand"
              />
              <KpiCard
                label="Chiffre d'affaires annuel"
                value={formatMAD(preview.computed.annualRevenue)}
                hint="Projection sur 12 mois"
                emoji="📊"
                tone="brand"
              />
              <KpiCard
                label="Résultat mensuel prévisionnel"
                value={formatMAD(preview.computed.monthlyResult)}
                hint="CA − charges totales"
                emoji="💰"
                tone={preview.computed.monthlyResult >= 0 ? 'positive' : 'negative'}
              />
              <KpiCard
                label="Résultat annuel prévisionnel"
                value={formatMAD(preview.computed.annualResult)}
                hint="Résultat mensuel × 12"
                emoji="🗓️"
                tone={preview.computed.annualResult >= 0 ? 'positive' : 'negative'}
              />
              <KpiCard
                label="Taux de marge sur coûts variables"
                value={formatRate(preview.computed.contributionMarginRate)}
                hint="(Prix de vente − coût variable) ÷ prix de vente"
                emoji="📐"
                tone="warning"
              />
              <KpiCard
                label="ROI annuel estimé"
                value={formatRoi(preview.computed.roiAnnual)}
                hint="Résultat annuel ÷ investissement initial"
                emoji="🎯"
                tone={
                  preview.computed.roiAnnual === null
                    ? 'neutral'
                    : preview.computed.roiAnnual >= 0
                      ? 'positive'
                      : 'negative'
                }
              />
            </div>
          </section>

          <section className="grid gap-4 pt-2 lg:grid-cols-2">
            <FinancialHealthBadge health={preview.health} />
            <BreakEvenCard input={preview.input} computed={preview.computed} />
          </section>

          <section className="pt-2">
            <SectionHeading
              eyebrow="Projection"
              title="Trajectoire financière sur 12 mois"
              description="Chiffre d'affaires, charges et résultat mois par mois, puis récupération de l'investissement initial."
            />
            <RevenueCostChart computed={preview.computed} input={preview.input} />
          </section>

          <section className="pt-2">
            <ScenarioComparison scenarios={preview.scenarios} assumptions={preview.assumptions} />
          </section>
        </>
      ) : null}

      <section className="pt-2">
        <FinancialSimulator
          value={draft}
          onChange={handleChange}
          onSave={handleSave}
          onReset={touched ? handleReset : undefined}
          saving={saving}
          dirty={dirty}
          hasSaved={Boolean(saved)}
          sampleAvailable={Boolean(sampleFinancial)}
          onLoadSample={handleLoadSample}
        />
      </section>

      {!touched && !preview ? (
        <Card className="border-slate-200 bg-slate-50/60">
          <CardHeader>
            <CardTitle className="text-sm">Comment ça marche ?</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1.5 text-xs leading-relaxed text-slate-600">
              <li>
                • Le <strong>scénario réaliste</strong> correspond exactement aux chiffres que vous
                saisissez : aucune hypothèse n&apos;est ajoutée.
              </li>
              <li>
                • Les scénarios <strong>pessimiste</strong> et <strong>optimiste</strong> sont des
                hypothèses de simulation pédagogiques, appliquées par coefficients fixes (ventes,
                prix, coûts).
              </li>
              <li>
                • Tous les calculs sont <strong>déterministes</strong> : aucune IA générative
                n&apos;intervient dans les chiffres.
              </li>
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
