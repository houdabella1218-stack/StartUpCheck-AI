/**
 * StartUpCheck AI - Analyse de texte deterministe.
 *
 * Aucune API externe : tout est calcule localement par correspondance de mots-cles
 * et par des mesures simples (longueur, densite, presence de chiffres).
 * Ces fonctions alimentent les criteres "qualite de la description",
 * "clarte du ciblage" et "signaux d'innovation".
 */

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime les accents
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countMatches(haystack: string, needles: string[]): number {
  let count = 0;
  for (const needle of needles) {
    if (haystack.includes(needle)) count += 1;
  }
  return count;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// Signaux d'innovation
// ---------------------------------------------------------------------------

type SignalGroup = { label: string; weight: number; words: string[] };

const INNOVATION_GROUPS: SignalGroup[] = [
  {
    label: 'intelligence artificielle',
    weight: 1.0,
    words: [
      'intelligence artificielle', 'ia', 'machine learning', 'apprentissage automatique',
      'algorithme', 'predictif', 'prediction', 'automatisation', 'automatise', 'automatique',
      'recommandation', 'personnalisation',
    ],
  },
  {
    label: 'plateforme de mise en relation',
    weight: 0.85,
    words: [
      'plateforme', 'marketplace', 'mise en relation', 'mettre en relation', 'communaut',
      'reseau', 'matching', 'intermediaire', 'place de marche',
    ],
  },
  {
    label: 'modele economique recurrent',
    weight: 0.75,
    words: ['abonnement', 'subscription', 'freemium', 'commission', 'recurrent', 'licence'],
  },
  {
    label: 'exploitation de la donnee',
    weight: 0.7,
    words: [
      'donnees', 'data', 'analytics', 'tableau de bord', 'dashboard', 'statistique',
      'suivi', 'reporting', 'kpi', 'indicateur',
    ],
  },
  {
    label: 'technologie de rupture',
    weight: 0.95,
    words: [
      'blockchain', 'iot', 'objet connecte', 'capteur', 'drone', 'realite virtuelle',
      'realite augmentee', 'api', 'cloud', 'saas', 'open source',
    ],
  },
  {
    label: 'impact environnemental ou social',
    weight: 0.7,
    words: [
      'durable', 'ecologique', 'vert', 'recycl', 'impact', 'responsable', 'circulaire',
      'inclusion', 'solidaire', 'carbone', 'economie d energie',
    ],
  },
  {
    label: 'mecaniques d engagement',
    weight: 0.6,
    words: ['gamification', 'recompense', 'fidelite', 'badge', 'jeu', 'communaute active'],
  },
  {
    label: 'mobilite et geolocalisation',
    weight: 0.6,
    words: ['geolocalisation', 'carte interactive', 'gps', 'mobilite', 'itineraire', 'trajet'],
  },
];

const DIFFERENTIATION_WORDS = [
  'unique', 'differen', 'inedit', 'exclusif', 'premiere', 'premier', 'innovant',
  'revolution', 'jamais vu', 'contrairement', 'seule', 'aucune solution',
];

const MODEL_WORDS = [
  'modele economique', 'revenu', 'chiffre d affaires', 'prix', 'tarif', 'abonnement mensuel',
  'commission', 'marge', 'rentab', 'cout d acquisition', 'monetisation', 'payant', 'gratuit',
  'business model', 'acheteur', 'vendeur',
];

const PROBLEM_WORDS = [
  'probleme', 'difficulte', 'manque', 'besoin', 'frein', 'obstacle', 'aujourd hui',
  'actuellement', 'perte', 'inefficac', 'complique', 'long', 'lent', 'cher',
];

const SOLUTION_WORDS = [
  'solution', 'permet', 'permet de', 'objectif', 'mission', 'application qui', 'service qui',
  'outil qui', 'plateforme qui', 'aide', 'facilite', 'centralise', 'connecte',
];

export type TextSignals = {
  /** 0-1 : intensite des signaux d'innovation detectes */
  innovationScore: number;
  /** 0-1 : capacite du porteur a se differencier */
  differentiationScore: number;
  /** 0-100 : qualite et structuration de la description */
  descriptionQuality: number;
  /** 0-100 : precision du ciblage client */
  targetClarity: number;
  /** 0-1 : maturite du modele economique decrit */
  businessModelScore: number;
  /** Libelles des signaux d'innovation identifies */
  innovationLabels: string[];
};

export function analyzeDescription(description: string): {
  innovationScore: number;
  differentiationScore: number;
  descriptionQuality: number;
  businessModelScore: number;
  innovationLabels: string[];
} {
  const text = normalize(description);
  const words = text.split(' ').filter(Boolean);

  // --- Innovation ---------------------------------------------------------
  let rawPoints = 0;
  const innovationLabels: string[] = [];
  for (const group of INNOVATION_GROUPS) {
    if (countMatches(text, group.words) > 0) {
      rawPoints += group.weight;
      innovationLabels.push(group.label);
    }
  }
  const innovationScore = Math.min(1, rawPoints / 2.4);

  // --- Differenciation ----------------------------------------------------
  const diffMatches = countMatches(text, DIFFERENTIATION_WORDS);
  const differentiationScore = Math.min(1, diffMatches / 2);

  // --- Modele economique --------------------------------------------------
  const modelMatches = countMatches(text, MODEL_WORDS);
  const businessModelScore = Math.min(1, modelMatches / 3);

  // --- Qualite de la description -----------------------------------------
  // 1) volume d'information
  const lengthComponent = clamp((words.length - 15) / 85, 0, 1); // ~15 mots = 0, ~100 mots = 1
  // 2) structure du raisonnement : probleme -> solution -> modele
  const hasProblem = countMatches(text, PROBLEM_WORDS) > 0 ? 1 : 0;
  const hasSolution = countMatches(text, SOLUTION_WORDS) > 0 ? 1 : 0;
  const hasModel = modelMatches > 0 ? 1 : 0;
  const hasNumbers = /\d/.test(description) ? 1 : 0;
  const structureComponent = (hasProblem + hasSolution + hasModel + hasNumbers) / 4;

  const descriptionQuality = clamp(
    Math.round(28 + 42 * lengthComponent + 30 * structureComponent),
    10,
    100,
  );

  return { innovationScore, differentiationScore, descriptionQuality, businessModelScore, innovationLabels };
}

export function analyzeTargeting(targetClients: string): {
  targetClarity: number;
  isB2B: boolean;
  isB2C: boolean;
  segments: string[];
} {
  const text = normalize(targetClients);
  const words = text.split(' ').filter(Boolean);

  const segmentWords: Array<{ label: string; words: string[] }> = [
    { label: 'PME et TPE', words: ['pme', 'tpe', 'petite entreprise', 'artisan', 'commercant'] },
    { label: 'grandes entreprises', words: ['grande entreprise', 'grands comptes', 'multinationale', 'corporate'] },
    { label: 'etudiants et jeunes', words: ['etudiant', 'jeune', 'lyceen', 'diplome', 'stagiaire'] },
    { label: 'particuliers', words: ['particulier', 'grand public', 'menage', 'consommateur', 'b2c'] },
    { label: 'professionnels independants', words: ['independant', 'freelance', 'liberal', 'auto entrepreneur'] },
    { label: 'secteur public', words: ['public', 'administration', 'collectivite', 'ministere', 'commune'] },
    { label: 'ecoles et universites', words: ['ecole', 'universite', 'campus', 'etablissement', 'formation'] },
    { label: 'clients a l export', words: ['export', 'international', 'etranger', 'diaspora'] },
  ];

  const segments: string[] = [];
  for (const segment of segmentWords) {
    if (countMatches(text, segment.words) > 0) segments.push(segment.label);
  }

  const isB2B = /b2b|entreprise|professionnel|pme|societe|boutique|restaurant|clinique|cabinet/.test(text);
  const isB2C = /b2c|particulier|grand public|consommateur|etudiant|menage|jeune/.test(text);

  let score = 40;
  score += Math.min(3, segments.length) * 12; // segments identifies
  if (words.length >= 4) score += 8;
  if (words.length >= 9) score += 6;
  if (isB2B && isB2C) score += 6; // double cible explicite
  if (/\d/.test(targetClients)) score += 6; // tranche d'age, volume, etc.

  return {
    targetClarity: clamp(Math.round(score), 25, 100),
    isB2B,
    isB2C,
    segments,
  };
}

/**
 * Adequation budget / ticket d'entree du secteur.
 * Courbe exponentielle decroissante : renvoie une note 0-100.
 */
export function budgetAdequacy(budget: number, entryCost: number): {
  score: number;
  ratio: number;
  label: string;
} {
  const safeEntryCost = Math.max(1, entryCost);
  const ratio = Math.max(0, budget) / safeEntryCost;
  const score = clamp(Math.round(100 * (1 - Math.exp(-ratio / 1.1))), 5, 99);

  let label: string;
  if (ratio >= 3) label = 'Confortable';
  else if (ratio >= 1.5) label = 'Suffisant';
  else if (ratio >= 1) label = 'Juste';
  else if (ratio >= 0.5) label = 'Insuffisant';
  else label = 'Critique';

  return { score, ratio, label };
}

export { clamp };
