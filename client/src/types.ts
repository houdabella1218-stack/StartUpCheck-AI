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

/* -------------------------------------------------------------------------- */
/* Module "Étude de projet"                                                   */
/* -------------------------------------------------------------------------- */

export type StudySource = 'saisie' | 'calcule' | 'hypothese' | 'ia';

export type StudyText = {
  text: string;
  source: StudySource;
  note?: string;
};

export type StudySectionKey =
  | 'presentation'
  | 'marche'
  | 'commercial'
  | 'technique'
  | 'organisation'
  | 'finance'
  | 'risques'
  | 'plan_action'
  | 'conclusion';

export type PresentationSection = {
  key: 'presentation';
  title: string;
  projectName: StudyText;
  summary: StudyText;
  problem: StudyText;
  solution: StudyText;
  targetClients: StudyText;
  sector: StudyText;
  market: StudyText;
  objectives: StudyText[];
};

export type MarketSection = {
  key: 'marche';
  title: string;
  overview: StudyText;
  demand: StudyText;
  targetSegments: StudyText[];
  trends: StudyText[];
  competition: StudyText;
  opportunities: StudyText[];
  threats: StudyText[];
  notice: StudyText;
};

export type CommercialSection = {
  key: 'commercial';
  title: string;
  valueProposition: StudyText;
  offer: StudyText;
  pricing: StudyText;
  channels: StudyText[];
  communication: StudyText;
  acquisition: StudyText;
  retention: StudyText;
};

export type TechnicalSection = {
  key: 'technique';
  title: string;
  solution: StudyText;
  technologies: StudyText[];
  equipment: StudyText[];
  premises: StudyText;
  suppliers: StudyText[];
  process: StudyText[];
  constraints: StudyText[];
  scalability: StudyText;
};

export type StudyRole = {
  role: string;
  mission: string;
  priority: Priority;
  source: StudySource;
};

export type OrganizationSection = {
  key: 'organisation';
  title: string;
  team: StudyText;
  roles: StudyRole[];
  skills: StudyText[];
  partners: StudyText[];
  management: StudyText;
  legal: StudyText;
};

export type FinanceSection = {
  key: 'finance';
  title: string;
  available: boolean;
  financialCheckId: string | null;
  capturedAt: string | null;
  currency: string;
  summary: StudyText;
  input: FinancialInput | null;
  computed: FinancialComputed | null;
  health: FinancialHealth | null;
  scenarios: FinancialScenario[];
  warnings: string[];
  missingNotice: StudyText | null;
};

export type RisksSection = {
  key: 'risques';
  title: string;
  intro: StudyText;
};

export type ActionPlanSection = {
  key: 'plan_action';
  title: string;
  intro: StudyText;
};

export type StudyStatus = 'viable' | 'viable_sous_conditions' | 'a_retravailler';

export type ConclusionSection = {
  key: 'conclusion';
  title: string;
  status: StudyStatus;
  statusLabel: string;
  score: number;
  summary: StudyText;
  strengths: StudyText[];
  weaknesses: StudyText[];
  successConditions: StudyText[];
  recommendation: StudyText;
};

export type StudySection =
  | PresentationSection
  | MarketSection
  | CommercialSection
  | TechnicalSection
  | OrganizationSection
  | FinanceSection
  | RisksSection
  | ActionPlanSection
  | ConclusionSection;

export type RiskCategory =
  | 'financier'
  | 'commercial'
  | 'operationnel'
  | 'technique'
  | 'juridique'
  | 'rh';

export type RiskLevelLabel = 'faible' | 'modere' | 'eleve' | 'critique';
export type RiskScale = 1 | 2 | 3 | 4;

export type StudyRisk = {
  id: string;
  category: RiskCategory;
  categoryLabel: string;
  title: string;
  description: StudyText;
  probability: RiskScale;
  impact: RiskScale;
  score: number;
  level: RiskLevelLabel;
  levelLabel: string;
  mitigation: StudyText;
};

export type RoadmapHorizonKey = 'j0_30' | 'j30_60' | 'j60_90' | 'm3_6' | 'm6_12';

export type RoadmapAction = {
  text: StudyText;
  priority: Priority;
};

export type RoadmapStep = {
  key: RoadmapHorizonKey;
  label: string;
  period: string;
  objectives: StudyText[];
  actions: RoadmapAction[];
  indicators: StudyText[];
};

export type FeasibilityComponentKey = 'viability' | 'finance' | 'completeness';

export type FeasibilityComponent = {
  key: FeasibilityComponentKey;
  label: string;
  value: number;
  weight: number;
  available: boolean;
};

export type StudyEngineKind = 'local' | 'llm';

export type StudyMeta = {
  engine: StudyEngineKind;
  engineLabel: string;
  engineNotice: string;
  llmProvider: string | null;
  llmModel: string | null;
  generatedAt: string;
  methodologyVersion: string;
  lastEditedAt: string | null;
  warnings: string[];
  feasibility: {
    score: number;
    formula: string;
    components: FeasibilityComponent[];
  };
  completenessScore: number;
  dataSources: Record<StudySource, number>;
};

export type StudyCore = {
  analysisId: string;
  projectName: string;
  feasibilityStatus: StudyStatus;
  feasibilityStatusLabel: string;
  feasibilityScore: number;
  completenessScore: number;
  sections: StudySection[];
  risks: StudyRisk[];
  roadmap: RoadmapStep[];
  meta: StudyMeta;
};

export type StudyRecord = StudyCore & {
  id: string;
  version: number;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StudySummary = {
  id: string;
  analysisId: string;
  projectName: string;
  version: number;
  isCurrent: boolean;
  feasibilityStatus: StudyStatus;
  feasibilityStatusLabel: string;
  feasibilityScore: number;
  completenessScore: number;
  engine: StudyEngineKind;
  createdAt: string;
  updatedAt: string;
};

export type StudyEdit = {
  path: string;
  text: string;
};
