/**
 * StartUpCheck AI - Orchestrateur du module "Financial Check".
 *
 * computeFinancialCheck() est DETERMINISTE et SYNCHRONE :
 *  - aucune dependance externe ;
 *  - aucun appel a un modele de langage ;
 *  - ne leve jamais d'exception pour des hypotheses incompletes : il renvoie
 *    des valeurs `null` et des avertissements explicites.
 *
 * Aucun chiffre n'est invente : les alertes signalent les saisies manquantes
 * ou incoherentes sans leur substituer de valeur.
 */

import { computeFinancials, sanitizeFinancialInput } from './formulas';
import { computeFinancialHealth } from './health';
import { buildAssumptionsBlock, buildScenarios } from './scenarios';
import type { FinancialCheckCore, FinancialComputed, FinancialInput } from './types';

export * from './types';
export { computeFinancials, sanitizeFinancialInput } from './formulas';
export { clampHealthScore, computeFinancialHealth, HEALTH_STATUS_LABELS } from './health';
export {
  SCENARIO_COEFFICIENTS,
  SCENARIO_KEYS,
  SCENARIO_LABELS,
  SCENARIO_NOTES,
  buildScenario,
  buildScenarios,
  deriveScenarioInput,
} from './scenarios';

export const FINANCIAL_METHODOLOGY_VERSION = '1.0.0';

export const FINANCIAL_ENGINE_NOTICE =
  "Chiffres calculés par le module financier déterministe de StartUpCheck AI. Aucune IA générative n'intervient dans les calculs : chaque valeur provient des formules ci-dessous, appliquées à vos hypothèses.";

export const FINANCIAL_DISCLAIMER =
  "Ces montants sont des PROJECTIONS calculées automatiquement à partir de vos hypothèses. Ils ne constituent pas un conseil financier, comptable, fiscal ou juridique, et ne garantissent aucun résultat. Les scénarios pessimiste et optimiste sont des hypothèses de simulation pédagogiques, et non des prévisions.";

/** Construit les avertissements a partir des hypotheses ET du resultat deja calcule. */
export function buildWarnings(input: FinancialInput, computed: FinancialComputed): string[] {
  const warnings: string[] = [];

  if (input.unitPrice <= 0) {
    warnings.push(
      "Prix de vente moyen à 0 : le chiffre d'affaires, la marge et le seuil de rentabilité ne peuvent pas être interprétés.",
    );
  }
  if (input.monthlyUnits <= 0) {
    warnings.push(
      'Nombre de ventes mensuelles à 0 : le chiffre d’affaires prévisionnel est nul. Ajustez ce volume pour obtenir une projection exploitable.',
    );
  }
  if (input.unitPrice > 0 && input.variableCostPerUnit >= input.unitPrice) {
    warnings.push(
      "Le coût variable par vente est supérieur ou égal au prix de vente : chaque vente réduit la marge. Aucun volume ne peut rendre l'activité rentable en l'état.",
    );
  }
  if (input.fixedCostsMonthly > 0 && computed.contributionMargin < input.fixedCostsMonthly && computed.contributionMargin >= 0) {
    warnings.push(
      'Les charges fixes dépassent la marge sur coûts variables au volume saisi : le résultat mensuel est en perte.',
    );
  }
  if (input.initialInvestment === 0) {
    warnings.push(
      "Aucun investissement initial saisi : le ROI annuel n'est pas applicable et le délai de récupération est sans objet.",
    );
  }
  if (computed.monthlyResult <= 0 && input.initialInvestment > 0) {
    warnings.push(
      "Le résultat mensuel est nul ou négatif : l'investissement initial n'est pas récupérable au niveau de ventes saisi (délai de récupération non atteint).",
    );
  }

  return warnings;
}

/**
 * Calcule l'analyse financiere complete : resultat du scenario realiste,
 * indicateur de sante et comparaison des trois scenarios.
 */
export function computeFinancialCheck(rawInput: FinancialInput): FinancialCheckCore {
  const input = sanitizeFinancialInput(rawInput);
  const computed = computeFinancials(input);
  const health = computeFinancialHealth(input, computed);
  const scenarios = buildScenarios(input);
  const warnings = buildWarnings(input, computed);

  return {
    currency: 'MAD',
    input,
    computed,
    health,
    scenarios,
    assumptions: buildAssumptionsBlock(),
    warnings,
    meta: {
      engine: 'financial-deterministic',
      engineLabel: 'Module financier déterministe',
      engineNotice: FINANCIAL_ENGINE_NOTICE,
      disclaimer: FINANCIAL_DISCLAIMER,
      methodologyVersion: FINANCIAL_METHODOLOGY_VERSION,
      generatedAt: new Date().toISOString(),
    },
  };
}
