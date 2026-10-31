/**
 * StartUpCheck AI - Matrice des risques de l'etude de projet.
 *
 * Les probabilites et impacts sont des HYPOTHESES deterministes, derivees des
 * indices sectoriels et des scores deja calcules. Ils ne representent jamais
 * une mesure statistique reelle.
 *
 * Niveau = probabilite x impact (1 a 16)
 *   1-4 faible | 5-8 modere | 9-12 eleve | 13-16 critique
 */

import type { StudyContext } from './context';
import type { RiskCategory, RiskLevelLabel, RiskScale, StudyRisk } from './types';
import { calcule, formatMAD, formatPercent, hypothese, levelWord } from './text';

const CATEGORY_LABELS: Record<RiskCategory, string> = {
  financier: 'Financier',
  commercial: 'Commercial',
  operationnel: 'Opérationnel',
  technique: 'Technique',
  juridique: 'Juridique',
  rh: 'Ressources humaines',
};

const LEVEL_LABELS: Record<RiskLevelLabel, string> = {
  faible: 'Faible',
  modere: 'Modéré',
  eleve: 'Élevé',
  critique: 'Critique',
};

function scale(value: number): RiskScale {
  const clamped = Math.min(4, Math.max(1, Math.round(value)));
  return clamped as RiskScale;
}

export function riskLevelOf(score: number): { level: RiskLevelLabel; label: string } {
  if (score >= 13) {
    return { level: 'critique', label: LEVEL_LABELS.critique };
  }
  if (score >= 9) {
    return { level: 'eleve', label: LEVEL_LABELS.eleve };
  }
  if (score >= 5) {
    return { level: 'modere', label: LEVEL_LABELS.modere };
  }
  return { level: 'faible', label: LEVEL_LABELS.faible };
}

function buildRisk(
  category: RiskCategory,
  title: string,
  description: StudyRisk['description'],
  probability: number,
  impact: number,
  mitigation: StudyRisk['mitigation'],
): StudyRisk {
  const p = scale(probability);
  const i = scale(impact);
  const score = p * i;
  const { level, label } = riskLevelOf(score);

  return {
    id: `risque-${category}`,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    title,
    description,
    probability: p,
    impact: i,
    score,
    level,
    levelLabel: label,
    mitigation,
  };
}

