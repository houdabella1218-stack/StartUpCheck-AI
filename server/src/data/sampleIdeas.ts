/**
 * Idées d'exemple, utilisées pour :
 *  - le bouton "Charger un exemple" du formulaire (via GET /api/meta) ;
 *  - le script de pré-remplissage de la base (`npm run seed`).
 */

import type { AnalysisInput } from '../engine/types';
import type { FinancialInput } from '../engine/financial/types';

export type SampleIdea = AnalysisInput & {
  id: string;
  tagline: string;
  /** Hypotheses financieres d'exemple (module Financial Check). */
  financial?: FinancialInput;
};

export const SAMPLE_IDEAS: SampleIdea[] = [
  {
    id: 'stageconnect',
    tagline: 'Mise en relation étudiants / entreprises (exemple de démonstration)',
    projectName: 'StageConnect',
    description:
      "StageConnect est une plateforme numérique qui met en relation les étudiants à la recherche de stages ou d'alternance avec les entreprises qui recrutent. Le problème actuel est que les candidatures se perdent dans des boîtes mail et que les étudiants n'ont aucun retour. Notre solution permet de créer un profil avec ses compétences, de recevoir automatiquement des offres correspondantes grâce à un algorithme de matching, et de suivre chaque candidature dans un tableau de bord. Le modèle économique repose sur un abonnement mensuel payant pour les entreprises (accès illimité aux profils) et un plan gratuit pour les étudiants. Les établissements d'enseignement peuvent souscrire une licence annuelle.",
    sector: 'edtech',
    market: 'maroc',
    targetClients:
      "Étudiants universitaires et jeunes diplômés (B2C), PME et startups qui recrutent (B2B), écoles et universités partenaires",
    budget: 150000,
    financial: {
      initialInvestment: 150000,
      unitPrice: 500,
      monthlyUnits: 40,
      fixedCostsMonthly: 8000,
      variableCostPerUnit: 120,
    },
  },
  {
    id: 'fermeconnect',
    tagline: 'Irrigation intelligente pour petites exploitations (exemple)',
    projectName: 'FermeConnect',
    description:
      "FermeConnect propose des capteurs d'humidité du sol connectés et une application qui indique aux agriculteurs quand et combien irriguer. Le problème est le gaspillage d'eau et la baisse des rendements dans les zones soumises au stress hydrique. La solution associe un capteur autonome à faible coût, une application mobile simple en arabe et français, et des alertes. Le modèle repose sur la vente du matériel puis un abonnement annuel de service. Une offre de financement en plusieurs fois est prévue avec les coopératives agricoles.",
    sector: 'agritech',
    market: 'maroc',
    targetClients: "Petites et moyennes exploitations agricoles, coopératives agricoles, sociétés d'agro-industrie",
    budget: 60000,
    financial: {
      initialInvestment: 60000,
      unitPrice: 350,
      monthlyUnits: 60,
      fixedCostsMonthly: 6000,
      variableCostPerUnit: 150,
    },
  },
  {
    id: 'payflow',
    tagline: "Paiement et gestion de trésorerie pour commerçants (exemple)",
    projectName: 'PayFlow',
    description:
      "PayFlow est une solution de paiement et de gestion de trésorerie destinée aux petits commerçants. Le problème est que beaucoup de commerçants encaissent en espèces sans aucun historique, ce qui rend la gestion et l'accès au crédit difficiles. La solution combine un terminal de paiement mobile, une application de suivi des ventes en temps réel et un tableau de bord de trésorerie. Le modèle économique repose sur une commission sur transaction et un abonnement premium avec analytics avancés.",
    sector: 'fintech',
    market: 'senegal',
    targetClients: 'Petits commerçants et TPE, prestataires indépendants, micro-entrepreneurs',
    budget: 200000,
    financial: {
      initialInvestment: 200000,
      unitPrice: 90,
      monthlyUnits: 900,
      fixedCostsMonthly: 25000,
      variableCostPerUnit: 35,
    },
  },
];
