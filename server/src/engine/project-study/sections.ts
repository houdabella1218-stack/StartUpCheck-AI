/**
 * StartUpCheck AI - Construction des 9 sections de l'etude de projet.
 *
 * Toutes les valeurs proviennent de donnees deja existantes :
 *  - saisie utilisateur (analyse + Financial Check)
 *  - scores deterministes deja calcules
 *  - indices heuristiques du catalogue (toujours marques "hypothese")
 *
 * Aucune donnee de marche chiffree n'est inventee.
 */

import type { StudyContext } from './context';
import type {
  ActionPlanSection,
  CommercialSection,
  ConclusionSection,
  FinanceSection,
  MarketSection,
  OrganizationSection,
  PresentationSection,
  RisksSection,
  StudyRisk,
  StudySource,
  StudyStatus,
  StudyText,
  TechnicalSection,
  RiskLevelLabel,
} from './types';
import { STUDY_STATUS_LABELS } from './feasibility';
import {
  calcule,
  capitalize,
  ensurePeriod,
  feminine,
  formatMAD,
  formatPercent,
  hypothese,
  levelWord,
  pickSentences,
  saisie,
  saisieLabel,
  truncate,
} from './text';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sourced(text: string, source: StudySource, note?: string): StudyText {
  const block: StudyText = { text: ensurePeriod(text), source };
  return note ? { ...block, note } : block;
}

