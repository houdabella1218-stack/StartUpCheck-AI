/**
 * Types partagés avec l'API StartUpCheck AI.
 */

export type ScoreKey = 'market' | 'feasibility' | 'innovation' | 'growth' | 'risk';

export type ScoreFactor = {
  label: string;
  value: number;
};

export type ScoreResult = {
  key: ScoreKey;
  label: string;
  value: number;
  weight: number;
  inverted: boolean;
  summary: string;
  factors: ScoreFactor[];
};

export type Swot = {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
};

export type Priority = 'haute' | 'moyenne' | 'basse';

export type Recommendation = {
  title: string;
  detail: string;
  priority: Priority;
  axis: string;
};

export type Verdict = 'developper' | 'ameliorer' | 'risque';
export type RiskLevel = 'faible' | 'modere' | 'eleve' | 'tres_eleve';
export type EngineKind = 'local' | 'llm';

export type AnalysisInput = {
  projectName: string;
  description: string;
  sector: string;
  market: string;
  targetClients: string;
  budget: number;
};

export type AnalysisMeta = {
  engine: EngineKind;
  engineLabel: string;
  engineNotice: string;
  llmProvider: string | null;
  llmModel: string | null;
  generatedAt: string;
  methodologyVersion: string;
  confidence: number;
};

export type Analysis = {
  id: string;
  createdAt: string;
  projectName: string;
  inputs: AnalysisInput;
  sectorLabel: string;
  marketLabel: string;
  globalScore: number;
  scores: ScoreResult[];
  riskLevel: RiskLevel;
  riskLabel: string;
  swot: Swot;
  recommendations: Recommendation[];
  verdict: Verdict;
  verdictLabel: string;
  verdictReason: string;
  meta: AnalysisMeta;
  /** Analyse financière prévisionnelle rattachée (module Financial Check). */
  financial: FinancialCheckRecord | null;
};

export type AnalysisSummary = {
  id: string;
  projectName: string;
  sector: string;
  sectorLabel: string;
  marketLabel: string;
  globalScore: number;
  verdict: Verdict;
  verdictLabel: string;
  riskLevel: RiskLevel;
  engine: EngineKind;
  createdAt: string;
};

export type SectorOption = {
  key: string;
  label: string;
  emoji: string;
  pitch: string;
  typicalEntryCost: number;
};

export type MarketOption = {
  key: string;
  label: string;
  emoji: string;
};

export type SampleIdea = AnalysisInput & {
  id: string;
  tagline: string;
  /** Hypothèses financières d'exemple (module Financial Check). */
  financial?: FinancialInput | null;
};

export type MetaResponse = {
  currency: string;
  currencySymbol: string;
  sectors: SectorOption[];
  markets: MarketOption[];
  samples: SampleIdea[];
  engine: {
    llmConfigured: boolean;
    llmProvider: string | null;
    llmModel: string | null;
    scoring: string;
    financial?: string;
  };
};

/* -------------------------------------------------------------------------- */
/* Module "Financial Check"                                                   */
/* -------------------------------------------------------------------------- */

export type FinancialInput = {
  initialInvestment: number;
  unitPrice: number;
  monthlyUnits: number;
  fixedCostsMonthly: number;
  variableCostPerUnit: number;
};

export type ScenarioKey = 'pessimiste' | 'realiste' | 'optimiste';

export type ScenarioCoefficients = {
  volume: number;
  price: number;
  variableCost: number;
  fixedCosts: number;
  investment: number;
};

export type FinancialComputed = {
  monthlyRevenue: number;
  annualRevenue: number;
  monthlyVariableCosts: number;
  annualVariableCosts: number;
  monthlyTotalCosts: number;
  annualTotalCosts: number;
  contributionMargin: number;
  contributionMarginRate: number;
  unitMargin: number;
  monthlyResult: number;
  annualResult: number;
  netMarginRate: number | null;
  breakEvenRevenue: number | null;
  breakEvenUnits: number | null;
  roiAnnual: number | null;
  paybackMonths: number | null;
  paybackYears: number | null;
  safetyMarginRate: number | null;
  isProfitable: boolean;
  breakEvenReachable: boolean;
};

export type FinancialHealthStatus = 'solide' | 'fragile' | 'risque' | 'non_rentable';

export type FinancialHealthFactor = {
  label: string;
  impact: number;
};

export type FinancialHealth = {
  /** Score 0-100, toujours borné. */
  score: number;
  status: FinancialHealthStatus;
  label: string;
  summary: string;
  factors: FinancialHealthFactor[];
};

export type ScenarioAssumption = {
  label: string;
  detail: string;
};

export type FinancialScenario = {
  key: ScenarioKey;
  label: string;
  description: string;
  coefficients: ScenarioCoefficients;
  assumptions: ScenarioAssumption[];
  input: FinancialInput;
  computed: FinancialComputed;
  health: FinancialHealth;
};

export type FinancialAssumptions = {
  scenarioCoefficients: Record<ScenarioKey, ScenarioCoefficients>;
  notes: string[];
};

export type FinancialEngineMeta = {
  engine: 'financial-deterministic';
  engineLabel: string;
  engineNotice: string;
  disclaimer: string;
  methodologyVersion: string;
  generatedAt: string;
};

/** Résultat de calcul (prévisualisation) — non persisté. */
export type FinancialCheck = {
  currency: string;
  input: FinancialInput;
  computed: FinancialComputed;
  health: FinancialHealth;
  scenarios: FinancialScenario[];
  assumptions: FinancialAssumptions;
  warnings: string[];
  meta: FinancialEngineMeta;
};

/** Résultat persisté en base. */
export type FinancialCheckRecord = FinancialCheck & {
  id: string;
  analysisId: string | null;
  createdAt: string;
};

/** Corps envoyé à POST /api/analyses (bloc financier optionnel). */
export type CreateAnalysisPayload = AnalysisInput & {
  financial?: FinancialInput;
};
