/**
 * StartUpCheck AI - Contexte partage de l'etude de projet.
 *
 * Centralise la lecture des donnees DEJA calculees par les modules existants
 * (analyse, SWOT, scores, Financial Check). Aucun recalcul de score ici.
 */

import { DEFAULT_MARKET, DEFAULT_SECTOR, MARKET_MAP, SECTOR_MAP } from '../catalog';
import type { Market, Sector } from '../catalog';
import type { AnalysisRecord, ScoreKey } from '../types';
import type { FinancialCheckRecord } from '../financial/types';
import type { StudySource } from './types';
import { normalize } from './text';

export type StudyContext = {
  analysis: AnalysisRecord;
  sector: Sector;
  market: Market;
  financial: FinancialCheckRecord | null;
  /** Score d'adequation du budget, lu dans les facteurs de l'analyse existante. */
  budgetScore: number | null;
  /** Libelle du budget ("Confortable", "Serré"...), lu dans le meme facteur. */
  budgetLabel: string | null;
  /** Valeur d'une dimension de score, sans recalcul. */
  scoreValue: (key: ScoreKey) => number;
  /** Origine des textes SWOT / recommandations existants. */
  swotSource: StudySource;
  recommendationSource: StudySource;
  verdictSource: StudySource;
  name: string;
  description: string;
  targetClients: string;
};

const BUDGET_FACTOR_PREFIX = 'adequation du budget';

export function buildContext(analysis: AnalysisRecord): StudyContext {
  const sector = SECTOR_MAP[analysis.inputs.sector] ?? DEFAULT_SECTOR;
  const market = MARKET_MAP[analysis.inputs.market] ?? DEFAULT_MARKET;

  const feasibility = analysis.scores.find((score) => score.key === 'feasibility');
  const budgetFactor = feasibility?.factors.find((factor) =>
    normalize(factor.label).startsWith(BUDGET_FACTOR_PREFIX),
  );

  const budgetLabelMatch = budgetFactor?.label.match(/\(([^)]+)\)/);

  const isLlm = analysis.meta.engine === 'llm';

  return {
    analysis,
    sector,
    market,
    financial: analysis.financial,
    budgetScore: budgetFactor ? budgetFactor.value : null,
    budgetLabel: budgetLabelMatch ? budgetLabelMatch[1] : null,
    scoreValue: (key: ScoreKey) => analysis.scores.find((score) => score.key === key)?.value ?? 0,
    // Un SWOT issu du LLM reste marque "ia" : on ne le presente pas comme un calcul.
    swotSource: isLlm ? 'ia' : 'hypothese',
    recommendationSource: isLlm ? 'ia' : 'calcule',
    verdictSource: isLlm ? 'ia' : 'calcule',
    name: analysis.projectName,
    description: analysis.inputs.description.trim(),
    targetClients: analysis.inputs.targetClients.trim(),
  };
}
