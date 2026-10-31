/**
 * Tests du moteur "Étude de projet" (aucune API externe, aucune base requise).
 * Lancement : npm test
 */

import { describe, expect, it } from 'vitest';
import { buildFallbackRecommendations, buildFallbackSwot } from '../src/engine/fallback';
import { computeFinancialCheck } from '../src/engine/financial';
import type { FinancialCheckRecord, FinancialInput } from '../src/engine/financial/types';
import { scoreIdea } from '../src/engine/scoring';
import {
  FEASIBILITY_WEIGHTS,
  STUDY_STATUS_LABELS,
  applyStudyEdits,
  buildLocalStudy,
  computeCompletenessScore,
  computeFeasibility,
  getSection,
  resolveStatus,
} from '../src/engine/project-study';
import {
  projectStudyCreateSchema,
  projectStudyEditSchema,
  projectStudyListQuerySchema,
} from '../src/lib/validation';
import type { StudyCore, StudySource, StudyText } from '../src/engine/project-study';
import type { AnalysisInput, AnalysisRecord } from '../src/engine/types';

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

const FIXED_DATE = '2026-10-30T10:00:00.000Z';

/** Construit une analyse locale sans jamais appeler de LLM. */
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
    createdAt: '2026-10-19T16:30:00.000Z',
  };
}

function buildStudy(record: AnalysisRecord): StudyCore {
  return buildLocalStudy(record, { generatedAt: FIXED_DATE });
}

/**
 * Financial Check artificiel dont la sante est "non_rentable" alors que la
 * marge unitaire reste positive. Permet de tester le plafonnement metier
 * independamment de la regle "marge <= 0 -> A retravailler".
 */
function buildNonRentableFinancial(): FinancialCheckRecord {
  const base = buildFinancial();
  return {
    ...base,
    computed: { ...base.computed, unitMargin: 10 },
    health: { ...base.health, status: 'non_rentable', score: 20, label: 'Non rentable' },
  };
}

function collectTexts(study: StudyCore): StudyText[] {
  const texts: StudyText[] = [];

  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (typeof record.text === 'string' && typeof record.source === 'string') {
        texts.push(record as unknown as StudyText);
      }
      Object.entries(record).forEach(([key, item]) => {
        if (key !== 'text' && key !== 'source' && key !== 'note') {
          walk(item);
        }
      });
    }
  };

  walk({ sections: study.sections, risks: study.risks, roadmap: study.roadmap });
  return texts;
}

const VALID_SOURCES: StudySource[] = ['saisie', 'calcule', 'hypothese', 'ia'];

// ---------------------------------------------------------------------------

describe('structure de l’étude', () => {
  it('produit les 9 sections dans l’ordre attendu', () => {
    const study = buildStudy(buildRecord(stageConnect));
    expect(study.sections.map((section) => section.key)).toEqual([
      'presentation',
      'marche',
      'commercial',
      'technique',
      'organisation',
      'finance',
      'risques',
      'plan_action',
      'conclusion',
    ]);
  });

  it('reprend le nom, la cible et la note de l’analyse existante', () => {
    const record = buildRecord(stageConnect);
    const study = buildStudy(record);
    const presentation = getSection(study, 'presentation');

    expect(study.projectName).toBe(record.projectName);
    expect(presentation?.projectName.text).toBe(record.projectName);
    expect(presentation?.targetClients.text).toContain('Étudiants');
    expect(presentation?.summary.text).toContain(`${record.globalScore}/100`);
  });

  it('produit 6 risques couvrant les 6 catégories', () => {
    const study = buildStudy(buildRecord(stageConnect));
    expect(study.risks).toHaveLength(6);
    expect(study.risks.map((risk) => risk.category).sort()).toEqual([
      'commercial',
      'financier',
      'juridique',
      'operationnel',
      'rh',
      'technique',
    ]);
  });

  it('produit une feuille de route sur 5 horizons', () => {
    const study = buildStudy(buildRecord(stageConnect));
    expect(study.roadmap.map((step) => step.key)).toEqual([
      'j0_30',
      'j30_60',
      'j60_90',
      'm3_6',
      'm6_12',
    ]);
    for (const step of study.roadmap) {
      expect(step.period.length).toBeGreaterThan(0);
      expect(step.objectives.length).toBeGreaterThan(0);
      expect(step.actions.length).toBeGreaterThan(0);
      expect(step.indicators.length).toBeGreaterThan(0);
    }
  });

  it('produit une conclusion cohérente avec le statut', () => {
    const study = buildStudy(buildRecord(stageConnect));
    const conclusion = getSection(study, 'conclusion');

    expect(conclusion?.status).toBe(study.feasibilityStatus);
    expect(conclusion?.statusLabel).toBe(STUDY_STATUS_LABELS[study.feasibilityStatus]);
    expect(conclusion?.score).toBe(study.feasibilityScore);
    expect(conclusion?.recommendation.source).toBe('calcule');
  });

  it('est déterministe : deux générations identiques produisent le même résultat', () => {
    const record = buildRecord(stageConnect, buildFinancial());
    expect(buildStudy(record)).toEqual(buildStudy(record));
  });
});

