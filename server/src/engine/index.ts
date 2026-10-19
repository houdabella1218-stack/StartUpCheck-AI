/**
 * StartUpCheck AI - Orchestrateur du moteur d'analyse.
 *
 * Étape 1 : le moteur déterministe calcule TOUJOURS les scores.
 * Étape 2 : le générateur local produit un SWOT et des recommandations.
 * Étape 3 : si (et seulement si) un LLM est configuré et répond correctement,
 *           le texte est remplacé par une version enrichie.
 *
 * Garantie : cette fonction ne lève jamais d'exception à cause du LLM.
 */

import { buildFallbackRecommendations, buildFallbackSwot } from './fallback';
import { METHODOLOGY_VERSION, scoreIdea } from './scoring';
import type { AnalysisCore, AnalysisInput } from './types';
import { enrichWithLlm } from '../services/llm';

export const ENGINE_NOTICES = {
  local:
    "Rapport calculé par le moteur d'analyse déterministe de StartUpCheck AI. Aucune IA générative n'a été utilisée : les scores et les textes proviennent de règles de calcul internes et de barèmes sectoriels.",
  llm:
    "Scores calculés par le moteur d'analyse déterministe de StartUpCheck AI. Le SWOT, les recommandations et la justification du verdict ont été rédigés par une IA générative, à partir de ces scores.",
} as const;

export async function analyzeIdea(input: AnalysisInput): Promise<AnalysisCore> {
  const outcome = scoreIdea(input);

  let swot = buildFallbackSwot(outcome);
  let recommendations = buildFallbackRecommendations(outcome);
  let verdictReason = outcome.verdictReason;

  let engine: AnalysisCore['meta']['engine'] = 'local';
  let engineLabel = "Moteur d'analyse local";
  let engineNotice: string = ENGINE_NOTICES.local;
  let llmProvider: string | null = null;
  let llmModel: string | null = null;

  // Le prompt reçoit les libellés lisibles (et non les clés techniques).
  const promptInput: AnalysisInput = {
    ...input,
    sector: outcome.sector.label,
    market: outcome.market.label,
  };

  const enrichment = await enrichWithLlm(
    promptInput,
    outcome.scores,
    outcome.globalScore,
    outcome.verdictLabel,
    outcome.riskLabel,
  );

  if (enrichment) {
    swot = enrichment.swot;
    recommendations = enrichment.recommendations;
    verdictReason = enrichment.verdictReason;
    engine = 'llm';
    engineLabel = 'Moteur local + enrichissement IA générative';
    engineNotice = ENGINE_NOTICES.llm;
    llmProvider = enrichment.provider;
    llmModel = enrichment.model;
  }

  return {
    projectName: input.projectName,
    inputs: input,
    sectorLabel: outcome.sector.label,
    marketLabel: outcome.market.label,
    globalScore: outcome.globalScore,
    scores: outcome.scores,
    riskLevel: outcome.riskLevel,
    riskLabel: outcome.riskLabel,
    swot,
    recommendations,
    verdict: outcome.verdict,
    verdictLabel: outcome.verdictLabel,
    verdictReason,
    meta: {
      engine,
      engineLabel,
      engineNotice,
      llmProvider,
      llmModel,
      generatedAt: new Date().toISOString(),
      methodologyVersion: METHODOLOGY_VERSION,
      confidence: outcome.confidence,
    },
  };
}
