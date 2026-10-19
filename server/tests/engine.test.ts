/**
 * Tests du moteur d'analyse (aucune API externe requise).
 * Lancement : npm test
 */

import { describe, expect, it } from 'vitest';
import { analyzeIdea } from '../src/engine';
import { buildFallbackRecommendations, buildFallbackSwot } from '../src/engine/fallback';
import { riskLevelOf, scoreIdea, verdictOf } from '../src/engine/scoring';
import type { AnalysisInput } from '../src/engine/types';

const stageConnect: AnalysisInput = {
  projectName: 'StageConnect',
  description:
    "StageConnect est une plateforme numérique qui met en relation les étudiants à la recherche de stages avec les entreprises qui recrutent. Le problème est que les candidatures se perdent et les étudiants n'ont aucun retour. Notre solution permet de créer un profil avec ses compétences, de recevoir des offres grâce à un algorithme de matching et de suivre chaque candidature dans un tableau de bord. Le modèle repose sur un abonnement mensuel pour les entreprises et un plan gratuit pour les étudiants.",
  sector: 'edtech',
  market: 'maroc',
  targetClients: 'Étudiants universitaires (B2C), PME et startups qui recrutent (B2B), écoles partenaires',
  budget: 150000,
};

const vagueIdea: AnalysisInput = {
  projectName: 'Boutique',
  description: 'Je veux vendre des produits en ligne à tout le monde.',
  sector: 'ecommerce',
  market: 'maroc',
  targetClients: 'Tout le monde',
  budget: 5000,
};

describe('moteur de scoring', () => {
  it('produit des scores bornés entre 0 et 100', () => {
    const outcome = scoreIdea(stageConnect);

    for (const score of outcome.scores) {
      expect(score.value).toBeGreaterThanOrEqual(0);
      expect(score.value).toBeLessThanOrEqual(100);
    }
    expect(outcome.globalScore).toBeGreaterThanOrEqual(0);
    expect(outcome.globalScore).toBeLessThanOrEqual(100);
  });

  it('contient exactement les 5 dimensions attendues avec leurs poids', () => {
    const outcome = scoreIdea(stageConnect);
    const keys = outcome.scores.map((s) => s.key).sort();

    expect(keys).toEqual(['feasibility', 'growth', 'innovation', 'market', 'risk']);
    const totalWeight = outcome.scores.reduce((sum, s) => sum + s.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 5);
  });

  it('est déterministe : deux appels identiques donnent le même résultat', () => {
    const a = scoreIdea(stageConnect);
    const b = scoreIdea(stageConnect);
    expect(a.globalScore).toBe(b.globalScore);
    expect(a.scores.map((s) => s.value)).toEqual(b.scores.map((s) => s.value));
  });

  it('ne donne jamais un meilleur score à une idée vague qu’à une idée structurée (même budget)', () => {
    const budget = 150000;
    const structured = scoreIdea({ ...stageConnect, budget });
    const vague = scoreIdea({ ...stageConnect, description: 'Une app cool.', targetClients: 'Des gens', budget });

    expect(vague.globalScore).toBeLessThanOrEqual(structured.globalScore);
  });

  it('améliore la faisabilité et réduit le risque quand le budget augmente', () => {
    const low = scoreIdea({ ...stageConnect, budget: 20000 });
    const high = scoreIdea({ ...stageConnect, budget: 600000 });

    const lowFeasibility = low.scores.find((s) => s.key === 'feasibility')!.value;
    const highFeasibility = high.scores.find((s) => s.key === 'feasibility')!.value;
    const lowRisk = low.scores.find((s) => s.key === 'risk')!.value;
    const highRisk = high.scores.find((s) => s.key === 'risk')!.value;

    expect(highFeasibility).toBeGreaterThan(lowFeasibility);
    expect(highRisk).toBeLessThan(lowRisk);
  });

  it('applique correctement les seuils de verdict', () => {
    expect(verdictOf(85).verdict).toBe('developper');
    expect(verdictOf(70).verdict).toBe('developper');
    expect(verdictOf(69).verdict).toBe('ameliorer');
    expect(verdictOf(50).verdict).toBe('ameliorer');
    expect(verdictOf(49).verdict).toBe('risque');
    expect(verdictOf(0).verdict).toBe('risque');
  });

  it('applique correctement les seuils de niveau de risque', () => {
    expect(riskLevelOf(10).level).toBe('faible');
    expect(riskLevelOf(40).level).toBe('modere');
    expect(riskLevelOf(60).level).toBe('eleve');
    expect(riskLevelOf(85).level).toBe('tres_eleve');
  });

  it('confirme que le score global suit la formule pondérée (risque inversé)', () => {
    const outcome = scoreIdea(stageConnect);
    const get = (key: string) => outcome.scores.find((s) => s.key === key)!.value;

    const expected = Math.round(
      0.25 * get('market') +
        0.2 * get('feasibility') +
        0.2 * get('innovation') +
        0.2 * get('growth') +
        0.15 * (100 - get('risk')),
    );

    expect(outcome.globalScore).toBe(expected);
  });
});

