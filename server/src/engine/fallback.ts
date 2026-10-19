/**
 * StartUpCheck AI - Générateur de texte DÉTERMINISTE (fallback).
 *
 * Produit l'analyse SWOT, les recommandations et la justification du verdict
 * à partir des scores déjà calculés. Ce module NE FAIT APPEL À AUCUNE IA
 * GÉNÉRATIVE : les textes sont construits par règles.
 *
 * C'est cette couche qui est utilisée lorsque :
 *   - aucune clé API LLM n'est configurée, ou
 *   - l'appel au LLM échoue ou dépasse le délai maximum.
 *
 * L'interface indique clairement à l'utilisateur que ce moteur local a été
 * utilisé : aucune mention d'IA générative n'est affichée dans ce cas.
 */

import type { Recommendation, Swot } from './types';
import type { ScoringOutcome } from './scoring';

export function formatMAD(value: number): string {
  const rounded = Math.round(value);
  const withSeparators = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${withSeparators} DH`;
}

function scoreOf(outcome: ScoringOutcome, key: string): number {
  return outcome.scores.find((s) => s.key === key)?.value ?? 0;
}

export function buildFallbackSwot(outcome: ScoringOutcome): Swot {
  const { sector, market, signals, budgetScore, budgetRatio } = outcome;

  const marketScore = scoreOf(outcome, 'market');
  const feasibility = scoreOf(outcome, 'feasibility');
  const innovation = scoreOf(outcome, 'innovation');
  const growth = scoreOf(outcome, 'growth');
  const risk = scoreOf(outcome, 'risk');

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  // ---------------- FORCES ----------------
  if (marketScore >= 68) {
    strengths.push(
      `Marché ${sector.label} attractif sur ${market.label} (indice interne ${marketScore}/100) : la demande existe déjà.`,
    );
  }
  if (growth >= 68) {
    strengths.push(
      `Secteur en croissance (${sector.growth}/100) : ${sector.trends[0]?.toLowerCase() ?? 'dynamique de fond favorable'}.`,
    );
  }
  if (sector.scalability >= 78) {
    strengths.push(
      `Modèle fortement scalable (${sector.scalability}/100) : la croissance ne dépend pas proportionnellement aux effectifs.`,
    );
  }
  if (signals.targetClarity >= 75) {
    strengths.push(
      `Cible client clairement identifiée : le discours commercial peut être précis dès le départ.`,
    );
  }
  if (budgetScore >= 75) {
    strengths.push(
      `Budget d'entrée cohérent (${budgetRatio.toFixed(1)}x le ticket d'entrée estimé du secteur) : le démarrage peut être financé sans tension immédiate.`,
    );
  }
  if (signals.innovationScore >= 0.55) {
    strengths.push(
      `Leviers d'innovation détectés dans la description${
        signals.innovationLabels.length ? ` (${signals.innovationLabels.slice(0, 3).join(', ')})` : ''
      }.`,
    );
  }
  if (feasibility >= 72) {
    strengths.push(`Mise en œuvre techniquement accessible : pas de barrière majeure à la réalisation.`);
  }
  if (market.digitalAdoption >= 72) {
    strengths.push(
      `Marché ${market.label} à forte adoption numérique (${market.digitalAdoption}/100) : acquisition digitale possible.`,
    );
  }
  if (strengths.length === 0) {
    strengths.push(
      `Idée positionnée sur un besoin réel du secteur ${sector.label}, ce qui permet un premier test à faible coût.`,
    );
  }

  // ---------------- FAIBLESSES ----------------
  if (budgetScore < 60) {
    weaknesses.push(
      `Budget de ${formatMAD(budgetRatio * sector.entryCost)} face à un ticket d'entrée estimé à ${formatMAD(sector.entryCost)} : marge de manœuvre limitée (adéquation ${budgetScore}/100).`,
    );
  }
  if (signals.descriptionQuality < 65) {
    weaknesses.push(
      `Description encore générale (indice de structuration ${signals.descriptionQuality}/100) : le problème résolu et le modèle économique ne sont pas explicites.`,
    );
  }
  if (sector.competition >= 80) {
    weaknesses.push(
      `Secteur très concurrentiel (${sector.competition}/100) : l'acquisition client sera le poste de coût dominant.`,
    );
  }
  if (sector.regulation >= 70) {
    weaknesses.push(
      `Cadre réglementaire lourd (${sector.regulation}/100) : délais et coûts de mise en conformité à prévoir.`,
    );
  }
  if (sector.techComplexity >= 70 && budgetScore < 75) {
    weaknesses.push(
      `Complexité technique élevée (${sector.techComplexity}/100) pour un budget contraint : risque de sur-investissement au démarrage.`,
    );
  }
  if (signals.targetClarity < 62) {
    weaknesses.push(
      `Ciblage client encore large : impossible d'affiner le produit et le message sans segment prioritaire.`,
    );
  }
  if (market.purchasingPower < 50) {
    weaknesses.push(
      `Capacité de paiement limitée sur ${market.label} (${market.purchasingPower}/100) : le prix de vente devra rester accessible.`,
    );
  }
  if (signals.businessModelScore < 0.34) {
    weaknesses.push(`Modèle économique non décrit : la source de revenus et le prix moyen restent à définir.`);
  }
  if (weaknesses.length === 0) {
    weaknesses.push(
      `Peu de faiblesses structurelles, mais aucun élément ne prouve encore la traction commerciale.`,
    );
  }

  // ---------------- OPPORTUNITÉS ----------------
  opportunities.push(
    `Tendance de fond exploitable : ${sector.trends[1]?.toLowerCase() ?? sector.trends[0]?.toLowerCase() ?? 'digitalisation du secteur'}.`,
  );
  if (market.growth >= 65) {
    opportunities.push(
      `Marché ${market.label} en expansion (${market.growth}/100) : fenêtre de tir favorable pour un nouvel entrant.`,
    );
  }
  if (market.digitalAdoption >= 70) {
    opportunities.push(
      `Canaux digitaux matures : référencement, réseaux sociaux et partenariats en ligne permettent une croissance à faible coût.`,
    );
  }
  if (sector.competition >= 75) {
    opportunities.push(
      `Concurrence généraliste mais peu spécialisée : un positionnement sur une niche précise peut suffire à se différencier.`,
    );
  }
  if (market.supportProgram) {
    opportunities.push(`Financements et appuis mobilisables : ${market.supportProgram}.`);
  }
  if (signals.innovationScore >= 0.45) {
    opportunities.push(
      `Ouverture possible à l'international : le même socle technique peut être décliné sur des marchés proches.`,
    );
  }

  // ---------------- MENACES ----------------
  if (sector.competition >= 70) {
    threats.push(
      `Intensité concurrentielle de ${sector.competition}/100 : un acteur établi peut copier l'offre rapidement.`,
    );
  }
  if (sector.regulation >= 60) {
    threats.push(
      `Évolution réglementaire possible sur ${sector.label} : impact direct sur le modèle et les délais.`,
    );
  }
  if (budgetScore < 55) {
    threats.push(
      `Risque de trésorerie : un budget inférieur au ticket d'entrée du secteur peut être épuisé avant le premier chiffre d'affaires.`,
    );
  }
  threats.push(
    `Hausse attendue du coût d'acquisition client à mesure que la concurrence communique sur les mêmes canaux.`,
  );
  if (market.maturity < 60) {
    threats.push(
      `Immaturité du marché ${market.label} (${market.maturity}/100) : comportements d'achat encore instables, cycle de vente plus long.`,
    );
  }
  if (risk >= 60) {
    threats.push(
      `Dépendance forte au financement initial : toute baisse de budget remet en cause la feuille de route.`,
    );
  }
  if (sector.techComplexity >= 75) {
    threats.push(
      `Obsolescence technique rapide : des investissements de maintenance récurrents sont nécessaires.`,
    );
  }

  return { strengths, weaknesses, opportunities, threats };
}

