/**
 * Tests du module "Financial Check" (aucune API externe, aucune base requise).
 * Lancement : npm test
 */

import { describe, expect, it } from 'vitest';
import {
  clampHealthScore,
  computeFinancialCheck,
  computeFinancialHealth,
  computeFinancials,
  sanitizeFinancialInput,
} from '../src/engine/financial';
import {
  SCENARIO_COEFFICIENTS,
  buildScenarios,
} from '../src/engine/financial/scenarios';
import type { FinancialInput } from '../src/engine/financial/types';
import {
  financialCheckInputSchema,
  financialInputSchema,
  financialListQuerySchema,
} from '../src/lib/validation';

/** Hypotheses de reference, rentables et coherentes. */
const base: FinancialInput = {
  initialInvestment: 100000,
  unitPrice: 200,
  monthlyUnits: 100,
  fixedCostsMonthly: 5000,
  variableCostPerUnit: 50,
};

describe('formules financières', () => {
  it('calcule le chiffre d’affaires mensuel et annuel', () => {
    const c = computeFinancials(base);
    expect(c.monthlyRevenue).toBe(20000); // 200 x 100
    expect(c.annualRevenue).toBe(240000);
  });

  it('calcule la marge sur coûts variables et son taux', () => {
    const c = computeFinancials(base);
    expect(c.monthlyVariableCosts).toBe(5000); // 50 x 100
    expect(c.contributionMargin).toBe(15000); // 20000 - 5000
    expect(c.contributionMarginRate).toBeCloseTo(0.75, 6); // (200-50)/200
    expect(c.unitMargin).toBe(150);
  });

  it('calcule les charges totales et le résultat mensuel / annuel', () => {
    const c = computeFinancials(base);
    expect(c.monthlyTotalCosts).toBe(10000); // 5000 fixes + 5000 variables
    expect(c.monthlyResult).toBe(10000); // 20000 - 10000
    expect(c.annualResult).toBe(120000);
    expect(c.isProfitable).toBe(true);
  });

  it('calcule le seuil de rentabilité en CA et en nombre de ventes', () => {
    const c = computeFinancials(base);
    expect(c.breakEvenReachable).toBe(true);
    expect(c.breakEvenRevenue).toBeCloseTo(5000 / 0.75, 6); // 6666.66…
    expect(c.breakEvenUnits).toBeCloseTo(5000 / 150, 6); // 33.33…
  });

  it('calcule le ROI annuel et le délai de récupération', () => {
    const c = computeFinancials(base);
    expect(c.roiAnnual).toBeCloseTo(1.2, 6); // 120000 / 100000
    expect(c.paybackMonths).toBeCloseTo(10, 6); // 100000 / 10000
    expect(c.paybackYears).toBeCloseTo(10 / 12, 6);
  });

  it('conserve un résultat négatif (perte) sans le masquer', () => {
    const c = computeFinancials({ ...base, fixedCostsMonthly: 30000 });
    expect(c.monthlyResult).toBeLessThan(0);
    expect(c.annualResult).toBe(c.monthlyResult * 12);
    expect(c.isProfitable).toBe(false);
  });

  it('calcule la marge nette et la marge de sécurité', () => {
    const c = computeFinancials(base);
    expect(c.netMarginRate).toBeCloseTo(120000 / 240000, 6);
    expect(c.safetyMarginRate).toBeCloseTo((20000 - 5000 / 0.75) / 20000, 6);
  });
});

describe('cas limites financiers', () => {
  it('ne renvoie jamais NaN ni Infinity quand le prix est nul', () => {
    const c = computeFinancials({ ...base, unitPrice: 0 });
    for (const value of Object.values(c)) {
      if (typeof value === 'number') {
        expect(Number.isFinite(value)).toBe(true);
        expect(Number.isNaN(value)).toBe(false);
      }
    }
    expect(c.contributionMarginRate).toBe(0);
    expect(c.netMarginRate).toBeNull();
    expect(c.breakEvenReachable).toBe(false);
    expect(c.breakEvenRevenue).toBeNull();
    expect(c.breakEvenUnits).toBeNull();
  });

  it('gère un volume de ventes nul sans division par zéro', () => {
    const c = computeFinancials({ ...base, monthlyUnits: 0 });
    expect(c.monthlyRevenue).toBe(0);
    expect(c.annualRevenue).toBe(0);
    expect(c.monthlyResult).toBe(-5000); // uniquement les charges fixes
    expect(c.breakEvenReachable).toBe(true); // le seuil dépend du prix, pas du volume
    expect(c.breakEvenUnits).toBeCloseTo(5000 / 150, 6);
    expect(Number.isFinite(c.breakEvenUnits as number)).toBe(true);
  });

  it('détecte une structure non rentable quand le coût variable dépasse le prix', () => {
    const c = computeFinancials({ ...base, variableCostPerUnit: 250 });
    expect(c.unitMargin).toBeLessThanOrEqual(0);
    expect(c.breakEvenReachable).toBe(false);
    expect(c.breakEvenRevenue).toBeNull();
    expect(c.breakEvenUnits).toBeNull();

    const health = computeFinancialHealth({ ...base, variableCostPerUnit: 250 }, c);
    expect(health.status).toBe('non_rentable');
  });

  it('traite des charges fixes nulles (seuil de rentabilité à 0)', () => {
    const c = computeFinancials({ ...base, fixedCostsMonthly: 0 });
    expect(c.breakEvenRevenue).toBe(0);
    expect(c.breakEvenUnits).toBe(0);
    expect(c.breakEvenReachable).toBe(true);
  });

  it('rend le ROI non applicable et le payback nul sans investissement initial', () => {
    const c = computeFinancials({ ...base, initialInvestment: 0 });
    expect(c.roiAnnual).toBeNull();
    expect(c.paybackMonths).toBe(0);
    expect(c.paybackYears).toBe(0);
  });

  it('marque le payback comme non atteint si le résultat est négatif', () => {
    const c = computeFinancials({ ...base, fixedCostsMonthly: 50000 });
    expect(c.monthlyResult).toBeLessThan(0);
    expect(c.paybackMonths).toBeNull();
    expect(c.paybackYears).toBeNull();
  });

  it('neutralise les valeurs négatives ou non finies via sanitize', () => {
    const cleaned = sanitizeFinancialInput({
      initialInvestment: -10,
      unitPrice: Number.NaN,
      monthlyUnits: -3,
      fixedCostsMonthly: Number.POSITIVE_INFINITY,
      variableCostPerUnit: 5,
    });
    expect(cleaned).toEqual({
      initialInvestment: 0,
      unitPrice: 0,
      monthlyUnits: 0,
      fixedCostsMonthly: 0,
      variableCostPerUnit: 5,
    });
  });
});

