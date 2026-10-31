/**
 * StartUpCheck AI - Faisabilite globale de l'etude de projet.
 *
 * Score deterministe, borne 0-100 :
 *
 *   feasibilityScore = round( somme(valeur x poids) / somme(poids disponibles) )
 *
 * Poids theoriques : viabilite 50 %, finance 30 %, completude 20 %.
 * Si le Financial Check est absent, la composante Finance est omise et les
 * poids restants sont renormalises automatiquement.
 */

import type { AnalysisRecord } from '../types';
import type { FinancialCheckRecord } from '../financial/types';
import type {
  FeasibilityComponent,
  StudyStatus,
} from './types';

export const FEASIBILITY_WEIGHTS = {
  viability: 0.5,
  finance: 0.3,
  completeness: 0.2,
} as const;

export const STUDY_STATUS_LABELS: Record<StudyStatus, string> = {
  viable: 'Projet viable',
  viable_sous_conditions: 'Viable sous conditions',
  a_retravailler: 'À retravailler',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value);
}

/** Arrondi a 2 decimales, sans dependance externe. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Completude de l'etude :
 *  70 % de la qualite des informations saisies (meta.confidence)
 *  30 % de la presence d'un Financial Check
 */
export function computeCompletenessScore(
  analysis: AnalysisRecord,
  financial: FinancialCheckRecord | null,
): number {
  const confidence = clamp(Number.isFinite(analysis.meta.confidence) ? analysis.meta.confidence : 0, 0, 1);
  const raw = 0.7 * confidence * 100 + 0.3 * (financial ? 100 : 0);
  return round(clamp(raw, 0, 100));
}

export type FeasibilityResult = {
  score: number;
  status: StudyStatus;
  statusLabel: string;
  components: FeasibilityComponent[];
  formula: string;
};

/**
 * Plafonnements metier :
 *  - marge unitaire <= 0              -> À retravailler (toujours)
 *  - sante financiere "non_rentable"  -> au mieux Viable sous conditions
 *  - verdict "risque"                 -> au mieux Viable sous conditions
 */
export function resolveStatus(
  score: number,
  analysis: AnalysisRecord,
  financial: FinancialCheckRecord | null,
): StudyStatus {
  if (financial && financial.computed.unitMargin <= 0) {
    return 'a_retravailler';
  }

  let status: StudyStatus;
  if (score >= 70 && analysis.verdict === 'developper') {
    status = 'viable';
  } else if (score >= 45) {
    status = 'viable_sous_conditions';
  } else {
    status = 'a_retravailler';
  }

  if (status === 'viable' && analysis.verdict === 'risque') {
    status = 'viable_sous_conditions';
  }
  if (status === 'viable' && financial?.health.status === 'non_rentable') {
    status = 'viable_sous_conditions';
  }

  return status;
}

export function computeFeasibility(
  analysis: AnalysisRecord,
  financial: FinancialCheckRecord | null,
  completenessScore: number,
): FeasibilityResult {
  const components: FeasibilityComponent[] = [
    {
      key: 'viability',
      label: 'Viabilité du projet',
      value: clamp(analysis.globalScore, 0, 100),
      weight: FEASIBILITY_WEIGHTS.viability,
      available: true,
    },
  ];

  if (financial) {
    components.push({
      key: 'finance',
      label: 'Santé financière',
      value: clamp(financial.health.score, 0, 100),
      weight: FEASIBILITY_WEIGHTS.finance,
      available: true,
    });
  } else {
    components.push({
      key: 'finance',
      label: 'Santé financière',
      value: 0,
      weight: FEASIBILITY_WEIGHTS.finance,
      available: false,
    });
  }

  components.push({
    key: 'completeness',
    label: 'Complétude du dossier',
    value: clamp(completenessScore, 0, 100),
    weight: FEASIBILITY_WEIGHTS.completeness,
    available: true,
  });

  const available = components.filter((component) => component.available);
  const totalWeight = available.reduce((sum, component) => sum + component.weight, 0);
  const weighted = available.reduce((sum, component) => sum + component.value * component.weight, 0);

  const raw = totalWeight > 0 ? weighted / totalWeight : 0;
  const score = round(clamp(raw, 0, 100));
  const status = resolveStatus(score, analysis, financial);

  return {
    score,
    status,
    statusLabel: STUDY_STATUS_LABELS[status],
    components,
    formula: buildFormula(components),
  };
}

/**
 * Formule lisible, qui montre la renormalisation quand Finance manque.
 */
export function buildFormula(components: FeasibilityComponent[]): string {
  const available = components.filter((component) => component.available);
  const parts = available.map(
    (component) => `${formatWeight(component.weight)} × ${component.label.toLowerCase()} (${component.value})`,
  );
  const totalWeight = available.reduce((sum, component) => sum + component.weight, 0);
  const base = `(${parts.join(' + ')}) ÷ ${formatWeight(totalWeight)}`;

  if (available.length === components.length) {
    return `${base} = score de faisabilité`;
  }
  return `${base} — composante Finance omise, poids renormalisés`;
}

function formatWeight(weight: number): string {
  const percent = round2(weight * 100);
  return `${String(percent).replace('.', ',')} %`;
}