describe('générateur de texte local (fallback)', () => {
  it('produit un SWOT complet', () => {
    const outcome = scoreIdea(stageConnect);
    const swot = buildFallbackSwot(outcome);

    expect(swot.strengths.length).toBeGreaterThan(0);
    expect(swot.weaknesses.length).toBeGreaterThan(0);
    expect(swot.opportunities.length).toBeGreaterThan(0);
    expect(swot.threats.length).toBeGreaterThan(0);
    expect(swot.strengths.every((item) => item.length > 10)).toBe(true);
  });

  it('produit entre 3 et 6 recommandations priorisées', () => {
    const outcome = scoreIdea(stageConnect);
    const recommendations = buildFallbackRecommendations(outcome);

    expect(recommendations.length).toBeGreaterThanOrEqual(3);
    expect(recommendations.length).toBeLessThanOrEqual(6);
    expect(recommendations.every((r) => ['haute', 'moyenne', 'basse'].includes(r.priority))).toBe(true);
    expect(recommendations.every((r) => r.detail.length > 30)).toBe(true);
  });

  it('signale le sous-financement quand le budget est très inférieur au ticket d’entrée', () => {
    const outcome = scoreIdea({ ...vagueIdea, budget: 3000 });
    const recommendations = buildFallbackRecommendations(outcome);
    const texts = recommendations.map((r) => `${r.title} ${r.detail}`).join(' ').toLowerCase();

    expect(texts).toContain('budget');
  });
});

describe('orchestrateur analyzeIdea', () => {
  it('fonctionne sans aucune clé API et déclare honnêtement le moteur local', async () => {
    const result = await analyzeIdea(stageConnect);

    expect(result.meta.engine).toBe('local');
    expect(result.meta.llmProvider).toBeNull();
    expect(result.meta.engineNotice.toLowerCase()).toContain('aucune ia générative');
    expect(result.meta.engineNotice.toLowerCase()).not.toContain('rédigés par une ia');
    expect(result.scores).toHaveLength(5);
    expect(result.swot.strengths.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThanOrEqual(3);
  });

  it('donne un verdict cohérent avec le score global', async () => {
    const result = await analyzeIdea(stageConnect);
    const expected = verdictOf(result.globalScore);
    expect(result.verdict).toBe(expected.verdict);
    expect(result.verdictLabel).toBe(expected.label);
  });

  it('renvoie un indice de confiance compris entre 0.3 et 0.95', async () => {
    const result = await analyzeIdea(stageConnect);
    expect(result.meta.confidence).toBeGreaterThanOrEqual(0.3);
    expect(result.meta.confidence).toBeLessThanOrEqual(0.95);
  });

  it('produit un score plausible pour StageConnect (entre 55 et 85)', async () => {
    const result = await analyzeIdea(stageConnect);
    expect(result.globalScore).toBeGreaterThanOrEqual(55);
    expect(result.globalScore).toBeLessThanOrEqual(85);
  });
});