export function buildRisks(ctx: StudyContext): StudyRisk[] {
  const { sector, market, financial, analysis } = ctx;
  const budgetScore = ctx.budgetScore ?? 50;
  const marketScore = ctx.scoreValue('market');
  const budgetText = formatMAD(analysis.inputs.budget);
  const budgetLabel = ctx.budgetLabel ? ctx.budgetLabel.toLowerCase() : 'non évalué';

  // -------------------------------------------------------------------------
  // Financier
  // -------------------------------------------------------------------------
  let financialProbability = budgetScore >= 75 ? 1 : budgetScore >= 55 ? 2 : budgetScore >= 35 ? 3 : 4;
  if (financial) {
    if (financial.health.status === 'non_rentable') {
      financialProbability = 4;
    } else if (financial.health.status === 'risque') {
      financialProbability = Math.max(financialProbability, 3);
    }
  }

  const financialBasis = financial
    ? `Le budget déclaré (${budgetText}) est confronté au ticket d'entrée indicatif du secteur ${sector.label}. Le score d'adéquation du budget est de ${budgetScore}/100 et la santé financière est « ${financial.health.label.toLowerCase()} » (${financial.health.score}/100).`
    : `Le budget déclaré (${budgetText}) est confronté au ticket d'entrée indicatif du secteur ${sector.label}. Le score d'adéquation du budget est de ${budgetScore}/100. Aucun Financial Check n'est rattaché : le besoin de financement n'est pas chiffré.`;

  const financier = buildRisk(
    'financier',
    'Insuffisance ou mauvaise allocation du financement',
    calcule(financialBasis, 'Comparaison budget / ticket d’entrée sectoriel, sans projection de trésorerie.'),
    financialProbability,
    4,
    hypothese(
      financial
        ? 'Sécuriser un fonds de roulement couvrant au moins 6 mois de charges fixes, suivre mensuellement l’écart entre résultat réel et scénario réaliste du Financial Check, et prévoir un plan de réduction des charges fixes.'
        : 'Chiffrer le besoin de financement dans Financial Check, sécuriser un fonds de roulement couvrant au moins 6 mois de charges fixes et identifier une source de financement avant l’engagement des dépenses.',
    ),
  );

  // -------------------------------------------------------------------------
  // Commercial
  // -------------------------------------------------------------------------
  let commercialProbability = sector.competition >= 70 ? 3 : sector.competition >= 50 ? 2 : 1;
  if (marketScore < 45) {
    commercialProbability += 1;
  }
  if (financial && financial.input.monthlyUnits <= 0) {
    commercialProbability = 4;
  }

  const commercialBasis = financial
    ? `L'intensité concurrentielle du secteur ${sector.label} est ${levelWord(sector.competition)} (indice ${sector.competition}/100) et le potentiel de marché est noté ${marketScore}/100. Le Financial Check retient ${financial.input.monthlyUnits} vente(s) par mois, soit ${formatMAD(financial.computed.monthlyRevenue)} de chiffre d'affaires mensuel.`
    : `L'intensité concurrentielle du secteur ${sector.label} est ${levelWord(sector.competition)} (indice ${sector.competition}/100) et le potentiel de marché est noté ${marketScore}/100. Le volume de ventes n'est pas chiffré faute de Financial Check.`;

  const commercial = buildRisk(
    'commercial',
    'Difficulté à acquérir et fidéliser les clients',
    calcule(commercialBasis, 'Indices sectoriels heuristiques et données saisies, sans étude de marché chiffrée.'),
    commercialProbability,
    4,
    hypothese(
      `Tester l'offre auprès de 10 à 15 clients de la cible « ${ctx.targetClients} », mesurer le coût d'acquisition réel dès le pilote et prévoir un canal de secours si le canal principal ne convertit pas.`,
    ),
  );

  // -------------------------------------------------------------------------
  // Opérationnel
  // -------------------------------------------------------------------------
  let operationalProbability = sector.scalability >= 75 ? 1 : sector.scalability >= 50 ? 2 : 3;
  if (budgetScore < 45) {
    operationalProbability += 1;
  }

  const operational = buildRisk(
    'operationnel',
    'Capacité de production ou de service insuffisante',
    calcule(
      `La capacité de passage à l'échelle du secteur ${sector.label} est ${levelWord(sector.scalability)} (indice ${sector.scalability}/100). Le budget est jugé ${budgetLabel} par le moteur d'analyse (${budgetScore}/100).`,
      'Indice sectoriel heuristique, sans simulation de charge opérationnelle.',
    ),
    operationalProbability,
    3,
    hypothese(
      'Documenter les processus critiques, définir un seuil de déclenchement de recrutement ou de sous-traitance et tester la montée en charge sur un volume pilote avant d’élargir la clientèle.',
    ),
  );

  // -------------------------------------------------------------------------
  // Technique
  // -------------------------------------------------------------------------
  const technicalProbability = sector.techComplexity >= 70 ? 3 : sector.techComplexity >= 45 ? 2 : 1;

  const technique = buildRisk(
    'technique',
    'Complexité technique ou dépendance à un prestataire',
    calcule(
      `La complexité technique du secteur ${sector.label} est ${levelWord(sector.techComplexity)} (indice ${sector.techComplexity}/100). Le score de faisabilité globale du projet est de ${analysis.globalScore}/100.`,
      'Indice sectoriel heuristique, sans audit technique.',
    ),
    technicalProbability,
    3,
    hypothese(
      'Valider un prototype fonctionnel avant le lancement, documenter les dépendances techniques et prévoir une solution de repli pour chaque prestataire ou brique critique.',
    ),
  );

  // -------------------------------------------------------------------------
  // Juridique
  // -------------------------------------------------------------------------
  const legalProbability = sector.regulation >= 60 ? 3 : sector.regulation >= 35 ? 2 : 1;

  const juridique = buildRisk(
    'juridique',
    'Non-conformité réglementaire ou contractuelle',
    calcule(
      `La lourdeur réglementaire du secteur ${sector.label} est ${levelWord(sector.regulation)} (indice ${sector.regulation}/100). Aucune vérification juridique n'est réalisée par le moteur.`,
      'Indice sectoriel heuristique, sans revue juridique.',
    ),
    legalProbability,
    4,
    hypothese(
      'Identifier les obligations applicables (statut, déclarations, protection des données, contrats) et faire valider les documents contractuels types par un professionnel du droit avant le lancement.',
    ),
  );

  // -------------------------------------------------------------------------
  // Ressources humaines
  // -------------------------------------------------------------------------
  let rhProbability = budgetScore < 45 ? 3 : budgetScore < 65 ? 2 : 1;
  if (sector.scalability >= 80) {
    rhProbability = Math.max(rhProbability, 2);
  }

  const rh = buildRisk(
    'rh',
    'Compétences clés manquantes ou équipe sous-dimensionnée',
    calcule(
      `Le budget (${budgetText}) est jugé ${budgetLabel} face au ticket d'entrée du secteur (${budgetScore}/100). La capacité de passage à l'échelle est ${levelWord(sector.scalability)} (indice ${sector.scalability}/100), ce qui conditionne le besoin en recrutement.`,
      'Déduction à partir des indices sectoriels, sans analyse des profils disponibles.',
    ),
    rhProbability,
    3,
    hypothese(
      'Cartographier les compétences indispensables, identifier les rôles externalisables au démarrage et formaliser un plan de recrutement conditionné à l’atteinte des premiers objectifs commerciaux.',
    ),
  );

  // -------------------------------------------------------------------------
  // Ajustements lies au marche
  // -------------------------------------------------------------------------
  const risks = [financier, commercial, operational, technique, juridique, rh];

  // Le pouvoir d'achat du marche renforce le risque commercial.
  if (market.purchasingPower < 40) {
    risks[1] = buildRisk(
      'commercial',
      'Difficulté à acquérir et fidéliser les clients',
      commercial.description,
      commercial.probability + 1,
      commercial.impact,
      commercial.mitigation,
    );
  }

  return risks;
}

