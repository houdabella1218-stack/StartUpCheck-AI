/**
 * Indicateur de sante financiere - DETERMINISTE (regles explicites, aucun LLM).
 *
 * Le score brut est construit par addition de facteurs documentes, puis il est
 * STRICTEMENT borne entre 0 et 100 :
 *     healthScore = Math.max(0, Math.min(100, rawScore))
 *
 * Chaque facteur est conserve pour etre affiche a l'utilisateur (transparence).
 */

import type {
  FinancialComputed,
  FinancialHealth,
  FinancialHealthFactor,
  FinancialHealthStatus,
  FinancialInput,
} from './types';

export const HEALTH_STATUS_LABELS: Record<FinancialHealthStatus, string> = {
  solide: 'Solide',
  fragile: 'Fragile',
  risque: 'À risque',
  non_rentable: 'Non rentable',
};

const HEALTH_STATUS_SUMMARIES: Record<FinancialHealthStatus, string> = {
  solide:
    "L'activité dégage un résultat positif, avec une marge suffisante et un seuil de rentabilité dépassé. Les fondamentaux économiques sont favorables.",
  fragile:
    "L'activité peut être rentable, mais la marge ou la vitesse de récupération de l'investissement reste limitée. À consolider avant de passer à l'échelle.",
  risque:
    "Les indicateurs économiques sont défavorables à ce niveau d'hypothèses : perte probable, marge trop faible ou investissement difficilement récupéré.",
  non_rentable:
    "La marge unitaire est nulle ou négative : chaque vente ne couvre pas son coût variable. Aucun niveau de ventes ne rend l'activité rentable en l'état.",
};

/** Bornage explicite et obligatoire du score de sante. */
export function clampHealthScore(rawScore: number): number {
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

export function computeFinancialHealth(
  input: FinancialInput,
  computed: FinancialComputed,
): FinancialHealth {
  const factors: FinancialHealthFactor[] = [];

  const add = (label: string, impact: number) => {
    if (impact !== 0) factors.push({ label, impact });
  };

  let rawScore = 50;
  factors.push({ label: 'Base de calcul', impact: 50 });

  // 1. Rentabilite du resultat mensuel
  if (computed.monthlyResult > 0) {
    rawScore += 25;
    add('Résultat mensuel positif', 25);
  } else {
    rawScore -= 20;
    add('Résultat mensuel nul ou négatif', -20);
  }

  // 2. Niveau de marge sur couts variables
  if (computed.contributionMarginRate >= 0.3) {
    rawScore += 15;
    add('Taux de marge confortable (≥ 30 %)', 15);
  } else if (computed.contributionMarginRate >= 0.15) {
    rawScore += 7;
    add('Taux de marge correct (15 – 30 %)', 7);
  } else {
    add('Taux de marge faible (< 15 %)', 0);
  }

  // 3. Seuil de rentabilite
  if (computed.breakEvenReachable && computed.breakEvenRevenue !== null) {
    if (computed.monthlyRevenue >= computed.breakEvenRevenue) {
      rawScore += 20;
      add('Seuil de rentabilité dépassé', 20);
    } else if (computed.monthlyRevenue >= computed.breakEvenRevenue * 0.8) {
      rawScore += 10;
      add('Proche du seuil de rentabilité (≥ 80 %)', 10);
    } else {
      add('Loin du seuil de rentabilité (< 80 %)', 0);
    }
  } else {
    add('Seuil de rentabilité non atteignable', 0);
  }

  // 4. Delai de recuperation de l'investissement
  if (input.initialInvestment === 0) {
    rawScore += 20;
    add('Aucun investissement initial à récupérer', 20);
  } else if (computed.paybackMonths !== null) {
    if (computed.paybackMonths <= 24) {
      rawScore += 20;
      add('Récupération rapide (≤ 24 mois)', 20);
    } else if (computed.paybackMonths <= 48) {
      rawScore += 10;
      add('Récupération moyenne (25 – 48 mois)', 10);
    } else {
      add('Récupération lente (> 48 mois)', 0);
    }
  } else {
    add('Investissement jamais récupéré au niveau de ventes saisi', 0);
  }

  // 5. Penalites
  if (
    computed.monthlyResult > 0 &&
    computed.paybackMonths !== null &&
    input.initialInvestment > 0 &&
    computed.paybackMonths > 60
  ) {
    rawScore -= 10;
    add('Récupération très lente (> 60 mois)', -10);
  }

  const structurallyViable = input.unitPrice > 0 && computed.unitMargin > 0;
  if (!structurallyViable) {
    rawScore -= 20;
    add('Marge unitaire nulle ou négative', -20);
  }

  const score = clampHealthScore(rawScore);

  let status: FinancialHealthStatus;
  if (!structurallyViable) {
    status = 'non_rentable';
  } else if (score >= 70) {
    status = 'solide';
  } else if (score >= 45) {
    status = 'fragile';
  } else {
    status = 'risque';
  }

  return {
    score,
    status,
    label: HEALTH_STATUS_LABELS[status],
    summary: HEALTH_STATUS_SUMMARIES[status],
    factors,
  };
}