describe('scénarios financiers', () => {
  it('le scénario réaliste correspond exactement aux saisies', () => {
    const scenarios = buildScenarios(base);
    const realiste = scenarios.find((s) => s.key === 'realiste')!;
    expect(realiste.input).toEqual(base);
    expect(realiste.computed).toEqual(computeFinancials(base));
  });

  it('applique exactement les coefficients documentés', () => {
    const scenarios = buildScenarios(base);
    const pess = scenarios.find((s) => s.key === 'pessimiste')!;
    const opt = scenarios.find((s) => s.key === 'optimiste')!;

    expect(pess.input.monthlyUnits).toBeCloseTo(base.monthlyUnits * 0.7, 6);
    expect(pess.input.unitPrice).toBeCloseTo(base.unitPrice * 0.9, 6);
    expect(pess.input.variableCostPerUnit).toBeCloseTo(base.variableCostPerUnit * 1.08, 6);
    expect(pess.input.fixedCostsMonthly).toBeCloseTo(base.fixedCostsMonthly * 1.1, 6);

    expect(opt.input.monthlyUnits).toBeCloseTo(base.monthlyUnits * 1.25, 6);
    expect(opt.input.unitPrice).toBeCloseTo(base.unitPrice * 1.05, 6);
    expect(opt.input.variableCostPerUnit).toBeCloseTo(base.variableCostPerUnit * 0.95, 6);
    expect(opt.input.fixedCostsMonthly).toBeCloseTo(base.fixedCostsMonthly * 0.95, 6);
  });

  it('conserve l’investissement initial identique dans tous les scénarios', () => {
    const scenarios = buildScenarios(base);
    for (const s of scenarios) {
      expect(s.input.initialInvestment).toBe(base.initialInvestment);
    }
  });

  it('ordonne les résultats : pessimiste ≤ réaliste ≤ optimiste', () => {
    const scenarios = buildScenarios(base);
    const pess = scenarios.find((s) => s.key === 'pessimiste')!.computed.annualResult;
    const real = scenarios.find((s) => s.key === 'realiste')!.computed.annualResult;
    const opt = scenarios.find((s) => s.key === 'optimiste')!.computed.annualResult;
    expect(pess).toBeLessThanOrEqual(real);
    expect(real).toBeLessThanOrEqual(opt);
  });

  it('expose des hypothèses documentées et un avertissement pédagogique', () => {
    const check = computeFinancialCheck(base);
    expect(check.assumptions.scenarioCoefficients).toEqual(SCENARIO_COEFFICIENTS);
    const joined = check.assumptions.notes.join(' ');
    expect(joined.toLowerCase()).toContain('pédagogique');
    expect(joined.toLowerCase()).toContain('pas des prévisions');
  });
});