/** Compte les risques par niveau, pour l'affichage synthetique. */
export function summarizeRisks(risks: StudyRisk[]): Record<RiskLevelLabel, number> {
  const summary: Record<RiskLevelLabel, number> = {
    faible: 0,
    modere: 0,
    eleve: 0,
    critique: 0,
  };
  for (const risk of risks) {
    summary[risk.level] += 1;
  }
  return summary;
}

/** Texte d'introduction de la section Risques. */
export function risksIntro(risks: StudyRisk[]): string {
  const summary = summarizeRisks(risks);
  const critical = summary.critique + summary.eleve;
  const parts = [
    `${risks.length} risques ont été identifiés`,
    `${summary.critique} critique(s)`,
    `${summary.eleve} élevé(s)`,
    `${summary.modere} modéré(s)`,
    `${summary.faible} faible(s)`,
  ];
  return `${parts.join(', ')}. ${
    critical > 0
      ? 'Les risques élevés et critiques doivent être traités avant l’engagement des dépenses principales.'
      : 'Aucun risque critique n’est identifié, mais la surveillance reste nécessaire.'
  }`;
}

/** Pourcentage de risques maitrisables (faible + modere), utile en conclusion. */
export function controlledRiskRate(risks: StudyRisk[]): number {
  if (risks.length === 0) {
    return 0;
  }
  const controlled = risks.filter((risk) => risk.level === 'faible' || risk.level === 'modere').length;
  return Math.round((controlled / risks.length) * 100) / 100;
}

/** Export utilitaire pour les textes financiers de la section Finance. */
export function financialSummaryText(ctx: StudyContext): string {
  const financial = ctx.financial;
  if (!financial) {
    return '';
  }
  return `Marge unitaire : ${formatMAD(financial.computed.unitMargin)} · Marge nette : ${formatPercent(financial.computed.netMarginRate)} · Seuil de rentabilité : ${formatMAD(financial.computed.breakEvenRevenue)}`;
}
