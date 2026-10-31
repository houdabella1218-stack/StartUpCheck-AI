/**
 * Conversion des enregistrements SQLite (JSON stocké en texte)
 * vers les objets typés renvoyés par l'API.
 */

import type { Analysis, FinancialCheck, ProjectStudy } from '@prisma/client';
import type {
  AnalysisRecord,
  AnalysisSummary,
  Recommendation,
  RiskLevel,
  ScoreResult,
  Swot,
  Verdict,
} from '../engine/types';
import type {
  FinancialCheckRecord,
  FinancialComputed,
  FinancialHealth,
  FinancialHealthStatus,
  FinancialInput,
  FinancialScenario,
} from '../engine/financial/types';
import { HEALTH_STATUS_LABELS, SCENARIO_COEFFICIENTS } from '../engine/financial';
import { STUDY_STATUS_LABELS } from '../engine/project-study';
import type {
  ProjectStudyRecord,
  ProjectStudySummary,
  RoadmapStep,
  StudyEngineKind,
  StudyMeta,
  StudyRisk,
  StudySection,
  StudyStatus,
} from '../engine/project-study/types';

/** Ligne Analysis enrichie de ses analyses financieres (include Prisma). */
export type AnalysisWithFinancial = Analysis & { financialChecks?: FinancialCheck[] };

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function toAnalysisRecord(row: AnalysisWithFinancial): AnalysisRecord {
  const scores = parseJson<ScoreResult[]>(row.scoresJson, []);
  const swot = parseJson<Swot>(row.swotJson, {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
  });
  const recommendations = parseJson<Recommendation[]>(row.recommendationsJson, []);
  const meta = parseJson<AnalysisRecord['meta'] & { verdictReason?: string }>(row.metaJson, {
    engine: 'local',
    engineLabel: "Moteur d'analyse local",
    engineNotice: '',
    llmProvider: null,
    llmModel: null,
    generatedAt: row.createdAt.toISOString(),
    methodologyVersion: '1.0.0',
    confidence: 0.5,
  });

  const financialRow = row.financialChecks?.[0];

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    projectName: row.projectName,
    inputs: {
      projectName: row.projectName,
      description: row.description,
      sector: row.sector,
      market: row.market,
      targetClients: row.targetClients,
      budget: row.budget,
    },
    sectorLabel: row.sectorLabel,
    marketLabel: row.marketLabel,
    globalScore: row.globalScore,
    scores,
    riskLevel: row.riskLevel as RiskLevel,
    riskLabel: labelForRisk(row.riskLevel),
    swot,
    recommendations,
    verdict: row.verdict as Verdict,
    verdictLabel: row.verdictLabel,
    verdictReason: meta.verdictReason ?? '',
    meta,
    financial: financialRow ? toFinancialRecord(financialRow) : null,
  };
}

export function toAnalysisSummary(row: Analysis): AnalysisSummary {
  return {
    id: row.id,
    projectName: row.projectName,
    sector: row.sector,
    sectorLabel: row.sectorLabel,
    marketLabel: row.marketLabel,
    globalScore: row.globalScore,
    verdict: row.verdict as Verdict,
    verdictLabel: row.verdictLabel,
    riskLevel: row.riskLevel as RiskLevel,
    engine: row.engine as AnalysisSummary['engine'],
    createdAt: row.createdAt.toISOString(),
  };
}

const EMPTY_COMPUTED: FinancialComputed = {
  monthlyRevenue: 0,
  annualRevenue: 0,
  monthlyVariableCosts: 0,
  annualVariableCosts: 0,
  monthlyTotalCosts: 0,
  annualTotalCosts: 0,
  contributionMargin: 0,
  contributionMarginRate: 0,
  unitMargin: 0,
  monthlyResult: 0,
  annualResult: 0,
  netMarginRate: null,
  breakEvenRevenue: null,
  breakEvenUnits: null,
  roiAnnual: null,
  paybackMonths: null,
  paybackYears: null,
  safetyMarginRate: null,
  isProfitable: false,
  breakEvenReachable: false,
};

type StoredFinancialMeta = FinancialCheckRecord['meta'] & {
  warnings?: string[];
  health?: FinancialHealth;
};

