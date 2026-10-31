/**
 * Tests de la reformulation optionnelle de l'étude de projet par LLM.
 *
 * Aucun appel réseau réel : `fetch` est remplacé par un double de test.
 * Ces tests vérifient surtout les garde-fous (aucun chiffre inventé) et le
 * repli silencieux sur le moteur local.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildFallbackRecommendations, buildFallbackSwot } from '../src/engine/fallback';
import { computeFinancialCheck } from '../src/engine/financial';
import type { FinancialCheckRecord, FinancialInput } from '../src/engine/financial/types';
import { buildLocalStudy, getSection } from '../src/engine/project-study';
import { scoreIdea } from '../src/engine/scoring';
import type { AnalysisInput, AnalysisRecord } from '../src/engine/types';
import {
  applyStudyRewrites,
  buildStudyLlmFields,
  enrichStudyWithLlm,
  numericTokens,
  validateStudyRewrites,
} from '../src/services/studyLlm';

const stageConnect: AnalysisInput = {
  projectName: 'StageConnect',
  description:
    'Plateforme qui met en relation les étudiants à la recherche de stages et les entreprises qui recrutent. Elle propose un matching par compétences et un accompagnement des candidats.',
  sector: 'saas',
  market: 'maroc',
  targetClients: 'Étudiants en fin de cursus et PME marocaines',
  budget: 150000,
};

const financialInput: FinancialInput = {
  initialInvestment: 100000,
  unitPrice: 200,
  monthlyUnits: 100,
  fixedCostsMonthly: 5000,
  variableCostPerUnit: 50,
};

function buildRecord(
  input: AnalysisInput,
  financial: FinancialCheckRecord | null = null,
): AnalysisRecord {
  const outcome = scoreIdea(input);
  return {
    id: 'analysis-test',
    createdAt: '2026-10-19T16:28:18.894Z',
    projectName: input.projectName,
    inputs: input,
    sectorLabel: outcome.sector.label,
    marketLabel: outcome.market.label,
    globalScore: outcome.globalScore,
    scores: outcome.scores,
    riskLevel: outcome.riskLevel,
    riskLabel: outcome.riskLabel,
    swot: buildFallbackSwot(outcome),
    recommendations: buildFallbackRecommendations(outcome),
    verdict: outcome.verdict,
    verdictLabel: outcome.verdictLabel,
    verdictReason: outcome.verdictReason,
    meta: {
      engine: 'local',
      engineLabel: "Moteur d'analyse local",
      engineNotice: '',
      llmProvider: null,
      llmModel: null,
      generatedAt: '2026-10-19T16:28:18.894Z',
      methodologyVersion: '1.0.0',
      confidence: outcome.confidence,
    },
    financial,
  };
}

function buildFinancial(overrides: Partial<FinancialInput> = {}): FinancialCheckRecord {
  const core = computeFinancialCheck({ ...financialInput, ...overrides });
  return {
    ...core,
    id: 'financial-test',
    analysisId: 'analysis-test',
    createdAt: '2026-10-19T16:28:18.894Z',
  };
}

const study = buildLocalStudy(buildRecord(stageConnect, buildFinancial()), {
  generatedAt: '2026-10-30T10:00:00.000Z',
});

const ENV_KEYS = ['LLM_PROVIDER', 'LLM_BASE_URL', 'LLM_MODEL', 'LLM_API_KEY', 'LLM_TIMEOUT_MS'] as const;
const savedEnv = new Map<string, string | undefined>();

function clearLlmEnv(): void {
  for (const key of ENV_KEYS) {
    savedEnv.set(key, process.env[key]);
    delete process.env[key];
  }
}

function configureLlm(): void {
  process.env.LLM_PROVIDER = 'test-provider';
  process.env.LLM_BASE_URL = 'https://llm.invalid/v1';
  process.env.LLM_MODEL = 'test-model';
  process.env.LLM_API_KEY = 'test-key';
  process.env.LLM_TIMEOUT_MS = '5000';
}

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    const value = savedEnv.get(key);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  savedEnv.clear();
}

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as typeof fetch;
}

function errorResponse(status: number) {
  return {
    ok: false,
    status,
    json: async () => ({}),
    text: async () => 'error',
  } as unknown as typeof fetch;
}

/** Reformulations valides : mêmes nombres, texte différent. */
function buildValidRewrites(): Record<string, string> {
  const rewrites: Record<string, string> = {};
  for (const field of buildStudyLlmFields(study)) {
    rewrites[field.id] = `Version reformulée : ${field.text}`;
  }
  return rewrites;
}

