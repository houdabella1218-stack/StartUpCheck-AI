import { useMemo, useState } from 'react';
import { AlertCircle, Loader2, Rocket, Sparkles, Wallet, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatMAD } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
  CreateAnalysisPayload,
  FinancialInput,
  MetaResponse,
  SampleIdea,
} from '@/types';

type FormValues = {
  projectName: string;
  description: string;
  sector: string;
  market: string;
  targetClients: string;
  budget: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

type FinancialKey = keyof FinancialInput;
type FinancialValues = Record<FinancialKey, string>;
type FinancialErrors = Partial<Record<FinancialKey, string>>;

const BUDGET_PRESETS = [50000, 150000, 500000, 1000000];

const EMPTY: FormValues = {
  projectName: '',
  description: '',
  sector: '',
  market: '',
  targetClients: '',
  budget: '',
};

const EMPTY_FINANCIAL: FinancialValues = {
  initialInvestment: '',
  unitPrice: '',
  monthlyUnits: '',
  fixedCostsMonthly: '',
  variableCostPerUnit: '',
};

const FINANCIAL_FIELDS: Array<{
  key: FinancialKey;
  label: string;
  hint: string;
  unit: 'DH' | 'ventes';
  step: number;
}> = [
  {
    key: 'initialInvestment',
    label: 'Investissement initial',
    hint: 'Montant total pour démarrer',
    unit: 'DH',
    step: 1000,
  },
  {
    key: 'unitPrice',
    label: 'Prix de vente moyen',
    hint: 'Prix moyen d’une vente / abonnement',
    unit: 'DH',
    step: 10,
  },
  {
    key: 'monthlyUnits',
    label: 'Ventes / clients par mois',
    hint: 'Volume mensuel estimé',
    unit: 'ventes',
    step: 1,
  },
  {
    key: 'fixedCostsMonthly',
    label: 'Charges fixes mensuelles',
    hint: 'Loyer, salaires, abonnements…',
    unit: 'DH',
    step: 500,
  },
  {
    key: 'variableCostPerUnit',
    label: 'Coût variable moyen par vente',
    hint: 'Matières, commissions…',
    unit: 'DH',
    step: 5,
  },
];

export function IdeaForm({
  meta,
  loading,
  onSubmit,
}: {
  meta: MetaResponse;
  loading: boolean;
  onSubmit: (input: CreateAnalysisPayload) => void;
}) {
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [financial, setFinancial] = useState<FinancialValues>(EMPTY_FINANCIAL);
  const [financialEnabled, setFinancialEnabled] = useState(false);
  const [financialErrors, setFinancialErrors] = useState<FinancialErrors>({});

  const selectedSector = useMemo(
    () => meta.sectors.find((s) => s.key === values.sector),
    [meta.sectors, values.sector],
  );

  const update = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const blur = (field: keyof FormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, values[field]) }));
  };

  const applySample = (sample: SampleIdea) => {
    setValues({
      projectName: sample.projectName,
      description: sample.description,
      sector: sample.sector,
      market: sample.market,
      targetClients: sample.targetClients,
      budget: String(sample.budget),
    });
    setErrors({});
    setTouched({});

    if (sample.financial) {
      setFinancial({
        initialInvestment: String(sample.financial.initialInvestment),
        unitPrice: String(sample.financial.unitPrice),
        monthlyUnits: String(sample.financial.monthlyUnits),
        fixedCostsMonthly: String(sample.financial.fixedCostsMonthly),
        variableCostPerUnit: String(sample.financial.variableCostPerUnit),
      });
      setFinancialEnabled(true);
      setFinancialErrors({});
    } else {
      setFinancial(EMPTY_FINANCIAL);
      setFinancialEnabled(false);
      setFinancialErrors({});
    }
  };

  const updateFinancial = (key: FinancialKey, value: string) => {
    setFinancial((prev) => ({ ...prev, [key]: value }));
    if (financialEnabled) {
      setFinancialErrors((prev) => ({ ...prev, [key]: validateFinancialField(key, value) }));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    (Object.keys(values) as Array<keyof FormValues>).forEach((field) => {
      const error = validateField(field, values[field]);
      if (error) nextErrors[field] = error;
    });

    const nextFinancialErrors: FinancialErrors = {};
    if (financialEnabled) {
      (Object.keys(financial) as FinancialKey[]).forEach((key) => {
        const error = validateFinancialField(key, financial[key]);
        if (error) nextFinancialErrors[key] = error;
      });
    }

    setErrors(nextErrors);
    setFinancialErrors(nextFinancialErrors);
    setTouched(
      Object.keys(values).reduce<Record<string, boolean>>((acc, key) => ({ ...acc, [key]: true }), {}),
    );

    if (Object.keys(nextErrors).length > 0) {
      const firstField = Object.keys(nextErrors)[0];
      document.getElementById(firstField)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (Object.keys(nextFinancialErrors).length > 0) {
      document.getElementById('financial-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const payload: CreateAnalysisPayload = {
      projectName: values.projectName.trim(),
      description: values.description.trim(),
      sector: values.sector,
      market: values.market,
      targetClients: values.targetClients.trim(),
      budget: Number(values.budget),
    };

    if (financialEnabled) {
      payload.financial = {
        initialInvestment: Number(financial.initialInvestment || 0),
        unitPrice: Number(financial.unitPrice || 0),
        monthlyUnits: Number(financial.monthlyUnits || 0),
        fixedCostsMonthly: Number(financial.fixedCostsMonthly || 0),
        variableCostPerUnit: Number(financial.variableCostPerUnit || 0),
      };
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Exemples préremplissables */}
      <Card className="border-brand-200/70 bg-gradient-to-br from-brand-50/80 to-violet-50/60">
        <CardContent className="p-4 pt-4 sm:p-5 sm:pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                <Wand2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">Essayer avec un exemple</p>
                <p className="text-xs text-slate-500">
                  Pré-remplit le formulaire pour tester l'application immédiatement.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {meta.samples.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => applySample(sample)}
                  className={cn(
                    'btn border bg-white text-xs font-bold shadow-sm transition',
                    sample.id === 'stageconnect'
                      ? 'border-brand-300 text-brand-700 hover:bg-brand-50'
                      : 'border-slate-200 text-slate-600 hover:border-brand-200 hover:text-brand-700',
                  )}
                  title={sample.tagline}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {sample.projectName}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 p-5 pt-5 sm:p-6 sm:pt-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="projectName"
              label="Nom du projet"
              hint="Le nom de votre idée de business"
              error={errors.projectName}
            >
              <input
                id="projectName"
                className={cn('field-input', errors.projectName && 'field-input-error')}
                placeholder="Ex. StageConnect"
                value={values.projectName}
                onChange={(e) => update('projectName', e.target.value)}
                onBlur={() => blur('projectName')}
                maxLength={80}
              />
            </Field>

            <Field
              id="budget"
              label="Budget disponible"
              hint="Montant que vous pouvez réellement engager"
              error={errors.budget}
            >
              <div className="relative">
                <input
                  id="budget"
                  type="number"
                  min={0}
                  step={1000}
                  className={cn('field-input pr-14', errors.budget && 'field-input-error')}
                  placeholder="150000"
                  value={values.budget}
                  onChange={(e) => update('budget', e.target.value)}
                  onBlur={() => blur('budget')}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  DH
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {BUDGET_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => update('budget', String(preset))}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    {formatMAD(preset)}
                  </button>
                ))}
              </div>
            </Field>

            <Field
              id="sector"
              label="Secteur d'activité"
              hint="Détermine les barèmes de calcul appliqués"
              error={errors.sector}
            >
              <select
                id="sector"
                className={cn('field-input', errors.sector && 'field-input-error')}
                value={values.sector}
                onChange={(e) => update('sector', e.target.value)}
                onBlur={() => blur('sector')}
              >
                <option value="">Sélectionnez un secteur…</option>
                {meta.sectors.map((sector) => (
                  <option key={sector.key} value={sector.key}>
                    {sector.emoji} {sector.label}
                  </option>
                ))}
              </select>
              {selectedSector ? (
                <p className="mt-2 text-[11px] text-slate-500">
                  {selectedSector.pitch} Ticket d'entrée indicatif :{' '}
                  <span className="font-bold text-slate-700">
                    {formatMAD(selectedSector.typicalEntryCost)}
                  </span>
                </p>
              ) : null}
            </Field>

            <Field
              id="market"
              label="Marché ou pays ciblé"
              hint="Zone géographique principale visée"
              error={errors.market}
            >
              <select
                id="market"
                className={cn('field-input', errors.market && 'field-input-error')}
                value={values.market}
                onChange={(e) => update('market', e.target.value)}
                onBlur={() => blur('market')}
              >
                <option value="">Sélectionnez un marché…</option>
                {meta.markets.map((market) => (
                  <option key={market.key} value={market.key}>
                    {market.emoji} {market.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            id="description"
            label="Description de votre idée"
            hint="Le problème résolu, votre solution et votre modèle économique"
            error={errors.description}
          >
            <textarea
              id="description"
              rows={6}
              className={cn('field-input resize-y leading-relaxed', errors.description && 'field-input-error')}
              placeholder="Décrivez le problème que vous résolvez, votre solution, et comment vous comptez gagner de l'argent…"
              value={values.description}
              onChange={(e) => update('description', e.target.value)}
              onBlur={() => blur('description')}
              maxLength={3000}
            />
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Une description détaillée améliore la précision des scores (problème, solution, modèle).
              </span>
              <span className="tabular-nums font-semibold">{values.description.length}/3000</span>
            </div>
          </Field>

          <Field
            id="targetClients"
            label="Clientèle cible"
            hint="Qui paiera pour votre produit ? (particuliers, PME, écoles…)"
            error={errors.targetClients}
          >
            <textarea
              id="targetClients"
              rows={3}
              className={cn('field-input resize-y leading-relaxed', errors.targetClients && 'field-input-error')}
              placeholder="Ex. Étudiants universitaires (B2C) et PME qui recrutent (B2B)"
              value={values.targetClients}
              onChange={(e) => update('targetClients', e.target.value)}
              onBlur={() => blur('targetClients')}
              maxLength={400}
            />
          </Field>

          {/* Chiffres clés (optionnel) — module Financial Check */}
          <div id="financial-section" className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-brand-600"
                checked={financialEnabled}
                onChange={(event) => {
                  setFinancialEnabled(event.target.checked);
                  if (!event.target.checked) setFinancialErrors({});
                }}
              />
              <span>
                <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Wallet className="h-4 w-4 text-brand-600" />
                  Compléter l&apos;analyse financière prévisionnelle (optionnel)
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                  Renseignez cinq chiffres clés pour obtenir un onglet « Finance » complet : chiffre
                  d&apos;affaires prévisionnel, marge, seuil de rentabilité, ROI et délai de
                  récupération. Vous pouvez aussi le faire plus tard depuis le dashboard.
                </span>
              </span>
            </label>

            {financialEnabled ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {FINANCIAL_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label htmlFor={`fin-${field.key}`} className="field-label">
                      {field.label}
                      <span className="ml-2 text-[11px] font-medium text-slate-400">{field.hint}</span>
                    </label>
                    <div className="relative">
                      <input
                        id={`fin-${field.key}`}
                        type="number"
                        min={0}
                        step={field.step}
                        className={cn(
                          'field-input pr-16 tabular-nums',
                          financialErrors[field.key] && 'field-input-error',
                        )}
                        placeholder="0"
                        value={financial[field.key]}
                        onChange={(event) => updateFinancial(field.key, event.target.value)}
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {field.unit === 'DH' ? 'DH' : 'ventes'}
                      </span>
                    </div>
                    {financialErrors[field.key] ? (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {financialErrors[field.key]}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              <Badge tone="neutral" className="mr-2 align-middle">
                🔒 Calcul local
              </Badge>
              Les scores sont calculés localement, sans dépendance externe.
            </p>

            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse en cours…
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Analyser mon idée
                </>
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-400">
        Astuce pour la démonstration : cliquez sur{' '}
        <span className="font-bold text-brand-600">StageConnect</span> puis sur « Analyser mon idée ».{' '}
        <Link to="/a-propos" className="font-semibold text-slate-500 underline decoration-dotted">
          Comprendre la méthode
        </Link>
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {hint ? <span className="ml-2 text-[11px] font-medium text-slate-400">{hint}</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function validateField(field: keyof FormValues, value: string): string | undefined {
  const trimmed = value.trim();

  switch (field) {
    case 'projectName':
      if (trimmed.length < 2) return 'Indiquez le nom du projet (2 caractères minimum).';
      if (trimmed.length > 80) return 'Le nom ne doit pas dépasser 80 caractères.';
      return undefined;

    case 'description':
      if (trimmed.length < 30) return "Décrivez votre idée en au moins 30 caractères pour permettre l'analyse.";
      if (trimmed.length > 3000) return 'La description ne doit pas dépasser 3000 caractères.';
      return undefined;

    case 'sector':
      if (!trimmed) return "Sélectionnez un secteur d'activité.";
      return undefined;

    case 'market':
      if (!trimmed) return 'Sélectionnez un marché cible.';
      return undefined;

    case 'targetClients':
      if (trimmed.length < 3) return 'Précisez la clientèle ciblée.';
      if (trimmed.length > 400) return 'La clientèle cible ne doit pas dépasser 400 caractères.';
      return undefined;

    case 'budget': {
      if (!trimmed) return 'Indiquez le budget disponible (0 si aucun).';
      const numeric = Number(trimmed);
      if (Number.isNaN(numeric)) return 'Le budget doit être un nombre.';
      if (numeric < 0) return 'Le budget ne peut pas être négatif.';
      if (numeric > 5_000_000_000) return 'Le budget saisi est hors limites.';
      return undefined;
    }

    default:
      return undefined;
  }
}

const FINANCIAL_LABELS: Record<FinancialKey, string> = {
  initialInvestment: "L'investissement initial",
  unitPrice: 'Le prix de vente moyen',
  monthlyUnits: 'Le nombre de ventes mensuelles',
  fixedCostsMonthly: 'Les charges fixes mensuelles',
  variableCostPerUnit: 'Le coût variable par vente',
};

function validateFinancialField(key: FinancialKey, value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `Renseignez ${FINANCIAL_LABELS[key].toLowerCase()} (0 si nul).`;

  const numeric = Number(trimmed);
  if (Number.isNaN(numeric)) return `${FINANCIAL_LABELS[key]} doit être un nombre.`;
  if (numeric < 0) return `${FINANCIAL_LABELS[key]} ne peut pas être négatif.`;
  if (numeric > 1_000_000_000_000) return `${FINANCIAL_LABELS[key]} est hors limites.`;
  return undefined;
}