// ---------------------------------------------------------------------------
// Recommandations
// ---------------------------------------------------------------------------

type RankedRecommendation = Recommendation & { rank: number };

export function buildFallbackRecommendations(outcome: ScoringOutcome): Recommendation[] {
  const { sector, market, signals, budgetScore, budgetRatio } = outcome;
  const marketScore = scoreOf(outcome, 'market');
  const innovation = scoreOf(outcome, 'innovation');
  const risk = scoreOf(outcome, 'risk');

  const list: RankedRecommendation[] = [];

  // 1. Financement
  if (budgetScore < 70) {
    list.push({
      rank: budgetScore < 50 ? 1 : 2,
      title: 'Sécuriser le financement avant le lancement',
      detail: `Votre budget représente ${budgetRatio.toFixed(2)}x le ticket d'entrée estimé du secteur (${formatMAD(sector.entryCost)}), soit une adéquation de ${budgetScore}/100. Réduisez le périmètre du MVP, visez un lancement pilote limité à un quartier ou à un segment, et activez les appuis mobilisables (${market.supportProgram}).`,
      priority: budgetScore < 50 ? 'haute' : 'moyenne',
      axis: 'Faisabilité',
    });
  }

  // 2. Positionnement
  if (sector.competition >= 75) {
    list.push({
      rank: 1,
      title: 'Construire un positionnement de niche',
      detail: `Avec un indice de saturation de ${sector.competition}/100, attaquer le marché de front revient à payer très cher chaque client. Choisissez un segment étroit (une ville, un métier, un type de client) et devenez la référence sur ce segment avant d'élargir.`,
      priority: 'haute',
      axis: 'Marché',
    });
  }

  // 3. Modèle économique
  if (signals.businessModelScore < 0.5) {
    list.push({
      rank: 2,
      title: 'Formaliser le modèle économique',
      detail: `Le modèle économique n'apparaît pas clairement dans votre description. Répondez par écrit à trois questions : qui paie, combien paie-t-il, et à quelle fréquence ? Testez ensuite le prix auprès de quinze prospects avant de développer la solution.`,
      priority: 'haute',
      axis: 'Faisabilité',
    });
  }

  // 4. Ciblage
  if (signals.targetClarity < 72) {
    list.push({
      rank: 2,
      title: 'Préciser le client cible prioritaire',
      detail: `Votre cible actuelle reste large. Définissez un persona unique (besoin, budget alloué, canal d'achat, objection principale) et adaptez tout le produit et le discours à ce persona pendant les six premiers mois.`,
      priority: 'moyenne',
      axis: 'Marché',
    });
  }

  // 5. Différenciation
  if (innovation < 70) {
    list.push({
      rank: 2,
      title: "Renforcer la différenciation de l'offre",
      detail: `Le score d'innovation est de ${innovation}/100. Identifiez au moins deux éléments que vos concurrents ne savent pas bien faire (délai, transparence, expérience, accompagnement, prix) et faites-en le cœur de votre promesse.`,
      priority: innovation < 55 ? 'haute' : 'moyenne',
      axis: 'Innovation',
    });
  }

  // 6. Croissance
  if (market.growth >= 65 && sector.scalability >= 70) {
    list.push({
      rank: 3,
      title: 'Préparer la croissance dès le départ',
      detail: `Le marché ${market.label} (${market.growth}/100) et la scalabilité du secteur (${sector.scalability}/100) le permettent. Structurez des indicateurs (coût d'acquisition, valeur vie client, marge par client) dès la première version pour piloter l'expansion sans intuition.`,
      priority: 'moyenne',
      axis: 'Croissance',
    });
  }

  // 7. Réglementation
  if (sector.regulation >= 65) {
    list.push({
      rank: 2,
      title: 'Cadrer les obligations réglementaires',
      detail: `La lourdeur réglementaire du secteur ${sector.label} est de ${sector.regulation}/100. Identifiez le régime juridique applicable, les autorisations nécessaires et le coût de mise en conformité AVANT d'investir dans le développement.`,
      priority: 'haute',
      axis: 'Risque',
    });
  }

  // 8. Complexité technique
  if (sector.techComplexity >= 70) {
    list.push({
      rank: 3,
      title: 'Réduire la complexité technique du MVP',
      detail: `Complexité technique du secteur : ${sector.techComplexity}/100. Pour la première version, assemblez des briques existantes (services cloud, intégrations prêtes à l'emploi) et réservez le développement spécifique au seul élément qui vous différencie.`,
      priority: 'moyenne',
      axis: 'Faisabilité',
    });
  }

  // 9. Marché étroit
  if (marketScore < 62 || market.purchasingPower < 55) {
    list.push({
      rank: 2,
      title: 'Valider la capacité de paiement du marché',
      detail: `Le potentiel de marché ressort à ${marketScore}/100 avec un pouvoir d'achat de ${market.purchasingPower}/100 sur ${market.label}. Testez le prix avec des prospects réels avant d'investir, et envisagez un format d'offre plus accessible (petit abonnement, paiement fractionné).`,
      priority: 'haute',
      axis: 'Marché',
    });
  }

  // 10. Risque global
  if (risk >= 60) {
    list.push({
      rank: 1,
      title: "Réduire le risque avant d'investir davantage",
      detail: `Le niveau de risque global est de ${risk}/100. Fixez un palier intermédiaire : déploiement limité sur un seul segment avec un objectif chiffré (par exemple trente clients payants en quatre-vingt-dix jours) avant d'engager la totalité du budget.`,
      priority: 'haute',
      axis: 'Risque',
    });
  }

  // 11. Toujours présent : pilotage
  list.push({
    rank: 3,
    title: 'Mettre en place un tableau de bord de pilotage',
    detail: `Suivez au minimum quatre indicateurs : coût d'acquisition client, taux de conversion, chiffre d'affaires par client et trésorerie disponible. Revoyez-les chaque semaine : c'est ce qui transforme une intuition en décision.`,
    priority: 'moyenne',
    axis: 'Croissance',
  });

  // 12. Toujours présent : preuve terrain
  list.push({
    rank: 3,
    title: "Confronter l'idée au terrain avant le développement",
    detail: `Réalisez vingt entretiens de quinze minutes avec des clients potentiels ciblés sur ${market.label}. Cherchez à faire parler du problème, pas de votre solution : c'est le meilleur signal de viabilité, et le moins coûteux.`,
    priority: 'haute',
    axis: 'Marché',
  });

  // Tri par priorité puis par rang, dédoublonnage par titre, maximum 6
  const priorityOrder: Record<Recommendation['priority'], number> = { haute: 0, moyenne: 1, basse: 2 };

  return list
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.rank - b.rank)
    .filter((item, index, array) => array.findIndex((x) => x.title === item.title) === index)
    .slice(0, 6)
    .map(({ rank, ...rest }) => {
      void rank;
      return rest;
    });
}
