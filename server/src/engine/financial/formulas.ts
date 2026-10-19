/**
 * Formules financieres - FONCTIONS PURES ET DETERMINISTES.
 *
 * Aucune dependance externe, aucun appel reseau, aucun LLM.
 * Toutes les divisions par zero sont explicitement gerees : la fonction
 * ne renvoie JAMAIS NaN ni Infinity (elle renvoie null lorsque la valeur
 * n'a pas de sens).
 */

import type { FinancialComputed, FinancialInput } from './types';

/** Force une valeur numerique finie et non negative. Garde-fou defensif. */
function safeAmount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value < 0 ? 0 : value;
}

/** Normalise les hypotheses : nombres finis et positifs ou nuls. */
export function sanitizeFinancialInput(input: FinancialInput): FinancialInput {
  return {
    initialInvestment: safeAmount(input.initialInvestment),
    unitPrice: safeAmount(input.unitPrice),
    monthlyUnits: safeAmount(input.monthlyUnits),
    fixedCostsMonthly: safeAmount(input.fixedCostsMonthly),
    variableCostPerUnit: safeAmount(input.variableCostPerUnit),
  };
}

/**
 * Calcule l'integralite des indicateurs financiers a partir des hypotheses.
 *
 * Formules appliquees :
 *   CA mensuel          = prix x ventes
 *   CA annuel           = CA mensuel x 12
 *   Couts variables     = cout variable x ventes
 *   Charges totales     = charges fixes + couts variables
 *   Marge sur CV (MCV)  = CA mensuel - couts variables
 *   Taux de MCV         = (prix - cout variable) / prix
 *   Resultat mensuel    = CA mensuel - charges totales
 *   Resultat annuel     = resultat mensuel x 12
 *   Seuil (CA)          = charges fixes / taux de MCV
 *   Seuil (nb ventes)   = charges fixes / (prix - cout variable)
 *   ROI annuel          = resultat annuel / investissement initial
 *   Payback (mois)      = investissement initial / resultat mensuel
 */
export function computeFinancials(rawInput: FinancialInput): FinancialComputed {
  const input = sanitizeFinancialInput(rawInput);
  const { initialInvestment, unitPrice, monthlyUnits, fixedCostsMonthly, variableCostPerUnit } =
    input;

  const monthlyRevenue = unitPrice * monthlyUnits;
  const annualRevenue = monthlyRevenue * 12;

  const monthlyVariableCosts = variableCostPerUnit * monthlyUnits;
  const annualVariableCosts = monthlyVariableCosts * 12;

  const monthlyTotalCosts = fixedCostsMonthly + monthlyVariableCosts;
  const annualTotalCosts = monthlyTotalCosts * 12;

  const contributionMargin = monthlyRevenue - monthlyVariableCosts;

  // Taux de marge sur couts variables : 0 si le prix de vente est nul.
  const contributionMarginRate = unitPrice > 0 ? (unitPrice - variableCostPerUnit) / unitPrice : 0;

  const unitMargin = unitPrice - variableCostPerUnit;

  const monthlyResult = monthlyRevenue - monthlyTotalCosts;
  const annualResult = monthlyResult * 12;

  const netMarginRate = annualRevenue > 0 ? annualResult / annualRevenue : null;

  // Seuil de rentabilite : atteignable seulement si chaque vente cree de la marge.
  const breakEvenReachable = unitPrice > 0 && unitMargin > 0 && contributionMarginRate > 0;
  const breakEvenRevenue = breakEvenReachable ? fixedCostsMonthly / contributionMarginRate : null;
  const breakEvenUnits = breakEvenReachable ? fixedCostsMonthly / unitMargin : null;

  // ROI : non applicable sans investissement initial.
  const roiAnnual = initialInvestment > 0 ? annualResult / initialInvestment : null;

  // Payback : 0 si aucun investissement a recuperer, null si jamais atteint.
  let paybackMonths: number | null;
  if (initialInvestment === 0) {
    paybackMonths = 0;
  } else if (monthlyResult > 0) {
    paybackMonths = initialInvestment / monthlyResult;
  } else {
    paybackMonths = null;
  }
  const paybackYears = paybackMonths === null ? null : paybackMonths / 12;

  const safetyMarginRate =
    monthlyRevenue > 0 && breakEvenRevenue !== null
      ? (monthlyRevenue - breakEvenRevenue) / monthlyRevenue
      : null;

  return {
    monthlyRevenue,
    annualRevenue,
    monthlyVariableCosts,
    annualVariableCosts,
    monthlyTotalCosts,
    annualTotalCosts,
    contributionMargin,
    contributionMarginRate,
    unitMargin,
    monthlyResult,
    annualResult,
    netMarginRate,
    breakEvenRevenue,
    breakEvenUnits,
    roiAnnual,
    paybackMonths,
    paybackYears,
    safetyMarginRate,
    isProfitable: monthlyResult > 0,
    breakEvenReachable,
  };
}