afterEach(() => {
  vi.unstubAllGlobals();
  restoreEnv();
});

describe('buildStudyLlmFields', () => {
  it('ne retient que des chemins résolvant vers un bloc de texte', () => {
    const fields = buildStudyLlmFields(study);
    expect(fields.length).toBeGreaterThan(15);

    for (const field of fields) {
      expect(field.id).toMatch(/^(sections\.\d+\.|risks\.\d+\.)/);
      expect(field.text.length).toBeGreaterThan(0);
    }

    expect(fields[0].id).toBe('sections.0.summary');
    expect(fields.some((field) => field.id === 'risks.5.mitigation')).toBe(true);
  });

  it("n'expose jamais la section Finance ni les indicateurs calculés", () => {
    const ids = buildStudyLlmFields(study).map((field) => field.id);
    expect(ids.some((id) => id.includes('pricing'))).toBe(false);
    expect(ids.some((id) => id.startsWith('sections.5.'))).toBe(false);
  });
});

describe('numericTokens', () => {
  it('normalise les séparateurs de milliers et les décimales françaises', () => {
    expect(numericTokens('150 000 DH et 12,5 %')).toEqual(['150000', '12.5']);
    expect(numericTokens("aucun chiffre ici")).toEqual([]);
  });
});

describe('validateStudyRewrites', () => {
  const field = {
    id: 'sections.0.summary',
    label: 'Résumé exécutif',
    text: 'Le projet StageConnect obtient un score global de 71/100 sur le marché.',
  };

  it('accepte une reformulation sans nouveau chiffre', () => {
    const result = validateStudyRewrites([field], {
      [field.id]:
        'StageConnect se distingue par un positionnement clair sur le marché des stages.',
    });
    expect(result.wholesaleRejected).toBe(false);
    expect(result.accepted[field.id]).toBeDefined();
  });

  it('conserve les chiffres déjà présents dans la source', () => {
    const result = validateStudyRewrites([field], {
      [field.id]: 'Sur le marché visé, StageConnect obtient un score global de 71/100.',
    });
    expect(result.wholesaleRejected).toBe(false);
    expect(result.accepted[field.id]).toBeDefined();
  });

  it('rejette le champ qui introduit un nombre nouveau', () => {
    const result = validateStudyRewrites([field], {
      [field.id]: 'StageConnect obtient un score global de 75/100 sur le marché.',
    });
    expect(result.wholesaleRejected).toBe(false);
    expect(result.accepted[field.id]).toBeUndefined();
    expect(result.rejected[0]).toEqual({ id: field.id, reason: 'new_numeric' });
  });

  it('rejette toute la réponse si un pourcentage nouveau apparaît', () => {
    const result = validateStudyRewrites([field], {
      [field.id]: 'StageConnect adresse 42 % du marché des stages au Maroc.',
    });
    expect(result.wholesaleRejected).toBe(true);
    expect(result.accepted).toEqual({});
  });

  it('rejette toute la réponse si un montant est introduit', () => {
    const result = validateStudyRewrites([field], {
      [field.id]: 'StageConnect prévoit un chiffre d’affaires de 200 000 DH dès la première année.',
    });
    expect(result.wholesaleRejected).toBe(true);
    expect(result.accepted).toEqual({});
  });

  it('rejette une unité monétaire nouvelle même sans chiffre', () => {
    const result = validateStudyRewrites([field], {
      [field.id]: 'StageConnect présente un modèle économique entièrement libellé en DH.',
    });
    expect(result.wholesaleRejected).toBe(true);
  });

  it('ignore les identifiants inconnus, les textes trop courts et les textes inchangés', () => {
    const result = validateStudyRewrites([field], {
      'sections.99.summary': 'Un texte qui ne correspond à aucun champ de l’étude.',
      [field.id]: field.text,
    });
    expect(result.accepted).toEqual({});
    expect(result.rejected.map((item) => item.reason)).toEqual(['unknown', 'unchanged']);
  });
});

