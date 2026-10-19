/**
 * StartUpCheck AI - Moteur de scoring déterministe.
 *
 * C'est le cœur du projet : il produit TOUJOURS un résultat, sans aucune API
 * externe. Les notes sont calculées à partir des barèmes sectoriels/pays
 * (catalog.ts) et de l'analyse de texte locale (textSignals.ts).
 *
 * Formule du score global :
 *   0.25*Marché + 0.20*Faisabilité + 0.20*Innovation + 0.20*Croissance
 *   + 0.15*(100 - Risque)
 */

import { DEFAULT_MARKET, DEFAULT_SECTOR, MARKET_MAP, SECTOR_MAP, type Market, type Sector } from './catalog';
import {
  analyzeDescription,
  analyzeTargeting,
  budgetAdequacy,
  clamp,
  type TextSignals,
} from './textSignals';
import type {
  AnalysisInput,
  RiskLevel,
  ScoreResult,
  Verdict,
} from './types';

export const WEIGHTS = {
  market: 0.25,
  feasibility: 0.2,
  innovation: 0.2,
  growth: 0.2,
  risk: 0.15,
} as const;

export const METHODOLOGY_VERSION = '1.0.0';

export type ScoringOutcome = {
  sector: Sector;
  market: Market;
  scores: ScoreResult[];
  globalScore: number;
  riskLevel: RiskLevel;
  riskLabel: string;
  verdict: Verdict;
  verdictLabel: string;
  verdictReason: string;
  signals: TextSignals;
  budgetScore: number;
  budgetRatio: number;
  budgetLabel: string;
  confidence: number;
};

export function riskLevelOf(riskValue: number): { level: RiskLevel; label: string } {
  if (riskValue < 30) return { level: 'faible', label: 'Faible' };
  if (riskValue < 50) return { level: 'modere', label: 'Modéré' };
  if (riskValue < 70) return { level: 'eleve', label: 'Élevé' };
  return { level: 'tres_eleve', label: 'Très élevé' };
}

export function verdictOf(globalScore: number): { verdict: Verdict; label: string } {
  if (globalScore >= 70) return { verdict: 'developper', label: 'À développer' };
  if (globalScore >= 50) return { verdict: 'ameliorer', label: 'À améliorer' };
  return { verdict: 'risque', label: 'Risqué' };
}

function round(value: number): number {
  return Math.round(clamp(value, 0, 100));
}

