/**
 * StartUpCheck AI - Types du moteur d'analyse.
 * Ces types definissent le contrat de donnees renvoye par l'API.
 */

import type { FinancialCheckRecord } from './financial/types';

export type ScoreKey = 'market' | 'feasibility' | 'innovation' | 'growth' | 'risk';
export type ScoreFactor = {
  /** Libelle du facteur pris en compte */
  label: string;
  /** Valeur normalisee du facteur (0-100) */
  value: number;
};

export type ScoreResult = {
  key: ScoreKey;
  label: string;
  /** Score sur 100 */
  value: number;
  /** Poids dans le score global (0-1) */
  weight: number;
  /** Le risque est inverse dans le score global */
  inverted: boolean;
  /** Phrase courte expliquant la note */
  summary: string;
  /** Detail du calcul, pour la transparence */
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
  /** Dimension principale concernee */
  axis: string;
};

export type Verdict = 'developper' | 'ameliorer' | 'risque';

export type RiskLevel = 'faible' | 'modere' | 'eleve' | 'tres_eleve';

export type AnalysisInput = {
  projectName: string;
  description: string;
  sector: string;
  market: string;
  targetClients: string;
  budget: number;
};

export type EngineKind = 'local' | 'llm';

export type AnalysisMeta = {
  engine: EngineKind;
  engineLabel: string;
  /** Message de transparence affiche dans l'interface */
  engineNotice: string;
  llmProvider: string | null;
  llmModel: string | null;
  generatedAt: string;
  methodologyVersion: string;
  /** Indice de confiance (0-1) base sur la qualite des informations fournies */
  confidence: number;
};

export type AnalysisCore = {
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
};

export type AnalysisRecord = AnalysisCore & {
  id: string;
  createdAt: string;
  /** Analyse financiere previsionnelle rattachee (module Financial Check). */
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
