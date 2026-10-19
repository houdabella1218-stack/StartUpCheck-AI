/**
 * StartUpCheck AI - Barèmes sectoriels et marchés.
 *
 * IMPORTANT (transparence) :
 * Ces valeurs sont des INDICES HEURISTIQUES, construits à partir d'ordres de
 * grandeur publics (intensité concurrentielle, lourdeur réglementaire, coût
 * d'entrée, dynamique de croissance, capacité de passage à l'échelle).
 * Ce ne sont PAS des données de marché auditées. Elles servent à produire une
 * analyse STRUCTURÉE et REPRODUCTIBLE, pas une étude de marché officielle.
 */

export type Sector = {
  key: string;
  label: string;
  emoji: string;
  /** Attractivité / taille relative du marché (0-100) */
  market: number;
  /** Dynamique de croissance du secteur (0-100) */
  growth: number;
  /** Ticket d'entrée indicatif pour un lancement crédible, en MAD */
  entryCost: number;
  /** Lourdeur réglementaire (0-100, + = plus lourd) */
  regulation: number;
  /** Complexité technique de mise en œuvre (0-100) */
  techComplexity: number;
  /** Capacité de passage à l'échelle (0-100) */
  scalability: number;
  /** Intensité concurrentielle (0-100, + = plus saturé) */
  competition: number;
  /** Petite description pédagogique du secteur */
  pitch: string;
  /** Tendances de fond du secteur (utilisées dans le SWOT) */
  trends: string[];
};

export type Market = {
  key: string;
  label: string;
  emoji: string;
  /** Maturité économique générale (0-100) */
  maturity: number;
  /** Pouvoir d'achat / capacité à payer (0-100) */
  purchasingPower: number;
  /** Adoption numérique (0-100) */
  digitalAdoption: number;
  /** Dynamisme / croissance du marché (0-100) */
  growth: number;
  /** Facilité à entreprendre (0-100, + = plus simple) */
  easeOfBusiness: number;
  /** Dispositif public utile (mentionné dans les opportunités) */
  supportProgram: string;
};