export function scoreIdea(input: AnalysisInput): ScoringOutcome {
  const sector = SECTOR_MAP[input.sector] ?? DEFAULT_SECTOR;
  const market = MARKET_MAP[input.market] ?? DEFAULT_MARKET;

  const description = analyzeDescription(input.description);
  const { descriptionQuality, innovationScore, differentiationScore, businessModelScore, innovationLabels } =
    description;
  const { targetClarity } = analyzeTargeting(input.targetClients);
  const budget = budgetAdequacy(input.budget, sector.entryCost);
  const budgetScore = budget.score;
  const budgetDeficit = 100 - budgetScore;

  const signals: TextSignals = {
    innovationScore,
    differentiationScore,
    descriptionQuality,
    targetClarity,
    businessModelScore,
    innovationLabels,
  };

  // ------------------------------------------------------------------
  // 1. Potentiel du marché
  // ------------------------------------------------------------------
  const marketValue = round(
    0.32 * sector.market +
      0.18 * market.maturity +
      0.18 * market.purchasingPower +
      0.14 * market.digitalAdoption +
      0.18 * targetClarity,
  );

  // ------------------------------------------------------------------
  // 2. Faisabilité
  // ------------------------------------------------------------------
  const feasibilityValue = round(
    0.3 * budgetScore +
      0.25 * (100 - sector.regulation) +
      0.2 * (100 - sector.techComplexity) +
      0.15 * descriptionQuality +
      0.1 * targetClarity,
  );

  // ------------------------------------------------------------------
  // 3. Innovation
  // ------------------------------------------------------------------
  const innovationValue = round(
    42 +
      26 * innovationScore +
      14 * differentiationScore +
      12 * (1 - sector.competition / 100) +
      6 * (sector.techComplexity / 100),
  );

  // ------------------------------------------------------------------
  // 4. Potentiel de croissance
  // ------------------------------------------------------------------
  const growthValue = round(
    0.3 * sector.growth +
      0.25 * sector.scalability +
      0.18 * market.growth +
      0.12 * market.digitalAdoption +
      0.15 * descriptionQuality,
  );

  // ------------------------------------------------------------------
  // 5. Niveau de risque (plus la note est haute, plus le risque est grand)
  // ------------------------------------------------------------------
  const riskValue = round(
    0.22 * sector.competition +
      0.2 * sector.regulation +
      0.13 * sector.techComplexity +
      0.2 * budgetDeficit +
      0.1 * (100 - market.maturity) +
      0.15 * (100 - descriptionQuality),
  );

  const scores: ScoreResult[] = [
    {
      key: 'market',
      label: 'Potentiel du marché',
      value: marketValue,
      weight: WEIGHTS.market,
      inverted: false,
      summary: marketSummary(marketValue, sector, market),
      factors: [
        { label: `Attractivité du secteur ${sector.label}`, value: sector.market },
        { label: `Maturité du marché (${market.label})`, value: market.maturity },
        { label: `Pouvoir d'achat (${market.label})`, value: market.purchasingPower },
        { label: `Adoption numérique (${market.label})`, value: market.digitalAdoption },
        { label: 'Précision de la cible client', value: targetClarity },
      ],
    },
    {
      key: 'feasibility',
      label: 'Faisabilité',
      value: feasibilityValue,
      weight: WEIGHTS.feasibility,
      inverted: false,
      summary: feasibilitySummary(feasibilityValue, budget.label, sector),
      factors: [
        { label: `Adéquation du budget (${budget.label})`, value: budgetScore },
        { label: 'Lourdeur réglementaire (inversée)', value: 100 - sector.regulation },
        { label: 'Complexité technique (inversée)', value: 100 - sector.techComplexity },
        { label: 'Qualité de la description', value: descriptionQuality },
        { label: 'Précision de la cible client', value: targetClarity },
      ],
    },
    {
      key: 'innovation',
      label: 'Innovation',
      value: innovationValue,
      weight: WEIGHTS.innovation,
      inverted: false,
      summary: innovationSummary(innovationValue, signals),
      factors: [
        { label: 'Signaux innovants détectés', value: round(100 * innovationScore) },
        { label: 'Différenciation revendiquée', value: round(100 * differentiationScore) },
        { label: 'Faible saturation concurrentielle', value: 100 - sector.competition },
        { label: 'Intensité technologique du secteur', value: sector.techComplexity },
      ],
    },
    {
      key: 'growth',
      label: 'Potentiel de croissance',
      value: growthValue,
      weight: WEIGHTS.growth,
      inverted: false,
      summary: growthSummary(growthValue, sector, market),
      factors: [
        { label: `Croissance du secteur ${sector.label}`, value: sector.growth },
        { label: "Capacité de passage à l'échelle", value: sector.scalability },
        { label: `Dynamisme du marché (${market.label})`, value: market.growth },
        { label: `Adoption numérique (${market.label})`, value: market.digitalAdoption },
        { label: 'Qualité de la description', value: descriptionQuality },
      ],
    },
    {
      key: 'risk',
      label: 'Niveau de risque',
      value: riskValue,
      weight: WEIGHTS.risk,
      inverted: true,
      summary: riskSummary(riskValue, sector, budget.label),
      factors: [
        { label: 'Intensité concurrentielle', value: sector.competition },
        { label: 'Lourdeur réglementaire', value: sector.regulation },
        { label: 'Complexité technique', value: sector.techComplexity },
        { label: `Insuffisance du budget (${budget.label})`, value: budgetDeficit },
        { label: `Immaturité du marché (${market.label})`, value: 100 - market.maturity },
        { label: 'Imprécision de la description', value: 100 - descriptionQuality },
      ],
    },
  ];

  const globalScore = round(
    marketValue * WEIGHTS.market +
      feasibilityValue * WEIGHTS.feasibility +
      innovationValue * WEIGHTS.innovation +
      growthValue * WEIGHTS.growth +
      (100 - riskValue) * WEIGHTS.risk,
  );

  const { level: riskLevel, label: riskLabel } = riskLevelOf(riskValue);
  const { verdict, label: verdictLabel } = verdictOf(globalScore);

  // Indice de confiance : dépend du volume d'information fourni par l'utilisateur.
  const confidence =
    Math.round(
      clamp(0.35 + 0.004 * descriptionQuality + 0.0025 * targetClarity + 0.002 * market.maturity, 0.3, 0.95) *
        100,
    ) / 100;

  return {
    sector,
    market,
    scores,
    globalScore,
    riskLevel,
    riskLabel,
    verdict,
    verdictLabel,
    verdictReason: buildVerdictReason(globalScore, verdict, scores, sector, market),
    signals,
    budgetScore,
    budgetRatio: budget.ratio,
    budgetLabel: budget.label,
    confidence,
  };
}

