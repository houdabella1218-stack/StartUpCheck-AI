/**
 * StartUpCheck AI - Moteur "Etude de projet".
 *
 * Orchestrateur 100 % deterministe. Il reutilise l'analyse existante et le
 * Financial Check deja enregistre, sans jamais recalculer les scores ni les
 * chiffres financiers.
 */

import type { AnalysisRecord } from '../types';
import { buildContext } from './context';
import {
  computeCompletenessScore,
  computeFeasibility,
} from './feasibility';
import { buildRisks, controlledRiskRate, risksIntro } from './risks';
import { buildRoadmap } from './roadmap';
import {
  buildActionPlanSection,
  buildCommercial,
  buildConclusion,
  buildFinance,
  buildMarket,
  buildOrganization,
  buildPresentation,
  buildRisksSection,
  buildTechnical,
} from './sections';
import { countSources } from './text';
import type {
  StudyCore,
  StudyMeta,
  StudySource,
  StudyText,
} from './types';

export * from './types';
export {
  FEASIBILITY_WEIGHTS,
  STUDY_STATUS_LABELS,
  computeCompletenessScore,
  computeFeasibility,
  resolveStatus,
} from './feasibility';
export { buildContext } from './context';
export { buildRisks, riskLevelOf, summarizeRisks } from './risks';
export { buildRoadmap } from './roadmap';
export { applyStudyEdits } from './edits';
export type { ApplyEditsResult, StudyEdit, StudyEditable } from './edits';
export {
  buildActionPlanSection,
  buildCommercial,
  buildConclusion,
  buildFinance,
  buildMarket,
  buildOrganization,
  buildPresentation,
  buildRisksSection,
  buildTechnical,
} from './sections';
export {
  calcule,
  countSources,
  formatMAD,
  formatPercent,
  hypothese,
  normalize,
  saisie,
  splitSentences,
  truncate,
} from './text';

export const STUDY_METHODOLOGY_VERSION = '1.0.0';

export const STUDY_ENGINE_NOTICE_LOCAL =
  "Étude générée par le moteur local déterministe, sans appel à un modèle de langage. Les scores et les chiffres financiers sont recalculables à l'identique.";

export const STUDY_ENGINE_NOTICE_LLM =
  "Étude générée par le moteur local déterministe, avec reformulation de certains textes par un modèle de langage. Les scores, les risques et les chiffres financiers restent calculés localement.";

export type BuildStudyOptions = {
  /** Date de generation (ISO). Injectee pour rendre les tests reproductibles. */
  generatedAt?: string;
};

export function buildLocalStudy(
  analysis: AnalysisRecord,
  options: BuildStudyOptions = {},
): StudyCore {
  const ctx = buildContext(analysis);
  const generatedAt = options.generatedAt ?? new Date().toISOString();

  const completenessScore = computeCompletenessScore(analysis, ctx.financial);
  const feasibility = computeFeasibility(analysis, ctx.financial, completenessScore);

  const risks = buildRisks(ctx);
  const roadmap = buildRoadmap(ctx, feasibility.status);

  const presentation = buildPresentation(ctx);
  const market = buildMarket(ctx);
  const commercial = buildCommercial(ctx);
  const technical = buildTechnical(ctx);
  const organization = buildOrganization(ctx);
  const finance = buildFinance(ctx);
  const risksSection = buildRisksSection(risksIntro(risks));
  const actionPlan = buildActionPlanSection(feasibility.status);
  const conclusion = buildConclusion(ctx, feasibility.status, feasibility.score, risks);

  const sections = [
    presentation,
    market,
    commercial,
    technical,
    organization,
    finance,
    risksSection,
    actionPlan,
    conclusion,
  ] as StudyCore['sections'];

  const dataSources: Record<StudySource, number> = {
    saisie: 0,
    calcule: 0,
    hypothese: 0,
    ia: 0,
  };
  countSources({ sections, risks, roadmap }, dataSources);

  const meta: StudyMeta = {
    engine: 'local',
    engineLabel: 'Moteur local déterministe',
    engineNotice: STUDY_ENGINE_NOTICE_LOCAL,
    llmProvider: null,
    llmModel: null,
    generatedAt,
    methodologyVersion: STUDY_METHODOLOGY_VERSION,
    lastEditedAt: null,
    warnings: buildWarnings(analysis, ctx.financial, feasibility.status, presentation.problem),
    feasibility: {
      score: feasibility.score,
      formula: feasibility.formula,
      components: feasibility.components,
    },
    completenessScore,
    dataSources,
  };

  return {
    analysisId: analysis.id,
    projectName: analysis.projectName,
    feasibilityStatus: feasibility.status,
    feasibilityStatusLabel: feasibility.statusLabel,
    feasibilityScore: feasibility.score,
    completenessScore,
    sections,
    risks,
    roadmap,
    meta,
  };
}

