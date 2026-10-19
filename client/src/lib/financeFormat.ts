/**
 * Formatage spécifique au module "Financial Check".
 * Les cas non calculables (null) sont toujours explicités : jamais de valeur
 * inventée à l'affichage.
 */

import { formatMAD, formatPercent } from './format';

/** « Non atteignable avec ces hypothèses » pour un seuil inexistant. */
export const NOT_REACHABLE = 'Non atteignable avec ces hypothèses';

/** Nombre décimal au format français (virgule), pour rester cohérent avec les pourcentages. */
function frNumber(value: number, digits: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/**
 * Délai de récupération (payback).
 * - investissement initial nul → aucun investissement à récupérer ;
 * - résultat négatif (payback null) → jamais atteint ;
 * - sinon → mois arrondis, avec équivalent en années si pertinent.
 */
export function formatPayback(months: number | null, initialInvestment: number): string {
  if (initialInvestment === 0) {
    return 'Aucun investissement initial à récupérer';
  }
  if (months === null) {
    return 'Jamais atteint avec ces hypothèses';
  }
  if (months === 0) {
    return 'Immédiat';
  }
  const rounded = months < 10 ? frNumber(months, 1) : String(Math.round(months));
  if (months >= 12) {
    const years = months / 12;
    const yearsLabel = years < 10 ? frNumber(years, 1) : String(Math.round(years));
    return `${rounded} mois (≈ ${yearsLabel} an${years > 1 ? 's' : ''})`;
  }
  return `${rounded} mois`;
}

/** ROI annuel : non applicable sans investissement initial. */
export function formatRoi(roi: number | null): string {
  if (roi === null) {
    return 'Non applicable — aucun investissement initial';
  }
  const percent = roi * 100;
  const sign = percent > 0 ? '+' : '';
  return `${sign}${formatPercent(percent, 1)}`;
}

/** Taux (0-1) en pourcentage, ou tiret si non calculable. */
export function formatRate(rate: number | null, digits = 1): string {
  if (rate === null) return '—';
  return formatPercent(rate * 100, digits);
}

/** Montant DH, ou tiret si non calculable. */
export function formatAmountOrDash(value: number | null): string {
  if (value === null) return '—';
  return formatMAD(value);
}

/** Chaîne signée pour un montant (résultat positif / négatif). */
export function formatSignedMAD(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatMAD(value)}`;
}