describe('indicateur de santé financière', () => {
  it('borne toujours le score entre 0 et 100', () => {
    const grid: FinancialInput[] = [];
    const investments = [0, 1000, 100000];
    const prices = [0, 1, 100, 500];
    const units = [0, 1, 50, 1000];
    const fixed = [0, 500, 20000];
    const variable = [0, 50, 400];

    for (const initialInvestment of investments)
      for (const unitPrice of prices)
        for (const monthlyUnits of units)
          for (const fixedCostsMonthly of fixed)
            for (const variableCostPerUnit of variable)
              grid.push({
                initialInvestment,
                unitPrice,
                monthlyUnits,
                fixedCostsMonthly,
                variableCostPerUnit,
              });

    for (const input of grid) {
      const health = computeFinancialHealth(input, computeFinancials(input));
      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(health.score)).toBe(true);
    }
    expect(grid.length).toBeGreaterThan(300);
  });

  it('clampe explicitement les scores hors bornes', () => {
    expect(clampHealthScore(-999)).toBe(0);
    expect(clampHealthScore(-1)).toBe(0);
    expect(clampHealthScore(0)).toBe(0);
    expect(clampHealthScore(100)).toBe(100);
    expect(clampHealthScore(1000)).toBe(100);
  });

  it('attribue les statuts attendus sur des profils types', () => {
    // Profitable, marge élevée, seuil dépassé, payback rapide → solide
    const solide = computeFinancialHealth(base, computeFinancials(base));
    expect(solide.status).toBe('solide');

    // Marge unitaire nulle → non rentable
    const nonRentable = computeFinancialHealth(
      { ...base, variableCostPerUnit: 200 },
      computeFinancials({ ...base, variableCostPerUnit: 200 }),
    );
    expect(nonRentable.status).toBe('non_rentable');

    // Résultat négatif → risque
    const risque = computeFinancialHealth(
      { ...base, fixedCostsMonthly: 40000 },
      computeFinancials({ ...base, fixedCostsMonthly: 40000 }),
    );
    expect(['risque', 'fragile']).toContain(risque.status);
  });

  it('détaille chaque facteur du score (transparence)', () => {
    const health = computeFinancialHealth(base, computeFinancials(base));
    expect(health.factors.length).toBeGreaterThan(0);
    expect(health.factors.every((f) => typeof f.label === 'string')).toBe(true);
  });
});

describe('orchestrateur computeFinancialCheck', () => {
  it('renvoie un résultat déclaré déterministe et sans IA générative', () => {
    const check = computeFinancialCheck(base);
    expect(check.meta.engine).toBe('financial-deterministic');
    expect(check.meta.engineNotice.toLowerCase()).toContain('aucune ia générative');
    expect(check.meta.disclaimer.toLowerCase()).toContain('projection');
  });

  it('est déterministe : deux appels donnent le même résultat', () => {
    const a = computeFinancialCheck(base);
    const b = computeFinancialCheck(base);
    expect(a.computed).toEqual(b.computed);
    expect(a.health).toEqual(b.health);
  });

  it('produit trois scénarios', () => {
    const check = computeFinancialCheck(base);
    expect(check.scenarios.map((s) => s.key)).toEqual(['pessimiste', 'realiste', 'optimiste']);
  });

  it('avertit sans inventer de chiffre quand des hypothèses manquent', () => {
    const check = computeFinancialCheck({ ...base, unitPrice: 0, initialInvestment: 0 });
    expect(check.warnings.length).toBeGreaterThan(0);
    const joined = check.warnings.join(' ').toLowerCase();
    expect(joined).toContain('prix de vente moyen à 0');
    expect(joined).toContain("aucun investissement initial");
  });

  it('le calcul de prévisualisation ne persiste rien (fonction pure)', () => {
    const preview = computeFinancialCheck(base);
    expect(preview.computed.monthlyResult).toBe(10000);
    expect(preview).not.toHaveProperty('id');
  });
});

/**
 * Validation des entrées (Zod) : garde-fous contre les fautes de frappe.
 * Ces schémas sont volontairement « stricts » : une clé inconnue doit être
 * rejetée, jamais ignorée silencieusement (sinon on créerait un enregistrement
 * incomplet ou orphelin au lieu de renvoyer une erreur explicite).
 */
describe('validation des hypothèses financières', () => {
  const valid = { ...base };

  it('accepte les 5 hypothèses valides', () => {
    expect(financialInputSchema.safeParse(valid).success).toBe(true);
  });

  it('rejette une valeur négative', () => {
    expect(financialInputSchema.safeParse({ ...valid, unitPrice: -1 }).success).toBe(false);
  });

  it("rejette un montant au-delà de la borne maximale", () => {
    expect(financialInputSchema.safeParse({ ...valid, initialInvestment: 1e13 }).success).toBe(false);
  });

  it('rejette une clé inconnue (faute de frappe) au lieu de l’ignorer', () => {
    expect(financialInputSchema.safeParse({ ...valid, unitPricee: 500 }).success).toBe(false);
  });

  it('le schéma complet rejette une faute de frappe sur analysisId', () => {
    expect(financialCheckInputSchema.safeParse({ ...valid, analysisIDs: 'abc' }).success).toBe(false);
  });

  it('le schéma complet accepte un analysisId correct', () => {
    expect(financialCheckInputSchema.safeParse({ ...valid, analysisId: 'abc' }).success).toBe(true);
  });

  it('la liste rejette un nom de filtre inconnu (?analysis=…)', () => {
    expect(financialListQuerySchema.safeParse({ analysis: 'abc' }).success).toBe(false);
  });

  it('la liste rejette un limit hors bornes et applique la valeur par défaut', () => {
    expect(financialListQuerySchema.safeParse({ limit: '9999' }).success).toBe(false);
    const parsed = financialListQuerySchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.limit).toBe(30);
  });
});