export function toFinancialRecord(row: FinancialCheck): FinancialCheckRecord {
  const input: FinancialInput = {
    initialInvestment: row.initialInvestment,
    unitPrice: row.unitPrice,
    monthlyUnits: row.monthlyUnits,
    fixedCostsMonthly: row.fixedCostsMonthly,
    variableCostPerUnit: row.variableCostPerUnit,
  };

  const computed = parseJson<FinancialComputed>(row.computedJson, EMPTY_COMPUTED);
  const scenarios = parseJson<FinancialScenario[]>(row.scenariosJson, []);
  const assumptions = parseJson<FinancialCheckRecord['assumptions']>(row.assumptionsJson, {
    scenarioCoefficients: SCENARIO_COEFFICIENTS,
    notes: [],
  });

  const stored = parseJson<StoredFinancialMeta>(row.metaJson, {
    engine: 'financial-deterministic',
    engineLabel: 'Module financier déterministe',
    engineNotice: '',
    disclaimer: '',
    methodologyVersion: '1.0.0',
    generatedAt: row.createdAt.toISOString(),
  });

  const { warnings, health, ...meta } = stored;
  const status = row.healthStatus as FinancialHealthStatus;
  const resolvedHealth: FinancialHealth = health ?? {
    score: row.healthScore,
    status,
    label: HEALTH_STATUS_LABELS[status] ?? row.healthStatus,
    summary: '',
    factors: [],
  };

  return {
    id: row.id,
    analysisId: row.analysisId,
    currency: row.currency,
    input,
    computed,
    health: resolvedHealth,
    scenarios,
    assumptions,
    warnings: warnings ?? [],
    meta,
    createdAt: row.createdAt.toISOString(),
  };
}

export function labelForRisk(risk: string): string {
  switch (risk) {
    case 'faible':
      return 'Faible';
    case 'modere':
      return 'Modéré';
    case 'eleve':
      return 'Élevé';
    case 'tres_eleve':
      return 'Très élevé';
    default:
      return 'Non évalué';
  }
}

/* -------------------------------------------------------------------------- */
/* Module "Étude de projet"                                                   */
/* -------------------------------------------------------------------------- */

function fallbackStudyMeta(row: ProjectStudy): StudyMeta {
  return {
    engine: row.engine as StudyEngineKind,
    engineLabel:
      row.engine === 'llm'
        ? 'Moteur local + reformulation IA'
        : 'Moteur local déterministe',
    engineNotice: '',
    llmProvider: null,
    llmModel: null,
    generatedAt: row.createdAt.toISOString(),
    methodologyVersion: row.methodologyVersion,
    lastEditedAt: null,
    warnings: [],
    feasibility: {
      score: row.feasibilityScore,
      formula: '',
      components: [],
    },
    completenessScore: row.completenessScore,
    dataSources: { saisie: 0, calcule: 0, hypothese: 0, ia: 0 },
  };
}

export function toProjectStudyRecord(row: ProjectStudy): ProjectStudyRecord {
  const status = row.feasibilityStatus as StudyStatus;

  return {
    id: row.id,
    analysisId: row.analysisId,
    version: row.version,
    isCurrent: row.isCurrent,
    projectName: row.projectName,
    feasibilityStatus: status,
    feasibilityStatusLabel: STUDY_STATUS_LABELS[status] ?? row.feasibilityStatus,
    feasibilityScore: row.feasibilityScore,
    completenessScore: row.completenessScore,
    sections: parseJson<StudySection[]>(row.sectionsJson, []),
    risks: parseJson<StudyRisk[]>(row.risksJson, []),
    roadmap: parseJson<RoadmapStep[]>(row.roadmapJson, []),
    meta: parseJson<StudyMeta>(row.metaJson, fallbackStudyMeta(row)),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toProjectStudySummary(row: ProjectStudy): ProjectStudySummary {
  const status = row.feasibilityStatus as StudyStatus;

  return {
    id: row.id,
    analysisId: row.analysisId,
    projectName: row.projectName,
    version: row.version,
    isCurrent: row.isCurrent,
    feasibilityStatus: status,
    feasibilityStatusLabel: STUDY_STATUS_LABELS[status] ?? row.feasibilityStatus,
    feasibilityScore: row.feasibilityScore,
    completenessScore: row.completenessScore,
    engine: row.engine as StudyEngineKind,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