export const SECTORS: Sector[] = [
  {
    key: 'saas',
    label: 'Logiciel / SaaS',
    emoji: '💻',
    market: 80,
    growth: 85,
    entryCost: 150000,
    regulation: 35,
    techComplexity: 70,
    scalability: 95,
    competition: 78,
    pitch: 'Édition de logiciel vendu par abonnement.',
    trends: [
      'Migration massive des PME vers des outils cloud',
      "Passage du logiciel acheté au logiciel loué (abonnement)",
      "Intégration d'assistants IA dans les outils métier",
    ],
  },
  {
    key: 'ecommerce',
    label: 'E-commerce / Vente en ligne',
    emoji: '🛒',
    market: 88,
    growth: 70,
    entryCost: 100000,
    regulation: 50,
    techComplexity: 50,
    scalability: 85,
    competition: 92,
    pitch: 'Vente de produits ou de services via une boutique en ligne.',
    trends: [
      'Paiement mobile et paiement à la livraison toujours dominants',
      'Social commerce (vente via Instagram, TikTok, WhatsApp)',
      'Guerre des prix sur les catégories génériques',
    ],
  },
  {
    key: 'edtech',
    label: 'Éducation / EdTech',
    emoji: '🎓',
    market: 72,
    growth: 78,
    entryCost: 120000,
    regulation: 45,
    techComplexity: 55,
    scalability: 82,
    competition: 65,
    pitch: 'Formation, orientation, mise en relation étudiants-entreprises.',
    trends: [
      'Montée en puissance du lien université-entreprise',
      'Besoin croissant de compétences numériques',
      'Formations courtes et certifiantes fortement demandées',
    ],
  },
  {
    key: 'fintech',
    label: 'Finance / FinTech',
    emoji: '🏦',
    market: 85,
    growth: 88,
    entryCost: 400000,
    regulation: 85,
    techComplexity: 75,
    scalability: 90,
    competition: 80,
    pitch: 'Paiement, crédit, budget, assurance, gestion financière.',
    trends: [
      'Explosion du paiement mobile et des portefeuilles électroniques',
      'Bancarisation progressive et inclusion financière',
      'Ouverture des données bancaires (open banking)',
    ],
  },
  {
    key: 'healthtech',
    label: 'Santé / HealthTech',
    emoji: '🩺',
    market: 78,
    growth: 80,
    entryCost: 350000,
    regulation: 90,
    techComplexity: 78,
    scalability: 75,
    competition: 60,
    pitch: 'Télémédecine, suivi patient, gestion de cabinet, matériel médical.',
    trends: [
      'Développement de la téléconsultation',
      'Dossier patient numérique et interopérabilité',
      'Pénurie de spécialistes dans certaines régions',
    ],
  },
  {
    key: 'foodtech',
    label: 'Restauration / FoodTech',
    emoji: '🍽️',
    market: 82,
    growth: 68,
    entryCost: 200000,
    regulation: 75,
    techComplexity: 45,
    scalability: 62,
    competition: 85,
    pitch: 'Restauration, livraison de repas, produits alimentaires.',
    trends: [
      'Livraison de repas structurée par des plateformes',
      'Demande croissante de produits sains et traçables',
      'Digitalisation de la commande et de la fidélisation',
    ],
  },
  {
    key: 'agritech',
    label: 'Agriculture / AgriTech',
    emoji: '🌱',
    market: 75,
    growth: 74,
    entryCost: 300000,
    regulation: 60,
    techComplexity: 65,
    scalability: 58,
    competition: 50,
    pitch: 'Irrigation, capteurs, chaîne du froid, mise en marché des produits.',
    trends: [
      "Stress hydrique et besoin d'irrigation intelligente",
      "Traçabilité et valorisation à l'export",
      'Coopératives agricoles encore peu digitalisées',
    ],
  },
  {
    key: 'travel',
    label: 'Tourisme / Voyage',
    emoji: '✈️',
    market: 84,
    growth: 72,
    entryCost: 180000,
    regulation: 60,
    techComplexity: 48,
    scalability: 80,
    competition: 82,
    pitch: 'Réservation, expériences touristiques, hébergement, mobilité.',
    trends: [
      "Retour d'un fort volume de touristes internationaux",
      'Réservation en ligne encore fragmentée',
      "Demande d'expériences locales authentiques",
    ],
  },
  {
    key: 'logistics',
    label: 'Logistique / Transport',
    emoji: '🚚',
    market: 80,
    growth: 76,
    entryCost: 250000,
    regulation: 65,
    techComplexity: 55,
    scalability: 78,
    competition: 72,
    pitch: 'Livraison du dernier kilomètre, entreposage, fret.',
    trends: [
      'Croissance soutenue du e-commerce et donc de la livraison',
      'Optimisation des tournées par algorithmes',
      'Attentes de délais courts chez les clients finaux',
    ],
  },
  {
    key: 'retail',
    label: 'Commerce de détail',
    emoji: '🏬',
    market: 76,
    growth: 55,
    entryCost: 150000,
    regulation: 55,
    techComplexity: 35,
    scalability: 60,
    competition: 88,
    pitch: 'Boutique physique, franchise, distribution de produits.',
    trends: [
      'Convergence entre boutique physique et vente en ligne',
      'Pression forte sur les marges',
      'Fidélisation par la donnée client',
    ],
  },
  {
    key: 'services',
    label: 'Services aux entreprises',
    emoji: '🧩',
    market: 74,
    growth: 60,
    entryCost: 60000,
    regulation: 40,
    techComplexity: 25,
    scalability: 65,
    competition: 70,
    pitch: 'Conseil, comptabilité, RH, externalisation, freelancing organisé.',
    trends: [
      'Externalisation croissante de fonctions support',
      'Digitalisation des cabinets et des agences',
      'Recours accru aux talents indépendants',
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing / Médias',
    emoji: '📣',
    market: 77,
    growth: 65,
    entryCost: 80000,
    regulation: 35,
    techComplexity: 45,
    scalability: 82,
    competition: 85,
    pitch: 'Agence, influence, contenu, publicité, production audiovisuelle.',
    trends: [
      "Budget publicitaire qui bascule vers le digital et l'influence",
      "Production de contenu assistée par l'IA",
      'Attente de résultats mesurables par les annonceurs',
    ],
  },
  {
    key: 'industry',
    label: 'Industrie / Fabrication',
    emoji: '🏭',
    market: 79,
    growth: 62,
    entryCost: 800000,
    regulation: 70,
    techComplexity: 72,
    scalability: 68,
    competition: 55,
    pitch: 'Production, transformation, assemblage de biens.',
    trends: [
      'Relocalisation partielle de certaines productions',
      'Automatisation et robotisation des lignes',
      'Exigences croissantes sur la qualité et la traçabilité',
    ],
  },
  {
    key: 'energy',
    label: 'Énergie / Cleantech',
    emoji: '⚡',
    market: 83,
    growth: 84,
    entryCost: 900000,
    regulation: 80,
    techComplexity: 80,
    scalability: 70,
    competition: 58,
    pitch: 'Solaire, efficacité énergétique, recyclage, mobilité propre.',
    trends: [
      'Objectifs nationaux très ambitieux sur les énergies renouvelables',
      'Baisse continue du coût du solaire',
      'Financements verts de plus en plus accessibles',
    ],
  },
  {
    key: 'autre',
    label: 'Autre secteur',
    emoji: '🧭',
    market: 68,
    growth: 62,
    entryCost: 120000,
    regulation: 50,
    techComplexity: 50,
    scalability: 65,
    competition: 68,
    pitch: 'Secteur non listé : les indices appliqués sont des moyennes prudentes.',
    trends: [
      "Digitalisation générale des activités économiques",
      "Attente d'un service plus rapide et plus transparent",
    ],
  },
];

export const MARKETS: Market[] = [
  {
    key: 'maroc',
    label: 'Maroc',
    emoji: '🇲🇦',
    maturity: 62,
    purchasingPower: 55,
    digitalAdoption: 68,
    growth: 72,
    easeOfBusiness: 66,
    supportProgram: 'Dispositifs Innov Invest / Tamwilcom et accompagnement des startups',
  },
  {
    key: 'france',
    label: 'France',
    emoji: '🇫🇷',
    maturity: 88,
    purchasingPower: 88,
    digitalAdoption: 90,
    growth: 48,
    easeOfBusiness: 74,
    supportProgram: "Aides Bpifrance, crédit d'impôt recherche et réseaux d'incubateurs",
  },
  {
    key: 'espagne',
    label: 'Espagne',
    emoji: '🇪🇸',
    maturity: 82,
    purchasingPower: 78,
    digitalAdoption: 86,
    growth: 55,
    easeOfBusiness: 72,
    supportProgram: "Programmes ENISA et subventions régionales à l'innovation",
  },
  {
    key: 'tunisie',
    label: 'Tunisie',
    emoji: '🇹🇳',
    maturity: 58,
    purchasingPower: 50,
    digitalAdoption: 64,
    growth: 62,
    easeOfBusiness: 60,
    supportProgram: 'Programmes Smart Tunisia et Start-up Act',
  },
  {
    key: 'algerie',
    label: 'Algérie',
    emoji: '🇩🇿',
    maturity: 52,
    purchasingPower: 52,
    digitalAdoption: 60,
    growth: 58,
    easeOfBusiness: 55,
    supportProgram: "Agence nationale de l'appui à l'entrepreneuriat (ANADE)",
  },
  {
    key: 'senegal',
    label: 'Sénégal',
    emoji: '🇸🇳',
    maturity: 48,
    purchasingPower: 40,
    digitalAdoption: 55,
    growth: 76,
    easeOfBusiness: 58,
    supportProgram: 'Programmes DER/FJ et fonds de garantie dédiés aux jeunes entreprises',
  },
  {
    key: 'cote_ivoire',
    label: "Côte d'Ivoire",
    emoji: '🇨🇮',
    maturity: 50,
    purchasingPower: 42,
    digitalAdoption: 58,
    growth: 80,
    easeOfBusiness: 58,
    supportProgram: "Fonds de soutien à l'entrepreneuriat et incubateurs privés",
  },
  {
    key: 'egypte',
    label: 'Égypte',
    emoji: '🇪🇬',
    maturity: 55,
    purchasingPower: 45,
    digitalAdoption: 63,
    growth: 70,
    easeOfBusiness: 56,
    supportProgram: "Incubateurs technologiques et fonds souverains d'investissement",
  },
  {
    key: 'uae',
    label: 'Émirats arabes unis',
    emoji: '🇦🇪',
    maturity: 85,
    purchasingPower: 90,
    digitalAdoption: 92,
    growth: 74,
    easeOfBusiness: 80,
    supportProgram: "Zones franches, visas entrepreneur et fonds d'amorçage publics",
  },
  {
    key: 'arabie_saoudite',
    label: 'Arabie saoudite',
    emoji: '🇸🇦',
    maturity: 78,
    purchasingPower: 82,
    digitalAdoption: 85,
    growth: 80,
    easeOfBusiness: 72,
    supportProgram: "Programmes Vision 2030 et fonds d'investissement technologique",
  },
  {
    key: 'canada',
    label: 'Canada',
    emoji: '🇨🇦',
    maturity: 90,
    purchasingPower: 92,
    digitalAdoption: 92,
    growth: 50,
    easeOfBusiness: 82,
    supportProgram: "Programmes d'innovation IRAP et subventions provinciales",
  },
  {
    key: 'maghreb',
    label: 'Maghreb (régional)',
    emoji: '🌍',
    maturity: 58,
    purchasingPower: 52,
    digitalAdoption: 63,
    growth: 66,
    easeOfBusiness: 60,
    supportProgram: "Programmes régionaux d'appui à la PME et à l'innovation",
  },
  {
    key: 'afrique_subsaharienne',
    label: 'Afrique subsaharienne',
    emoji: '🌍',
    maturity: 42,
    purchasingPower: 35,
    digitalAdoption: 50,
    growth: 82,
    easeOfBusiness: 52,
    supportProgram: 'Fonds de développement et bailleurs internationaux',
  },
  {
    key: 'europe',
    label: 'Union européenne',
    emoji: '🇪🇺',
    maturity: 88,
    purchasingPower: 87,
    digitalAdoption: 91,
    growth: 47,
    easeOfBusiness: 76,
    supportProgram: "Programmes Horizon Europe et fonds d'innovation sectoriels",
  },
  {
    key: 'monde',
    label: 'International / mondial',
    emoji: '🌐',
    maturity: 70,
    purchasingPower: 65,
    digitalAdoption: 75,
    growth: 60,
    easeOfBusiness: 65,
    supportProgram: "Programmes internationaux d'accompagnement des startups",
  },
];

export const SECTOR_MAP: Record<string, Sector> = Object.fromEntries(
  SECTORS.map((s) => [s.key, s]),
);

export const MARKET_MAP: Record<string, Market> = Object.fromEntries(
  MARKETS.map((m) => [m.key, m]),
);

export const DEFAULT_SECTOR = SECTOR_MAP['autre'];
export const DEFAULT_MARKET = MARKET_MAP['monde'];