// ---------------------------------------------------------------------------
// Avertissements de transparence
// ---------------------------------------------------------------------------

function buildWarnings(
  analysis: AnalysisRecord,
  financial: AnalysisRecord['financial'],
  status: StudyCore['feasibilityStatus'],
  problem: StudyText,
): string[] {
  const warnings: string[] = [];

  if (!financial) {
    warnings.push(
      "Aucun Financial Check n'est rattaché : la composante Finance est omise du score de faisabilité et les poids restants sont renormalisés. Aucun chiffre financier n'est inventé.",
    );
  } else {
    if (financial.computed.unitMargin <= 0) {
      warnings.push(
        'Marge unitaire nulle ou négative dans le Financial Check : le statut est plafonné à « À retravailler ».',
      );
    }
    if (financial.health.status === 'non_rentable') {
      warnings.push(
        'Le Financial Check conclut à une activité non rentable : le statut est au mieux « Viable sous conditions ».',
      );
    }
    for (const warning of financial.warnings.slice(0, 3)) {
      warnings.push(`Financial Check : ${warning}`);
    }
  }

  if (analysis.verdict === 'risque') {
    warnings.push(
      "Le verdict de l'analyse est « risque » : le statut est au mieux « Viable sous conditions ».",
    );
  }

  if (analysis.meta.confidence < 0.55) {
    warnings.push(
      `Indice de confiance faible (${Math.round(analysis.meta.confidence * 100)}/100) : complétez la description et la cible client pour fiabiliser l'étude.`,
    );
  }

  if (problem.text.startsWith("Le problème adressé n'est pas explicitement formulé")) {
    warnings.push(
      "Le problème adressé n'est pas explicitement formulé dans la description : la section Présentation doit être complétée.",
    );
  }

  if (status === 'a_retravailler') {
    warnings.push(
      'Le niveau global de faisabilité conduit à « À retravailler » : aucune dépense irréversible ne devrait être engagée avant révision.',
    );
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Utilitaires exposes pour l'API et les tests
// ---------------------------------------------------------------------------

/** Trouve une section par cle, sans transtypage cote appelant. */
export function getSection<K extends StudyCore['sections'][number]['key']>(
  study: StudyCore,
  key: K,
): Extract<StudyCore['sections'][number], { key: K }> | null {
  const section = study.sections.find((item) => item.key === key);
  return (section as Extract<StudyCore['sections'][number], { key: K }> | undefined) ?? null;
}

/** Resume court pour les logs et les tests. */
export function describeStudy(study: StudyCore): string {
  const finance = getSection(study, 'finance');
  return [
    study.projectName,
    `${study.feasibilityScore}/100`,
    study.feasibilityStatusLabel,
    finance?.available ? 'finance incluse' : 'finance absente',
    `${study.risks.length} risques`,
    `risques maîtrisés ${Math.round(controlledRiskRate(study.risks) * 100)} %`,
    `complétude ${study.completenessScore}/100`,
  ].join(' · ');
}