describe('applyStudyRewrites', () => {
  it('marque les textes reformulés comme « ia » sans toucher aux scores', () => {
    const rewrites = {
      'sections.0.summary':
        'StageConnect se distingue par un positionnement clair sur le marché des stages.',
      'risks.0.mitigation':
        'Mettre en place un suivi mensuel des indicateurs commerciaux et financiers.',
    };

    const enriched = applyStudyRewrites(study, rewrites, 'test-provider', 'test-model');

    const presentation = getSection(enriched, 'presentation');
    expect(presentation?.summary.source).toBe('ia');
    expect(presentation?.summary.text).toContain('positionnement clair');
    expect(enriched.risks[0].mitigation.source).toBe('ia');

    expect(enriched.meta.engine).toBe('llm');
    expect(enriched.meta.llmProvider).toBe('test-provider');
    expect(enriched.meta.llmModel).toBe('test-model');
    expect(enriched.meta.dataSources.ia).toBe(2);
    expect(enriched.meta.warnings.some((warning) => warning.includes('modèle de langage'))).toBe(true);

    // Les données déterministes sont strictement inchangées.
    expect(enriched.feasibilityScore).toBe(study.feasibilityScore);
    expect(enriched.feasibilityStatus).toBe(study.feasibilityStatus);
    expect(enriched.completenessScore).toBe(study.completenessScore);
    expect(enriched.risks.map((risk) => risk.score)).toEqual(study.risks.map((risk) => risk.score));
    expect(getSection(enriched, 'finance')?.computed).toEqual(getSection(study, 'finance')?.computed);
  });

  it("retourne l'étude d'origine si aucune reformulation n'est applicable", () => {
    const enriched = applyStudyRewrites(study, { 'sections.99.summary': 'Texte inconnu.' }, 'p', 'm');
    expect(enriched).toBe(study);
  });
});

describe('enrichStudyWithLlm', () => {
  it('renvoie null sans configuration LLM', async () => {
    clearLlmEnv();
    await expect(enrichStudyWithLlm(study)).resolves.toBeNull();
  });

  it('renvoie null si le fournisseur répond en erreur', async () => {
    clearLlmEnv();
    configureLlm();
    vi.stubGlobal('fetch', vi.fn(async () => errorResponse(500)));

    await expect(enrichStudyWithLlm(study)).resolves.toBeNull();
  });

  it('accepte une réponse complète et valide', async () => {
    clearLlmEnv();
    configureLlm();
    const rewrites = buildValidRewrites();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ choices: [{ message: { content: JSON.stringify({ textes: rewrites }) } }] }),
      ),
    );

    const enrichment = await enrichStudyWithLlm(study);
    expect(enrichment).not.toBeNull();
    expect(enrichment?.provider).toBe('test-provider');
    expect(enrichment?.model).toBe('test-model');
    expect(Object.keys(enrichment?.rewrites ?? {}).length).toBe(buildStudyLlmFields(study).length);
  });

  it('renvoie null si la réponse contient un pourcentage inventé', async () => {
    clearLlmEnv();
    configureLlm();
    const rewrites = buildValidRewrites();
    rewrites['sections.0.summary'] = 'StageConnect adresse 42 % du marché marocain des stages.';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ choices: [{ message: { content: JSON.stringify({ textes: rewrites }) } }] }),
      ),
    );

    await expect(enrichStudyWithLlm(study)).resolves.toBeNull();
  });

  it('renvoie null si la réponse est trop incomplète', async () => {
    clearLlmEnv();
    configureLlm();
    const fields = buildStudyLlmFields(study);
    const rewrites: Record<string, string> = {};
    for (const field of fields.slice(0, 3)) {
      rewrites[field.id] = `Version reformulée : ${field.text}`;
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ choices: [{ message: { content: JSON.stringify({ textes: rewrites }) } }] }),
      ),
    );

    await expect(enrichStudyWithLlm(study)).resolves.toBeNull();
  });
});
