/**
 * Scenarios financiers - DETERMINISTES.
 *
 * Le scenario REALISTE correspond exactement aux hypotheses saisies.
 * Les scenarios PESSIMISTE et OPTIMISTE sont des variantes construites par
 * application de coefficients multiplicatifs FIXES et DOCUMENTES.
 *
 * IMPORTANT (pedagogie) : ces coefficients sont des HYPOTHESES DE SIMULATION
 * a visee pedagogique, et non des previsions universelles. Ils servent a
 * montrer la sensibilite du modele aux parametres cles.
 */

import { computeFinancials, sanitizeFinancialInput } from './formulas';
import { computeFinancialHealth } from './health';
import type {
  FinancialAssumptions,
  FinancialInput,
  FinancialScenario,
  ScenarioAssumption,
  ScenarioCoefficients,
  ScenarioKey,
} from './types';

export const SCENARIO_KEYS: ScenarioKey[] = ['pessimiste', 'realiste', 'optimiste'];

export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  pessimiste: 'Pessimiste',
  realiste: 'Réaliste (vos saisies)',
  optimiste: 'Optimiste',
};

export const SCENARIO_DESCRIPTIONS: Record<ScenarioKey, string> = {
  pessimiste:
    'Hypothèse prudente : montée en charge plus lente, pression concurrentielle sur les prix, coûts qui dérapent.',
  realiste: 'Correspond exactement aux hypothèses que vous avez saisies, sans aucun coefficient.',
  optimiste:
    "Hypothèse favorable : adoption rapide et économies d'échelle sur les coûts variables et les charges fixes.",
};

/**
 * Coefficients appliques aux hypotheses saisies.
 * 1 = valeur saisie inchangee.
 */
export const SCENARIO_COEFFICIENTS: Record<ScenarioKey, ScenarioCoefficients> = {
  pessimiste: { volume: 0.7, price: 0.9, variableCost: 1.08, fixedCosts: 1.1, investment: 1.0 },
  realiste: { volume: 1.0, price: 1.0, variableCost: 1.0, fixedCosts: 1.0, investment: 1.0 },
  optimiste: { volume: 1.25, price: 1.05, variableCost: 0.95, fixedCosts: 0.95, investment: 1.0 },
};

/** NOTES generales affichees a l'utilisateur (interface + README). */
export const SCENARIO_NOTES: string[] = [
  "Le scénario « Réaliste » correspond strictement à vos saisies : il ne contient aucune hypothèse ajoutée.",
  "Les scénarios « Pessimiste » et « Optimiste » sont des HYPOTHÈSES DE SIMULATION pédagogiques, appliquées par coefficients fixes. Ce ne sont PAS des prévisions universelles ni des recommandations.",
  "L'investissement initial n'est jamais modulé : c'est un engagement de départ, pas une variable d'exploitation.",
  "Les coefficients sont identiques pour tous les projets ; ils servent uniquement à mesurer la sensibilité de votre modèle aux ventes, aux prix et aux coûts.",
];

function formatSignedPercent(coefficient: number): string {
  const delta = (coefficient - 1) * 100;
  const rounded = Math.round(delta);
  if (rounded === 0) return 'inchangé';
  return `${rounded > 0 ? '+' : ''}${rounded} %`;
}

function buildAssumptions(coefficients: ScenarioCoefficients): ScenarioAssumption[] {
  return [
    { label: 'Ventes / clients', detail: formatSignedPercent(coefficients.volume) },
    { label: 'Prix de vente', detail: formatSignedPercent(coefficients.price) },
    { label: 'Coût variable', detail: formatSignedPercent(coefficients.variableCost) },
    { label: 'Charges fixes', detail: formatSignedPercent(coefficients.fixedCosts) },
    { label: 'Investissement initial', detail: 'non modulé' },
  ];
}

/**
 * Derive les hypotheses d'un scenario a partir de la saisie utilisateur.
 * Les valeurs derivees ne sont jamais negatives.
 */
export function deriveScenarioInput(
  input: FinancialInput,
  coefficients: ScenarioCoefficients,
): FinancialInput {
  const base = sanitizeFinancialInput(input);
  return {
    initialInvestment: base.initialInvestment * coefficients.investment,
    unitPrice: base.unitPrice * coefficients.price,
    monthlyUnits: base.monthlyUnits * coefficients.volume,
    fixedCostsMonthly: base.fixedCostsMonthly * coefficients.fixedCosts,
    variableCostPerUnit: base.variableCostPerUnit * coefficients.variableCost,
  };
}

export function buildScenario(key: ScenarioKey, input: FinancialInput): FinancialScenario {
  const coefficients = SCENARIO_COEFFICIENTS[key];
  const derivedInput = deriveScenarioInput(input, coefficients);
  const computed = computeFinancials(derivedInput);
  const health = computeFinancialHealth(derivedInput, computed);

  return {
    key,
    label: SCENARIO_LABELS[key],
    description: SCENARIO_DESCRIPTIONS[key],
    coefficients,
    assumptions: buildAssumptions(coefficients),
    input: derivedInput,
    computed,
    health,
  };
}

export function buildScenarios(input: FinancialInput): FinancialScenario[] {
  return SCENARIO_KEYS.map((key) => buildScenario(key, input));
}

export function buildAssumptionsBlock(): FinancialAssumptions {
  return {
    scenarioCoefficients: SCENARIO_COEFFICIENTS,
    notes: SCENARIO_NOTES,
  };
}