// ---------------------------------------------------------------------------

describe('score de faisabilité', () => {
  it('applique les poids 50 / 30 / 20 quand toutes les composantes existent', () => {
    const record = buildRecord(stageConnect, buildFinancial());
    const study = buildStudy(record);
    const components = study.meta.feasibility.components;

    expect(FEASIBILITY_WEIGHTS).toEqual({ viability: 0.5, finance: 0.3, completeness: 0.2 });
    expect(components.find((component) => component.key === 'finance')?.available).toBe(true);

    const expected = Math.round(
      record.globalScore * 0.5 +
        record.financial!.health.score * 0.3 +
        study.completenessScore * 0.2,
    );
    expect(study.feasibilityScore).toBe(expected);
  });

  it('omet la finance et renormalise les poids en l’absence de Financial Check', () => {
    const record = buildRecord(stageConnect);
    const study = buildStudy(record);
    const components = study.meta.feasibility.components;

    expect(components.find((component) => component.key === 'finance')?.available).toBe(false);

    const expected = Math.round(
      (record.globalScore * 0.5 + study.completenessScore * 0.2) / 0.7,
    );
    expect(study.feasibilityScore).toBe(expected);
    expect(study.meta.feasibility.formula).toContain('poids renormalisés');
  });

  it('borne le score entre 0 et 100', () => {
    const study = buildStudy(buildRecord(stageConnect));
    expect(study.feasibilityScore).toBeGreaterThanOrEqual(0);
    expect(study.feasibilityScore).toBeLessThanOrEqual(100);
  });

  it('calcule la complétude : 70 % confiance + 30 % présence du Financial Check', () => {
    const withoutFinancial = buildRecord(stageConnect);
    const withFinancial = buildRecord(stageConnect, buildFinancial());

    const expectedWithout = Math.round(0.7 * withoutFinancial.meta.confidence * 100);
    const expectedWith = Math.round(0.7 * withFinancial.meta.confidence * 100 + 0.3 * 100);

    expect(computeCompletenessScore(withoutFinancial, null)).toBe(expectedWithout);
    expect(computeCompletenessScore(withFinancial, withFinancial.financial)).toBe(expectedWith);
  });

  it('plafonne à « À retravailler » si la marge unitaire est nulle ou négative', () => {
    const record = buildRecord(stageConnect);
    const financial = buildFinancial({ unitPrice: 40, variableCostPerUnit: 50 });
    expect(financial.computed.unitMargin).toBeLessThanOrEqual(0);

    const result = computeFeasibility({ ...record, financial }, financial, 100);
    expect(result.status).toBe('a_retravailler');
    expect(result.statusLabel).toBe('À retravailler');
  });

  it('plafonne au mieux à « Viable sous conditions » si la santé est non rentable', () => {
    const financial = buildNonRentableFinancial();
    const analysis = {
      verdict: 'developper',
      globalScore: 90,
      financial,
    } as unknown as AnalysisRecord;

    expect(resolveStatus(90, analysis, financial)).toBe('viable_sous_conditions');
  });

  it('plafonne au mieux à « Viable sous conditions » si le verdict est « risque »', () => {
    const analysis = {
      verdict: 'risque',
      globalScore: 90,
      financial: null,
    } as unknown as AnalysisRecord;

    expect(resolveStatus(90, analysis, null)).toBe('viable_sous_conditions');
  });

  it('exige un verdict « développer » pour le statut « Projet viable »', () => {
    const develop = { verdict: 'developper' } as unknown as AnalysisRecord;
    const improve = { verdict: 'ameliorer' } as unknown as AnalysisRecord;

    expect(resolveStatus(80, develop, null)).toBe('viable');
    expect(resolveStatus(80, improve, null)).toBe('viable_sous_conditions');
    expect(resolveStatus(44, develop, null)).toBe('a_retravailler');
  });
});

// ---------------------------------------------------------------------------

