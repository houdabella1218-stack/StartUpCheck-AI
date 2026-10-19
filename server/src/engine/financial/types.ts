/**
 * StartUpCheck AI - Module "Financial Check" (analyse financiere previsionnelle).
 *
 * Contrat de donnees du moteur financier.
 *
 * REGLE ABSOLUE : tous les calculs de ce module sont DETERMINISTES.
 * Aucun modele de langage (LLM) n'intervient dans les chiffres.
 */

/** Hypotheses saisies par l'utilisateur (devise MAD / DH). */
export type FinancialInput = {
  /** Investissement initial (DH) */
  initialInvestment: number;
  /** Prix de vente moyen par vente / client (DH) */
  unitPrice: number;
  /** Nombre de ventes ou de clients par mois */
  monthlyUnits: number;
  /** Charges fixes mensuelles (DH) */
  fixedCostsMonthly: number;
  /** Cout variable moyen par vente / client (DH) */
  variableCostPerUnit: number;
};

export type ScenarioKey = 'pessimiste' | 'realiste' | 'optimiste';

/**
 * Coefficients multiplicatifs appliques aux hypotheses saisies
 * pour construire un scenario. 1 = valeur saisie inchangee.
 */
export type ScenarioCoefficients = {
  volume: number;
  price: number;
  variableCost: number;
  fixedCosts: number;
  investment: number;
};

/** Resultat chiffre, mensuel et annuel. Toutes les valeurs sont des montants DH. */
export type FinancialComputed = {
  monthlyRevenue: number;
  annualRevenue: number;
  monthlyVariableCosts: number;
  annualVariableCosts: number;
  monthlyTotalCosts: number;
  annualTotalCosts: number;
  /** Marge sur couts variables (mensuelle) = CA - couts variables */
  contributionMargin: number;
  /** Taux de marge sur couts variables (0-1), 0 si le prix est nul */
  contributionMarginRate: number;
  /** Marge unitaire = prix - cout variable unitaire */
  unitMargin: number;
  monthlyResult: number;
  annualResult: number;
  /** Marge nette annuelle (0-1), null si le CA est nul */
  netMarginRate: number | null;
  /** Seuil de rentabilite en CA, null si non atteignable */
  breakEvenRevenue: number | null;
  /** Seuil de rentabilite en nombre de ventes, null si non atteignable */
  breakEvenUnits: number | null;
  /** ROI annuel (ratio, 0.5 = +50 %), null si aucun investissement initial */
  roiAnnual: number | null;
  /** Delai de recuperation en mois : 0 si aucun investissement, null si jamais atteint */
  paybackMonths: number | null;
  paybackYears: number | null;
  /** Marge de securite (0-1), null si non calculable */
  safetyMarginRate: number | null;
  /** L'activite degage-t-elle un resultat mensuel positif ? */
  isProfitable: boolean;
  /** Le seuil de rentabilite est-il calculable ? */
  breakEvenReachable: boolean;
};

export type FinancialHealthStatus = 'solide' | 'fragile' | 'risque' | 'non_rentable';

/** Facteur explique, pour la transparence du score de sante. */
export type FinancialHealthFactor = {
  label: string;
  /** Contribution au score brut (peut etre negative) */
  impact: number;
};

export type FinancialHealth = {
  /** Score 0-100, TOUJOURS borne. */
  score: number;
  status: FinancialHealthStatus;
  label: string;
  summary: string;
  factors: FinancialHealthFactor[];
};

/** Hypothese chiffree lisible, affichee dans l'interface. */
export type ScenarioAssumption = {
  label: string;
  detail: string;
};

export type FinancialScenario = {
  key: ScenarioKey;
  label: string;
  description: string;
  coefficients: ScenarioCoefficients;
  /** Hypotheses documentees, affichees telles quelles a l'utilisateur. */
  assumptions: ScenarioAssumption[];
  /** Hypotheses derivees apres application des coefficients. */
  input: FinancialInput;
  computed: FinancialComputed;
  health: FinancialHealth;
};

export type FinancialAssumptions = {
  scenarioCoefficients: Record<ScenarioKey, ScenarioCoefficients>;
  /** Notes generales affichees dans l'interface et le README. */
  notes: string[];
};

export type FinancialEngineMeta = {
  engine: 'financial-deterministic';
  engineLabel: string;
  engineNotice: string;
  /** Avertissement legal : projections, pas un conseil financier. */
  disclaimer: string;
  methodologyVersion: string;
  generatedAt: string;
};

export type FinancialCheckCore = {
  currency: string;
  input: FinancialInput;
  computed: FinancialComputed;
  health: FinancialHealth;
  scenarios: FinancialScenario[];
  assumptions: FinancialAssumptions;
  /** Alertes de saisie (jamais un chiffre invente : seulement des avertissements). */
  warnings: string[];
  meta: FinancialEngineMeta;
};

export type FinancialCheckRecord = FinancialCheckCore & {
  id: string;
  analysisId: string | null;
  createdAt: string;
};
