/**
 * StartUpCheck AI - Module "Etude de projet".
 *
 * Contrat de donnees de l'etude de projet structuree.
 *
 * REGLE ABSOLUE : les scores, les calculs et les chiffres financiers sont
 * DETERMINISTES. Un LLM peut seulement reformuler du texte, jamais produire
 * un montant, un pourcentage ou une note.
 *
 * Chaque bloc de texte porte sa source pour garantir la transparence :
 *  - saisie    : information fournie par l'utilisateur
 *  - calcule   : resultat deterministe (score, marge, seuil...)
 *  - hypothese : deduction heuristique, jamais presentee comme une donnee reelle
 *  - ia        : texte reformule par un modele de langage
 */

import type { Priority } from '../types';
import type {
  FinancialComputed,
  FinancialHealth,
  FinancialInput,
  FinancialScenario,
} from '../financial/types';

// ---------------------------------------------------------------------------
// Transparence
// ---------------------------------------------------------------------------

export type StudySource = 'saisie' | 'calcule' | 'hypothese' | 'ia';

export type StudyText = {
  /** Contenu affiche a l'utilisateur */
  text: string;
  /** Origine de l'information */
  source: StudySource;
  /** Precision de transparence optionnelle */
  note?: string;
};

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

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
  /** Rappel : aucune donnee chiffree de marche n'est disponible. */
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

/**
 * Section Finance : COPIE FIGEE du Financial Check existant.
 * Aucun calcul n'est refait ici (pas d'appel a computeFinancialCheck).
 */
export type FinanceSection = {
  key: 'finance';
  title: string;
  available: boolean;
  /** Financial Check source, pour la tracabilite */
  financialCheckId: string | null;
  /** Date de capture de la copie figee */
  capturedAt: string | null;
  currency: string;
  summary: StudyText;
  input: FinancialInput | null;
  computed: FinancialComputed | null;
  health: FinancialHealth | null;
  scenarios: FinancialScenario[];
  warnings: string[];
  /** Message explicite quand aucun Financial Check n'existe. */
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

// ---------------------------------------------------------------------------
// Risques
// ---------------------------------------------------------------------------

export type RiskCategory =
  | 'financier'
  | 'commercial'
  | 'operationnel'
  | 'technique'
  | 'juridique'
  | 'rh';

export type RiskLevelLabel = 'faible' | 'modere' | 'eleve' | 'critique';

/** Probabilite et impact sur une echelle de 1 a 4. */
export type RiskScale = 1 | 2 | 3 | 4;

export type StudyRisk = {
  id: string;
  category: RiskCategory;
  categoryLabel: string;
  title: string;
  description: StudyText;
  probability: RiskScale;
  impact: RiskScale;
  /** Niveau = probabilite x impact (1 a 16) */
  score: number;
  level: RiskLevelLabel;
  levelLabel: string;
  mitigation: StudyText;
};

// ---------------------------------------------------------------------------
// Feuille de route
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Meta et resultat complet
// ---------------------------------------------------------------------------

export type FeasibilityComponentKey = 'viability' | 'finance' | 'completeness';

export type FeasibilityComponent = {
  key: FeasibilityComponentKey;
  label: string;
  value: number;
  /** Poids theorique (0-1) */
  weight: number;
  /** La composante est-elle disponible ? */
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
  /** Date de la derniere modification manuelle, null si jamais editee */
  lastEditedAt: string | null;
  /** Avertissements de transparence ou de completude */
  warnings: string[];
  feasibility: {
    score: number;
    /** Formule lisible, avec renormalisation si une composante manque */
    formula: string;
    components: FeasibilityComponent[];
  };
  completenessScore: number;
  /** Nombre de blocs de texte par origine */
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

/** Enregistrement complet renvoye par l'API. */
export type ProjectStudyRecord = StudyCore & {
  id: string;
  version: number;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Resume pour l'historique. */
export type ProjectStudySummary = {
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