describe('section Finance', () => {
  it('copie les chiffres du Financial Check sans les recalculer', () => {
    const financial = buildFinancial();
    const study = buildStudy(buildRecord(stageConnect, financial));
    const finance = getSection(study, 'finance');

    expect(finance?.available).toBe(true);
    expect(finance?.financialCheckId).toBe(financial.id);
    expect(finance?.capturedAt).toBe(financial.createdAt);
    expect(finance?.input).toEqual(financial.input);
    expect(finance?.computed).toEqual(financial.computed);
    expect(finance?.health).toEqual(financial.health);
    expect(finance?.scenarios).toEqual(financial.scenarios);
  });

  it('affiche un message explicite et aucun chiffre sans Financial Check', () => {
    const study = buildStudy(buildRecord(stageConnect));
    const finance = getSection(study, 'finance');

    expect(finance?.available).toBe(false);
    expect(finance?.computed).toBeNull();
    expect(finance?.health).toBeNull();
    expect(finance?.missingNotice?.text).toContain('Financial Check');
    expect(finance?.missingNotice?.note).toContain('Aucune projection financière');
  });

  it('ajoute un avertissement quand la finance manque', () => {
    const study = buildStudy(buildRecord(stageConnect));
    expect(study.meta.warnings.some((warning) => warning.includes('Aucun Financial Check'))).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------------

describe('matrice des risques', () => {
  it('calcule le niveau comme probabilité × impact', () => {
    const study = buildStudy(buildRecord(stageConnect, buildFinancial()));
    for (const risk of study.risks) {
      expect(risk.score).toBe(risk.probability * risk.impact);
      expect(risk.probability).toBeGreaterThanOrEqual(1);
      expect(risk.probability).toBeLessThanOrEqual(4);
      expect(risk.impact).toBeGreaterThanOrEqual(1);
      expect(risk.impact).toBeLessThanOrEqual(4);
    }
  });

  it('applique les seuils : 1-4 faible, 5-8 modéré, 9-12 élevé, 13-16 critique', () => {
    const study = buildStudy(buildRecord(stageConnect, buildFinancial()));
    for (const risk of study.risks) {
      const expected =
        risk.score >= 13
          ? 'critique'
          : risk.score >= 9
            ? 'eleve'
            : risk.score >= 5
              ? 'modere'
              : 'faible';
      expect(risk.level).toBe(expected);
    }
  });

  it('marque les probabilités et impacts comme hypothèses', () => {
    const study = buildStudy(buildRecord(stageConnect));
    const section = getSection(study, 'risques');
    expect(section?.intro.source).toBe('hypothese');
    for (const risk of study.risks) {
      expect(risk.description.source).toBe('calcule');
      expect(risk.mitigation.source).toBe('hypothese');
    }
  });

  it('renforce le risque financier quand la santé est non rentable', () => {
    const healthy = buildStudy(buildRecord(stageConnect, buildFinancial()));
    const unprofitable = buildStudy(buildRecord(stageConnect, buildNonRentableFinancial()));

    const healthyRisk = healthy.risks.find((risk) => risk.category === 'financier');
    const unprofitableRisk = unprofitable.risks.find((risk) => risk.category === 'financier');

    expect(unprofitableRisk!.probability).toBe(4);
    expect(unprofitableRisk!.score).toBeGreaterThan(healthyRisk!.score);
  });
});

// ---------------------------------------------------------------------------

describe('transparence des sources', () => {
  it('attribue une source valide à chaque bloc de texte', () => {
    const study = buildStudy(buildRecord(stageConnect, buildFinancial()));
    const texts = collectTexts(study);
    expect(texts.length).toBeGreaterThan(30);
    for (const text of texts) {
      expect(VALID_SOURCES).toContain(text.source);
      expect(text.text.length).toBeGreaterThan(0);
    }
  });

  it('ne produit aucun contenu « ia » avec le moteur local', () => {
    const study = buildStudy(buildRecord(stageConnect, buildFinancial()));
    expect(study.meta.engine).toBe('local');
    expect(study.meta.dataSources.ia).toBe(0);
    expect(study.meta.engineNotice).toContain('sans appel à un modèle de langage');
  });

  it('compte les blocs par source dans les métadonnées', () => {
    const study = buildStudy(buildRecord(stageConnect, buildFinancial()));
    const texts = collectTexts(study);
    for (const source of VALID_SOURCES) {
      expect(study.meta.dataSources[source]).toBe(
        texts.filter((text) => text.source === source).length,
      );
    }
  });

  it('ne présente aucune donnée de marché chiffrée comme réelle', () => {
    const study = buildStudy(buildRecord(stageConnect));
    const market = getSection(study, 'marche');
    expect(market?.notice.text).toContain('Aucune taille de marché chiffrée');
    expect(market?.overview.source).toBe('hypothese');
    expect(market?.overview.note).toContain('heuristique');
  });
});

// ---------------------------------------------------------------------------

describe('édition manuelle des textes', () => {
  function editable(study: StudyCore) {
    return {
      sections: study.sections,
      risks: study.risks,
      roadmap: study.roadmap,
      meta: study.meta,
    };
  }

  it('modifie un bloc de texte et le requalifie en « saisie »', () => {
    const study = buildStudy(buildRecord(stageConnect));
    const result = applyStudyEdits(editable(study), [
      { path: 'sections.0.summary', text: 'Résumé personnalisé par le porteur de projet.' },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const summary = result.value.sections[0] as { summary: StudyText };
    expect(summary.summary.text).toBe('Résumé personnalisé par le porteur de projet.');
    expect(summary.summary.source).toBe('saisie');
    expect(summary.summary.note).toContain('modifié manuellement');
  });

  it('modifie un risque et une action de la feuille de route', () => {
    const study = buildStudy(buildRecord(stageConnect));
    const result = applyStudyEdits(editable(study), [
      { path: 'risks.0.mitigation', text: 'Plan de mitigation validé avec un expert-comptable.' },
      { path: 'roadmap.1.actions.0.text', text: 'Action prioritaire revue par le porteur de projet.' },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.risks[0].mitigation.text).toContain('expert-comptable');
    expect(result.value.roadmap[1].actions[0].text.text).toContain('porteur de projet');
  });

  it('applique les modifications en tout ou rien', () => {
    const study = buildStudy(buildRecord(stageConnect));
    const result = applyStudyEdits(editable(study), [
      { path: 'sections.0.summary', text: 'Première modification.' },
      { path: 'sections.0.inexistant', text: 'Chemin invalide.' },
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.path).toBe('sections.0.inexistant');
  });

  it('refuse de modifier un chiffre financier', () => {
    const study = buildStudy(buildRecord(stageConnect, buildFinancial()));
    const result = applyStudyEdits(editable(study), [
      { path: 'sections.5.computed.monthlyRevenue', text: '999999' },
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.path).toContain('monthlyRevenue');
  });

  it('refuse les chemins de prototype', () => {
    const study = buildStudy(buildRecord(stageConnect));
    const result = applyStudyEdits(editable(study), [
      { path: 'sections.__proto__.summary', text: 'Injection.' },
    ]);

    expect(result.ok).toBe(false);
  });

  it('recalcule les sources et horodate la modification', () => {
    const study = buildStudy(buildRecord(stageConnect, buildFinancial()));
    const before = study.meta.dataSources.saisie;
    const result = applyStudyEdits(editable(study), [
      { path: 'sections.0.summary', text: 'Résumé personnalisé.' },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.meta.dataSources.saisie).toBe(before + 1);
    expect(result.value.meta.lastEditedAt).not.toBeNull();
    expect(result.value.meta.warnings.some((w) => w.includes('modifiés manuellement'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------

describe('validation de l’API Étude de projet', () => {
  it('accepte une demande de génération valide', () => {
    expect(projectStudyCreateSchema.safeParse({ analysisId: 'abc123' }).success).toBe(true);
  });

  it('rejette un corps vide ou une clé inconnue', () => {
    expect(projectStudyCreateSchema.safeParse({}).success).toBe(false);
    expect(
      projectStudyCreateSchema.safeParse({ analysisId: 'abc123', extra: true }).success,
    ).toBe(false);
  });

  it('rejette une liste de modifications vide ou un texte vide', () => {
    expect(projectStudyEditSchema.safeParse({ edits: [] }).success).toBe(false);
    expect(
      projectStudyEditSchema.safeParse({ edits: [{ path: 'sections.0.summary', text: '   ' }] })
        .success,
    ).toBe(false);
  });

  it('rejette un paramètre de requête inconnu', () => {
    expect(projectStudyListQuerySchema.safeParse({ analysisId: 'abc' }).success).toBe(true);
    expect(projectStudyListQuerySchema.safeParse({ analysis: 'abc' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe('régression du moteur existant', () => {
  it('ne modifie pas l’analyse fournie en entrée', () => {
    const record = buildRecord(stageConnect, buildFinancial());
    const before = JSON.stringify(record);
    buildStudy(record);
    expect(JSON.stringify(record)).toBe(before);
  });

  it('reste compatible avec une analyse sans Financial Check', () => {
    const study = buildStudy(buildRecord(stageConnect));
    expect(study.meta.warnings.length).toBeGreaterThan(0);
    expect(study.feasibilityScore).toBeGreaterThan(0);
  });
});
