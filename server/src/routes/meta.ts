import { Router } from 'express';
import { MARKETS, SECTORS } from '../engine/catalog';
import { SAMPLE_IDEAS } from '../data/sampleIdeas';
import { getLlmConfig } from '../services/llm';

export const metaRouter = Router();

/**
 * GET /api/meta
 * Renvoie les référentiels nécessaires au formulaire, ainsi que l'état
 * de la configuration IA générative (pour l'afficher honnêtement au client).
 */
metaRouter.get('/', (_req, res) => {
  const llm = getLlmConfig();

  res.json({
    currency: 'MAD',
    currencySymbol: 'DH',
    sectors: SECTORS.map((s) => ({
      key: s.key,
      label: s.label,
      emoji: s.emoji,
      pitch: s.pitch,
      typicalEntryCost: s.entryCost,
    })),
    markets: MARKETS.map((m) => ({
      key: m.key,
      label: m.label,
      emoji: m.emoji,
    })),
    samples: SAMPLE_IDEAS.map((s) => ({
      id: s.id,
      tagline: s.tagline,
      projectName: s.projectName,
      description: s.description,
      sector: s.sector,
      market: s.market,
      targetClients: s.targetClients,
      budget: s.budget,
      financial: s.financial ?? null,
    })),
    engine: {
      llmConfigured: Boolean(llm),
      llmProvider: llm?.provider ?? null,
      llmModel: llm?.model ?? null,
      scoring: 'Calcul déterministe local (aucune dépendance externe)',
      financial: 'Module financier déterministe (aucun LLM dans les calculs)',
    },
  });
});
