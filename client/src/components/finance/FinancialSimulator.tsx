import { useEffect, useState } from 'react';
import { Loader2, RotateCcw, Save, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { FinancialInput } from '@/types';

type FieldKey = keyof FinancialInput;

const FIELDS: Array<{
  key: FieldKey;
  label: string;
  hint: string;
  unit: 'DH' | 'ventes';
  step: number;
  slider?: { min: number; max: number };
}> = [
  {
    key: 'initialInvestment',
    label: 'Investissement initial',
    hint: 'Montant total nécessaire pour démarrer',
    unit: 'DH',
    step: 1000,
  },
  {
    key: 'unitPrice',
    label: 'Prix de vente moyen',
    hint: 'Prix moyen d’une vente ou d’un abonnement',
    unit: 'DH',
    step: 10,
    slider: { min: 0, max: 5000 },
  },
  {
    key: 'monthlyUnits',
    label: 'Ventes / clients par mois',
    hint: 'Volume mensuel estimé',
    unit: 'ventes',
    step: 1,
    slider: { min: 0, max: 1000 },
  },
  {
    key: 'fixedCostsMonthly',
    label: 'Charges fixes mensuelles',
    hint: 'Loyer, salaires, abonnements…',
    unit: 'DH',
    step: 500,
    slider: { min: 0, max: 100000 },
  },
  {
    key: 'variableCostPerUnit',
    label: 'Coût variable moyen par vente',
    hint: 'Matières, commissions, livraison…',
    unit: 'DH',
    step: 5,
    slider: { min: 0, max: 2500 },
  },
];

/**
 * Champ numérique à saisie LIBRE.
 *
 * Le modèle stocke un nombre, mais un champ vide doit rester vide à l'écran :
 * on conserve donc la chaîne saisie localement et on ne la resynchronise que
 * si la valeur externe diffère réellement (chargement d'un exemple, reset…).
 */
function NumberField({
  id,
  value,
  step,
  onChange,
}: {
  id: string;
  value: number;
  step: number;
  onChange: (next: number) => void;
}) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    const parsed = text === '' ? 0 : Number(text);
    if (!Number.isFinite(parsed) || parsed !== value) {
      setText(String(value));
    }
    // Volontairement sans `text` : on ne réécrit pas pendant la frappe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      id={id}
      type="number"
      min={0}
      step={step}
      inputMode="decimal"
      className="field-input pr-16 tabular-nums"
      value={text}
      onChange={(event) => {
        const raw = event.target.value;
        setText(raw);
        const parsed = raw === '' ? 0 : Number(raw);
        if (Number.isFinite(parsed)) onChange(Math.max(0, parsed));
      }}
    />
  );
}

/**
 * Simulateur financier : chaque modification recalcule immédiatement les
 * résultats (via l'API de prévisualisation, source unique de vérité).
 */
export function FinancialSimulator({
  value,
  onChange,
  onSave,
  onReset,
  saving,
  dirty,
  hasSaved,
  sampleAvailable,
  onLoadSample,
}: {
  value: FinancialInput;
  onChange: (next: FinancialInput) => void;
  onSave: () => void;
  onReset?: () => void;
  saving: boolean;
  dirty: boolean;
  hasSaved: boolean;
  sampleAvailable: boolean;
  onLoadSample: () => void;
}) {
  const update = (key: FieldKey, numeric: number) => {
    onChange({ ...value, [key]: Number.isFinite(numeric) ? Math.max(0, numeric) : 0 });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-brand-600" />
            Simulateur financier
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {dirty ? <Badge tone="warning">Modifications non enregistrées</Badge> : null}
            {!dirty && hasSaved ? <Badge tone="success">Hypothèses enregistrées</Badge> : null}
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Modifiez les valeurs : l&apos;ensemble des indicateurs se recalcule instantanément. Les
          calculs sont effectués côté serveur, par le moteur déterministe.
        </p>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key} className={cn(field.key === 'initialInvestment' && 'sm:col-span-2')}>
              <label htmlFor={`fin-${field.key}`} className="field-label">
                {field.label}
                <span className="ml-2 text-[11px] font-medium text-slate-400">{field.hint}</span>
              </label>
              <div className="relative">
                <NumberField
                  id={`fin-${field.key}`}
                  value={Number.isFinite(value[field.key]) ? value[field.key] : 0}
                  step={field.step}
                  onChange={(next) => update(field.key, next)}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {field.unit === 'DH' ? 'DH' : 'ventes'}
                </span>
              </div>
              {field.slider ? (
                <input
                  type="range"
                  min={field.slider.min}
                  max={Math.max(field.slider.max, value[field.key])}
                  step={field.step}
                  value={Math.min(
                    Math.max(value[field.key], field.slider.min),
                    Math.max(field.slider.max, value[field.key]),
                  )}
                  onChange={(event) => update(field.key, Number(event.target.value))}
                  className="mt-2 w-full accent-brand-600"
                  aria-label={`${field.label} (curseur)`}
                />
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {onReset ? (
              <button type="button" className="btn-ghost" onClick={onReset} disabled={saving}>
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </button>
            ) : null}
            {sampleAvailable ? (
              <button type="button" className="btn-ghost" onClick={onLoadSample} disabled={saving}>
                <Sparkles className="h-4 w-4" />
                Charger les chiffres de l&apos;exemple
              </button>
            ) : null}
          </div>

          <button type="button" className="btn-primary w-full sm:w-auto" onClick={onSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer ces hypothèses
              </>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