// ---------------------------------------------------------------------------
// Phrase de synthèse par dimension
// ---------------------------------------------------------------------------

function marketSummary(value: number, sector: Sector, market: Market): string {
  if (value >= 75) {
    return `Marché ${sector.label} très porteur sur ${market.label} : demande solvable et cible identifiable.`;
  }
  if (value >= 60) {
    return `Marché ${sector.label} correct sur ${market.label}, mais la cible doit rester bien délimitée.`;
  }
  if (value >= 45) {
    return `Marché ${sector.label} étroit sur ${market.label} : la taille du marché final est un point de vigilance.`;
  }
  return `Marché ${sector.label} peu accessible sur ${market.label} : faible pouvoir d'achat ou cible trop floue.`;
}

function feasibilitySummary(value: number, budgetLabel: string, sector: Sector): string {
  if (value >= 75) {
    return `Projet réalisable rapidement : budget ${budgetLabel.toLowerCase()} et complexité maîtrisable.`;
  }
  if (value >= 60) {
    return `Projet réalisable, avec un budget ${budgetLabel.toLowerCase()} face au ticket d'entrée du secteur.`;
  }
  if (value >= 45) {
    return `Réalisation possible mais tendue : ${
      sector.regulation >= 60 ? 'cadre réglementaire lourd' : 'ressources de départ limitées'
    }.`;
  }
  return `Faisabilité faible dans l'état actuel : budget insuffisant ou complexité trop élevée.`;
}

function innovationSummary(value: number, signals: TextSignals): string {
  if (value >= 75) {
    return `Proposition nettement différenciante : ${
      signals.innovationLabels.slice(0, 2).join(', ') || 'leviers innovants identifiés'
    }.`;
  }
  if (value >= 60) {
    return `Proposition avec des leviers innovants, mais la différenciation reste à prouver.`;
  }
  if (value >= 45) {
    return `Offre assez classique : peu de signaux d'innovation explicites dans la description.`;
  }
  return `Offre peu différenciante : le risque de banalisation est élevé.`;
}

function growthSummary(value: number, sector: Sector, market: Market): string {
  if (value >= 75) {
    return `Fort potentiel de croissance : secteur dynamique et modèle capable de passer à l'échelle.`;
  }
  if (value >= 60) {
    return `Croissance plausible si le modèle économique est industrialisé et les coûts maîtrisés.`;
  }
  if (value >= 45) {
    return `Croissance modérée : le secteur ${sector.label} progresse, mais le passage à l'échelle reste limité.`;
  }
  return `Croissance faible attendue sur ${market.label} : activité très dépendante de la présence physique.`;
}

function riskSummary(value: number, sector: Sector, budgetLabel: string): string {
  if (value >= 70) {
    return `Risque très élevé : forte concurrence, cadre contraignant et budget ${budgetLabel.toLowerCase()}.`;
  }
  if (value >= 50) {
    return `Risque élevé à surveiller, principalement sur ${
      sector.competition >= 78 ? "l'acquisition client" : 'le financement du démarrage'
    }.`;
  }
  if (value >= 30) {
    return `Risque modéré : les principaux facteurs sont identifiés et peuvent être pilotés.`;
  }
  return `Risque faible : le secteur et le marché présentent peu de facteurs défavorables.`;
}

function buildVerdictReason(
  globalScore: number,
  verdict: Verdict,
  scores: ScoreResult[],
  sector: Sector,
  market: Market,
): string {
  const ranked = [...scores].sort(
    (a, b) => (b.inverted ? 100 - b.value : b.value) - (a.inverted ? 100 - a.value : a.value),
  );
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];

  const bestText = `${best.label} (${best.value}/100)`;
  const worstText = `${worst.label} (${worst.value}/100)`;

  if (verdict === 'developper') {
    return `Avec ${globalScore}/100, le projet ${sector.label} sur le marché ${market.label} réunit les conditions d'un lancement : point fort principal sur ${bestText}. Le principal point de vigilance reste ${worstText}, à traiter dès la phase de lancement.`;
  }
  if (verdict === 'ameliorer') {
    return `Avec ${globalScore}/100, le projet mérite d'être poursuivi mais pas encore lancé en l'état. Le socle est là (${bestText}), mais ${worstText} doit être corrigé avant d'investir davantage.`;
  }
  return `Avec ${globalScore}/100, le projet présente un risque important à ce stade : ${worstText} pénalise fortement la viabilité. Les acquis (${bestText}) ne suffisent pas à compenser.`;
}