function formatDateFr(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

const PROBLEM_KEYWORDS = [
  'probleme',
  'besoin',
  'difficult',
  'manque',
  'frustration',
  'perte',
  'cherche',
  'souffre',
  'lourd',
  'complexe',
  'inefficace',
  'limite',
  'obstacle',
  'contrainte',
];

const SOLUTION_KEYWORDS = [
  'solution',
  'propose',
  'permet',
  'offre',
  'application',
  'plateforme',
  'service',
  'outil',
  'facilite',
  'met en relation',
  'accompagne',
];

// ---------------------------------------------------------------------------
// 1. Presentation
// ---------------------------------------------------------------------------

export function buildPresentation(ctx: StudyContext): PresentationSection {
  const { analysis, sector, market } = ctx;

  const problemSentence = pickSentences(ctx.description, PROBLEM_KEYWORDS, 2);
  const problem: StudyText = problemSentence
    ? saisie(problemSentence, 'Reformulation de votre description, sans donnée ajoutée.')
    : calcule(
        "Le problème adressé n'est pas explicitement formulé dans la description fournie : il doit être précisé avant le lancement.",
        'Constat du moteur, pas une donnée de marché.',
      );

  const solutionSentence = pickSentences(ctx.description, SOLUTION_KEYWORDS, 2);
  const solution: StudyText = solutionSentence
    ? saisie(solutionSentence, 'Reformulation de votre description, sans donnée ajoutée.')
    : saisie(truncate(ctx.description, 240), 'Reprise de votre description.');

  const summary = calcule(
    `« ${ctx.name} » cible « ${truncate(ctx.targetClients, 120)} » sur le marché ${market.label}, dans le secteur ${sector.label}. ` +
      `L'analyse existante attribue une note globale de ${analysis.globalScore}/100 (${analysis.verdictLabel}) avec un niveau de risque ${analysis.riskLabel.toLowerCase()}. ` +
      "L'étude de projet reprend ces résultats sans les recalculer.",
    'Synthèse des scores déjà calculés par StartUpCheck.',
  );

  const objectives: StudyText[] = [
    analysis.globalScore >= 70
      ? calcule(`Maintenir la note globale au-dessus de 70/100 (actuellement ${analysis.globalScore}/100).`)
      : calcule(`Porter la note globale à 70/100 ou plus (actuellement ${analysis.globalScore}/100).`),
    ctx.financial
      ? calcule(
          `Consolider la santé financière au-dessus de 60/100 (actuellement ${ctx.financial.health.score}/100).`,
        )
      : calcule(
          'Compléter le module Financial Check pour chiffrer le modèle économique.',
          'Aucun chiffre financier n’est produit sans données saisies.',
        ),
    hypothese('Valider le besoin auprès de 15 clients potentiels avant l’engagement des dépenses principales.'),
    hypothese('Ramener les risques élevés ou critiques à un niveau modéré ou faible.'),
  ];

  return {
    key: 'presentation',
    title: 'Présentation du projet',
    projectName: saisieLabel(ctx.name),
    summary,
    problem,
    solution,
    targetClients: saisieLabel(
      ctx.targetClients.length > 0 ? ctx.targetClients : 'Cible non renseignée.',
      'Information issue de votre saisie.',
    ),
    sector: hypothese(
      `${sector.label} — ${sector.pitch} Indice d'attractivité sectoriel : ${sector.market}/100.`,
      'Indice heuristique du catalogue StartUpCheck, pas une donnée de marché auditée.',
    ),
    market: hypothese(
      `${market.label} — maturité ${feminine(levelWord(market.maturity))}, pouvoir d'achat ${feminine(levelWord(market.purchasingPower))}, adoption numérique ${feminine(levelWord(market.digitalAdoption))}.`,
      'Indices heuristiques du catalogue StartUpCheck.',
    ),
    objectives,
  };
}

// ---------------------------------------------------------------------------
// 2. Etude de marche
// ---------------------------------------------------------------------------

export function buildMarket(ctx: StudyContext): MarketSection {
  const { analysis, sector, market } = ctx;
  const swotNote =
    ctx.swotSource === 'ia'
      ? 'Élément produit par le modèle de langage lors de l’analyse, non vérifié.'
      : 'Élément déduit des indices sectoriels par le moteur local.';

  return {
    key: 'marche',
    title: 'Étude de marché',
    overview: hypothese(
      `Le marché ${market.label} présente une maturité ${feminine(levelWord(market.maturity))} et une adoption numérique ${feminine(levelWord(market.digitalAdoption))}. ` +
        `Le secteur ${sector.label} affiche une attractivité ${feminine(levelWord(sector.market))} (indice ${sector.market}/100) et une dynamique de croissance ${feminine(levelWord(sector.growth))} (indice ${sector.growth}/100).`,
      'Indices heuristiques : repères de cadrage, pas une mesure de marché.',
    ),
    demand: hypothese(
      `La demande potentielle est estimée ${feminine(levelWord(market.purchasingPower))} à partir du pouvoir d'achat (${market.purchasingPower}/100) et de l'adoption numérique (${market.digitalAdoption}/100). ` +
        "Cette estimation est un indice de cadrage, pas une prévision de demande.",
      'Hypothèse de travail à confirmer par des entretiens clients.',
    ),
    targetSegments: [
      saisie(`Segment principal : ${ctx.targetClients || 'non renseigné'}.`),
      saisie(`Zone géographique : ${market.label}.`),
      hypothese(
        'Segment secondaire à identifier lors des entretiens clients : aucune donnée ne permet de le qualifier à ce stade.',
      ),
    ],
    trends: sector.trends.map((trend) =>
      hypothese(trend, 'Tendance sectorielle issue du catalogue heuristique StartUpCheck.'),
    ),
    competition: hypothese(
      `Intensité concurrentielle ${feminine(levelWord(sector.competition))} (indice ${sector.competition}/100). ` +
        `Facilité à entreprendre sur le marché ${market.label} : indice ${market.easeOfBusiness}/100.`,
      'Indices heuristiques, sans analyse nominative des concurrents.',
    ),
    opportunities: analysis.swot.opportunities.map((item) => sourced(item, ctx.swotSource, swotNote)),
    threats: analysis.swot.threats.map((item) => sourced(item, ctx.swotSource, swotNote)),
    notice: calcule(
      "Aucune taille de marché chiffrée, part de marché ou prévision de demande n'est fournie : StartUpCheck ne dispose pas de données de marché auditées.",
      'Limite explicite du moteur.',
    ),
  };
}

// ---------------------------------------------------------------------------
// 3. Etude commerciale
// ---------------------------------------------------------------------------

export function buildCommercial(ctx: StudyContext): CommercialSection {
  const { analysis, sector, market } = ctx;
  const innovation = ctx.scoreValue('innovation');
  const growth = ctx.scoreValue('growth');
  const financial = ctx.financial;

  const pricing: StudyText = financial
    ? calcule(
        `Prix de vente moyen retenu : ${formatMAD(financial.input.unitPrice)} par vente ou client. ` +
          `Marge unitaire : ${formatMAD(financial.computed.unitMargin)}. ` +
          `Seuil de rentabilité : ${formatMAD(financial.computed.breakEvenRevenue)}` +
          (financial.computed.breakEvenUnits !== null
            ? ` (${Math.round(financial.computed.breakEvenUnits)} ventes par mois).`
            : '.'),
        `Copie figée du Financial Check du ${formatDateFr(financial.createdAt)}.`,
      )
    : calcule(
        "Aucun prix n'a été renseigné : la politique tarifaire reste à définir dans le module Financial Check.",
        'Donnée financière absente : aucun chiffre n’est inventé.',
      );

  const channels =
    market.digitalAdoption >= 65
      ? [
          'Site web et référencement naturel',
          'Réseaux sociaux et contenu éditorial',
          'Partenariats avec acteurs locaux',
          'Prospection directe ciblée',
        ]
      : market.digitalAdoption >= 45
        ? [
            'Site web vitrine',
            'Réseaux sociaux',
            'Prospection directe',
            'Recommandation client',
          ]
        : [
            'Prospection directe',
            'Partenariats locaux',
            'Bouche-à-oreille organisé',
            'Événements de proximité',
          ];

  return {
    key: 'commercial',
    title: 'Étude commerciale',
    valueProposition: hypothese(
      `Pour « ${truncate(ctx.targetClients, 100)} », ${ctx.name} propose ${truncate(ctx.description, 160)}. ` +
        `La différenciation revendiquée est notée ${innovation}/100 et le potentiel de croissance ${growth}/100.`,
      'Reformulation de votre description complétée par les scores existants.',
    ),
    offer: hypothese(
      `${capitalize(sector.pitch)} L'offre doit être décrite en une phrase testable auprès de la cible, avec le bénéfice principal et le prix de départ.`,
      'Cadre de travail à compléter avec vos éléments.',
    ),
    pricing,
    channels: channels.map((channel) =>
      hypothese(channel, `Canal cohérent avec une adoption numérique ${feminine(levelWord(market.digitalAdoption))}.`),
    ),
    communication: hypothese(
      'Construire un message centré sur le problème identifié et le bénéfice client, décliné sur le canal principal puis sur un canal de secours.',
    ),
    acquisition: hypothese(
      'Mesurer le coût d’acquisition client dès le pilote et comparer le coût d’acquisition à la marge dégagée par client.',
    ),
    retention: hypothese(
      'Mettre en place un suivi de satisfaction et un point de contact régulier avec les premiers clients pour réduire l’attrition.',
    ),
  };
}

// ---------------------------------------------------------------------------
// 4. Etude technique
// ---------------------------------------------------------------------------

export function buildTechnical(ctx: StudyContext): TechnicalSection {
  const { analysis, sector } = ctx;
  const budgetScore = ctx.budgetScore ?? 50;

  const technologies =
    sector.techComplexity >= 60
      ? [
          'Solution numérique sur mesure ou fortement paramétrable',
          'Base de données et sauvegardes régulières',
          'Outils de suivi des performances et de la disponibilité',
        ]
      : [
          'Site web ou application standard adaptée au besoin',
          'Outils de gestion et de suivi client',
          'Hébergement ou infrastructure mutualisée',
        ];

  const equipment =
    sector.entryCost >= 150000
      ? ['Équipement principal lié au cœur d’activité', 'Postes de travail', 'Outils de suivi et de gestion']
      : ['Postes de travail', 'Outils de gestion', 'Équipement léger complémentaire'];

  const process = [
    'Cadrage du besoin et définition du périmètre du pilote',
    'Conception ou assemblage de la solution',
    'Test auprès d’un groupe pilote et correction des frictions',
    'Mise en production et suivi des indicateurs',
  ];

  const constraints: string[] = [];
  if (sector.regulation >= 50) {
    constraints.push('Contraintes réglementaires à vérifier avant le lancement');
  }
  if (sector.techComplexity >= 60) {
    constraints.push('Complexité technique nécessitant une montée en compétence ou un prestataire');
  }
  if (budgetScore < 45) {
    constraints.push('Budget serré limitant les investissements techniques');
  }
  if (constraints.length === 0) {
    constraints.push('Aucune contrainte technique majeure identifiée par le moteur');
  }

  return {
    key: 'technique',
    title: 'Étude technique',
    solution: saisie(truncate(analysis.inputs.description, 300), 'Reprise de votre description.'),
    technologies: technologies.map((item) =>
      hypothese(item, `Cohérent avec une complexité technique ${feminine(levelWord(sector.techComplexity))} (indice ${sector.techComplexity}/100).`),
    ),
    equipment: equipment.map((item) =>
      hypothese(item, 'Liste indicative, sans chiffrage : les montants relèvent du Financial Check.'),
    ),
    premises: hypothese(
      budgetScore >= 60
        ? 'Un local ou un espace de travail dédié est envisageable dès le lancement.'
        : 'Privilégier un démarrage à distance ou en espace partagé pour limiter les charges fixes.',
      'Hypothèse de travail, à ajuster selon vos contraintes réelles.',
    ),
    suppliers: [
      hypothese('Identifier deux fournisseurs ou prestataires par brique critique pour éviter la dépendance unique.'),
      hypothese('Comparer les coûts et les délais avant tout engagement pluriannuel.'),
    ],
    process: process.map((step) => hypothese(step)),
    constraints: constraints.map((item) => hypothese(item)),
    scalability: hypothese(
      `La capacité de passage à l'échelle du secteur est ${feminine(levelWord(sector.scalability))} (indice ${sector.scalability}/100). ` +
        'La solution technique doit être testée sur un volume pilote avant l’élargissement.',
    ),
  };
}

// ---------------------------------------------------------------------------
// 5. Etude organisationnelle
// ---------------------------------------------------------------------------

export function buildOrganization(ctx: StudyContext): OrganizationSection {
  const { sector, market } = ctx;
  const budgetScore = ctx.budgetScore ?? 50;

  const roles: OrganizationSection['roles'] = [
    {
      role: 'Porteur de projet / direction',
      mission: 'Vision, pilotage global, relation avec les partenaires et décisions d’investissement.',
      priority: 'haute',
      source: 'hypothese',
    },
    {
      role: 'Commercial et marketing',
      mission: 'Acquisition, discours commercial, suivi des prospects et fidélisation.',
      priority: 'haute',
      source: 'hypothese',
    },
    {
      role: 'Produit ou technique',
      mission: 'Conception, mise en œuvre et maintien de la solution.',
      priority: sector.techComplexity >= 50 ? 'haute' : 'moyenne',
      source: 'hypothese',
    },
    {
      role: 'Administration et finances',
      mission: 'Facturation, suivi de trésorerie, obligations administratives et reporting.',
      priority: 'moyenne',
      source: 'hypothese',
    },
    {
      role: 'Support et opérations',
      mission: 'Traitement des demandes, qualité de service et amélioration continue.',
      priority: 'basse',
      source: 'hypothese',
    },
  ];

  return {
    key: 'organisation',
    title: 'Étude organisationnelle',
    team: hypothese(
      budgetScore >= 60
        ? 'Une équipe de 2 à 3 personnes peut couvrir le lancement : direction, commercial et produit ou opérations.'
        : 'Le lancement doit reposer sur une équipe très resserrée, avec externalisation des fonctions non critiques.',
      'Hypothèse de dimensionnement, sans analyse des profils disponibles.',
    ),
    roles,
    skills: [
      hypothese('Maîtrise du parcours client et de la vente directe.'),
      hypothese('Capacité à suivre les indicateurs financiers et commerciaux.'),
      hypothese(
        sector.techComplexity >= 50
          ? 'Compétence technique interne ou prestataire fiable pour la solution.'
          : 'Utilisation autonome des outils numériques de gestion.',
      ),
    ],
    partners: [
      hypothese(
        `Dispositif public mobilisable sur le marché ${market.label} : ${market.supportProgram}.`,
        'Information issue du catalogue heuristique, à vérifier auprès de l’organisme.',
      ),
      hypothese('Identifier un partenaire commercial ou un prescripteur capable d’apporter les premiers clients.'),
    ],
    management: hypothese(
      'Mettre en place un rituel de pilotage hebdomadaire : ventes, trésorerie, risques et décisions en attente.',
    ),
    legal: hypothese(
      sector.regulation >= 50
        ? `Le secteur ${sector.label} présente une lourdeur réglementaire ${feminine(levelWord(sector.regulation))} : le statut et les obligations doivent être validés avant le lancement.`
        : `La lourdeur réglementaire du secteur ${sector.label} est ${feminine(levelWord(sector.regulation))} : vérifier néanmoins les obligations de base (statut, contrats, données personnelles).`,
      'Indice sectoriel heuristique, sans revue juridique.',
    ),
  };
}

// ---------------------------------------------------------------------------
// 6. Etude financiere (copie figee du Financial Check)
// ---------------------------------------------------------------------------

export function buildFinance(ctx: StudyContext): FinanceSection {
  const financial = ctx.financial;

  if (!financial) {
    return {
      key: 'finance',
      title: 'Étude financière',
      available: false,
      financialCheckId: null,
      capturedAt: null,
      currency: 'MAD',
      summary: calcule(
        'Aucune donnée financière n’est disponible pour ce projet.',
        'Aucun chiffre n’est inventé en l’absence de Financial Check.',
      ),
      input: null,
      computed: null,
      health: null,
      scenarios: [],
      warnings: [],
      missingNotice: calcule(
        'Complétez le module Financial Check (investissement initial, prix de vente, volumes, charges fixes et coûts variables) pour que cette section affiche des chiffres réels. ' +
          'La composante Finance est omise du score de faisabilité et les poids restants sont renormalisés.',
        'Aucune projection financière n’est produite sans données saisies.',
      ),
    };
  }

  const summary = calcule(
    `Santé financière : ${financial.health.label} (${financial.health.score}/100). ` +
      `Chiffre d'affaires mensuel : ${formatMAD(financial.computed.monthlyRevenue)}. ` +
      `Résultat mensuel : ${formatMAD(financial.computed.monthlyResult)}. ` +
      `Marge nette annuelle : ${formatPercent(financial.computed.netMarginRate)}. ` +
      `ROI annuel : ${formatPercent(financial.computed.roiAnnual)}.`,
    `Copie figée du Financial Check du ${formatDateFr(financial.createdAt)} : aucune valeur n’est recalculée ici.`,
  );

  return {
    key: 'finance',
    title: 'Étude financière',
    available: true,
    financialCheckId: financial.id,
    capturedAt: financial.createdAt,
    currency: financial.currency,
    summary,
    input: financial.input,
    computed: financial.computed,
    health: financial.health,
    scenarios: financial.scenarios,
    warnings: financial.warnings,
    missingNotice: null,
  };
}

// ---------------------------------------------------------------------------
// 7. Risques / 8. Plan d'action
// ---------------------------------------------------------------------------

export function buildRisksSection(intro: string): RisksSection {
  return {
    key: 'risques',
    title: 'Analyse des risques',
    intro: hypothese(
      intro,
      'Probabilités et impacts sont des hypothèses déterministes, pas des mesures statistiques.',
    ),
  };
}

export function buildActionPlanSection(status: StudyStatus): ActionPlanSection {
  const focus =
    status === 'viable'
      ? 'Le projet est jugé viable : la feuille de route vise à sécuriser le lancement puis à accélérer.'
      : status === 'viable_sous_conditions'
        ? 'Le projet est viable sous conditions : les premiers mois doivent lever les réserves identifiées.'
        : 'Le projet doit être retravaillé : les premières semaines servent à valider le besoin et le modèle économique avant tout engagement lourd.';

  return {
    key: 'plan_action',
    title: 'Plan d’action',
    intro: hypothese(
      `${focus} Les horizons et indicateurs ci-dessous sont des repères de travail, pas des engagements contractuels.`,
    ),
  };
}

// ---------------------------------------------------------------------------
// 9. Conclusion
// ---------------------------------------------------------------------------

export function buildConclusion(
  ctx: StudyContext,
  status: StudyStatus,
  score: number,
  risks: StudyRisk[],
): ConclusionSection {
  const { analysis } = ctx;
  const criticalRisks = risks.filter((risk) => risk.level === 'critique' || risk.level === 'eleve');

  const strengths = analysis.swot.strengths
    .slice(0, 4)
    .map((item) =>
      sourced(item, ctx.swotSource, ctx.swotSource === 'ia' ? 'Produit par le modèle de langage.' : 'Déduit des scores calculés.'),
    );

  const weaknesses = analysis.swot.weaknesses
    .slice(0, 4)
    .map((item) =>
      sourced(item, ctx.swotSource, ctx.swotSource === 'ia' ? 'Produit par le modèle de langage.' : 'Déduit des scores calculés.'),
    );

  const successConditions: StudyText[] = [
    hypothese('Confirmer le besoin auprès de clients réels avant d’engager les dépenses principales.'),
    hypothese('Maintenir un suivi mensuel des indicateurs commerciaux et financiers.'),
  ];

  if (!ctx.financial) {
    successConditions.push(
      calcule(
        'Compléter le Financial Check pour disposer d’un modèle économique chiffré.',
        'Condition indispensable à toute décision d’investissement.',
      ),
    );
  } else if (ctx.financial.health.status !== 'solide') {
    successConditions.push(
      calcule(
        `Améliorer la santé financière (${ctx.financial.health.score}/100, statut « ${ctx.financial.health.label.toLowerCase()} ») avant d’augmenter les volumes.`,
      ),
    );
  }

  if (criticalRisks.length > 0) {
    successConditions.push(
      hypothese(
        `Traiter en priorité les ${criticalRisks.length} risque(s) élevé(s) ou critique(s) : ${criticalRisks.map((risk) => risk.categoryLabel.toLowerCase()).join(', ')}.`,
      ),
    );
  }

  const recommendationText =
    status === 'viable'
      ? `Poursuivre le projet : la note de viabilité (${analysis.globalScore}/100) et le score de faisabilité (${score}/100) permettent d’engager la phase de lancement, sous réserve du suivi des indicateurs.`
      : status === 'viable_sous_conditions'
        ? `Poursuivre le projet sous conditions : lever les réserves identifiées (${criticalRisks.length > 0 ? 'risques élevés, ' : ''}${ctx.financial ? 'santé financière' : 'absence de Financial Check'}) avant d’engager des dépenses irréversibles.`
        : `Retravailler le projet avant engagement : le score de faisabilité (${score}/100) et les réserves identifiées imposent de revoir le besoin, le modèle économique ou le financement.`;

  return {
    key: 'conclusion',
    title: 'Conclusion',
    status,
    statusLabel: STUDY_STATUS_LABELS[status],
    score,
    summary: calcule(
      `Niveau global de faisabilité : ${STUDY_STATUS_LABELS[status]} (${score}/100). ` +
        `Le projet conserve une note de viabilité de ${analysis.globalScore}/100 et un niveau de risque ${analysis.riskLabel.toLowerCase()}.`,
      'Synthèse déterministe des scores existants.',
    ),
    strengths,
    weaknesses,
    successConditions,
    recommendation: calcule(recommendationText),
  };
}

/** Compte les niveaux de risque, utilise dans l'interface. */
export function countRiskLevels(risks: StudyRisk[]): Record<RiskLevelLabel, number> {
  return risks.reduce<Record<RiskLevelLabel, number>>(
    (acc, risk) => {
      acc[risk.level] += 1;
      return acc;
    },
    { faible: 0, modere: 0, eleve: 0, critique: 0 },
  );
}
