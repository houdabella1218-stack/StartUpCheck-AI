/**
 * StartUpCheck AI - Feuille de route de l'etude de projet.
 *
 * Plan d'action deterministe sur 5 horizons. Les objectifs et indicateurs sont
 * des HYPOTHESES de travail, pas des engagements chiffres.
 */

import type { StudyContext } from './context';
import type { RoadmapAction, RoadmapStep, StudyStatus, StudyText } from './types';
import { calcule, hypothese, truncate } from './text';

const HORIZONS: Array<{ key: RoadmapStep['key']; label: string; period: string }> = [
  { key: 'j0_30', label: 'Cadrage et validation', period: 'Jours 0 à 30' },
  { key: 'j30_60', label: 'Prototype et offre', period: 'Jours 30 à 60' },
  { key: 'j60_90', label: 'Lancement pilote', period: 'Jours 60 à 90' },
  { key: 'm3_6', label: 'Consolidation', period: 'Mois 3 à 6' },
  { key: 'm6_12', label: 'Passage à l’échelle', period: 'Mois 6 à 12' },
];

function action(text: StudyText, priority: RoadmapAction['priority']): RoadmapAction {
  return { text, priority };
}

export function buildRoadmap(
  ctx: StudyContext,
  status: StudyStatus,
): RoadmapStep[] {
  const { analysis, financial } = ctx;
  const target = truncate(ctx.targetClients, 90);
  const firstRecommendation = analysis.recommendations[0];
  const secondRecommendation = analysis.recommendations[1];

  const validationAction = action(
    hypothese(`Réaliser 10 à 15 entretiens qualitatifs auprès de la cible « ${target} » pour confirmer le besoin.`),
    'haute',
  );

  const financialAction = financial
    ? action(
        calcule(
          'Confronter les hypothèses du Financial Check (prix, volumes, charges) aux retours clients et ajuster les paramètres si un écart significatif apparaît.',
          'Les chiffres restent ceux du Financial Check : aucune valeur n’est modifiée automatiquement.',
        ),
        'haute',
      )
    : action(
        calcule(
          'Compléter le module Financial Check (investissement, prix, volumes, charges) pour chiffrer le modèle économique.',
          'Aucune donnée financière n’est inventée en l’absence de Financial Check.',
        ),
        'haute',
      );

  const recommendationActions: RoadmapAction[] = [];
  if (firstRecommendation) {
    recommendationActions.push(
      action(
        calcule(
          `Mettre en œuvre la recommandation prioritaire « ${truncate(firstRecommendation.title, 120)} » : ${truncate(firstRecommendation.detail, 160)}`,
          'Reprise d’une recommandation déjà produite par le moteur d’analyse.',
        ),
        firstRecommendation.priority,
      ),
    );
  }
  if (secondRecommendation) {
    recommendationActions.push(
      action(
        calcule(
          `Traiter la recommandation « ${truncate(secondRecommendation.title, 120)} » : ${truncate(secondRecommendation.detail, 160)}`,
          'Reprise d’une recommandation déjà produite par le moteur d’analyse.',
        ),
        secondRecommendation.priority,
      ),
    );
  }

  const reframe = status === 'a_retravailler';

  const steps: RoadmapStep[] = [
    {
      key: 'j0_30',
      label: HORIZONS[0].label,
      period: HORIZONS[0].period,
      objectives: [
        hypothese(
          reframe
            ? 'Clarifier le problème adressé et reformuler la proposition de valeur avant tout engagement de dépenses.'
            : 'Valider le problème adressé et la proposition de valeur auprès de clients réels.',
        ),
        hypothese('Confirmer le modèle économique et les hypothèses de prix.'),
        hypothese('Sécuriser le socle administratif et juridique minimal.'),
      ],
      actions: [validationAction, financialAction, ...recommendationActions.slice(0, 1)],
      indicators: [
        hypothese('Nombre d’entretiens clients réalisés (objectif : 15).'),
        hypothese('Taux de confirmation du besoin par les personnes interrogées.'),
        calcule(
          financial
            ? 'Financial Check à jour : oui / non.'
            : 'Financial Check complété : oui / non.',
        ),
      ],
    },
    {
      key: 'j30_60',
      label: HORIZONS[1].label,
      period: HORIZONS[1].period,
      objectives: [
        hypothese('Construire une première version utilisable de l’offre (prototype ou pilote).'),
        hypothese('Tester le parcours client de bout en bout.'),
        hypothese('Fixer les premiers prix et conditions commerciales.'),
      ],
      actions: [
        action(hypothese('Développer ou assembler le prototype minimal couvrant le besoin principal.'), 'haute'),
        action(hypothese('Faire tester le prototype à 5 clients de la cible et corriger les frictions majeures.'), 'haute'),
        action(hypothese('Rédiger les conditions commerciales, la grille tarifaire et les contrats types.'), 'moyenne'),
        ...recommendationActions.slice(1, 2),
      ],
      indicators: [
        hypothese('Prototype testé par au moins 5 utilisateurs.'),
        hypothese('Nombre de frictions bloquantes identifiées et corrigées.'),
        hypothese('Grille tarifaire validée : oui / non.'),
      ],
    },
    {
      key: 'j60_90',
      label: HORIZONS[2].label,
      period: HORIZONS[2].period,
      objectives: [
        hypothese('Lancer une offre pilote sur un périmètre restreint.'),
        hypothese('Mesurer le coût d’acquisition et le taux de conversion réels.'),
        hypothese('Atteindre les premiers clients payants.'),
      ],
      actions: [
        action(hypothese('Ouvrir l’offre à un groupe pilote et suivre les indicateurs commerciaux hebdomadaires.'), 'haute'),
        action(hypothese('Mettre en place un tableau de suivi : prospects, conversions, revenus, coûts.'), 'haute'),
        action(
          financial
            ? calcule('Comparer les résultats réels du pilote au scénario réaliste du Financial Check.')
            : calcule('Chiffrer les résultats du pilote dans Financial Check dès les premières ventes.'),
          'moyenne',
        ),
        action(hypothese('Ajuster l’offre et le discours commercial à partir des retours du pilote.'), 'moyenne'),
      ],
      indicators: [
        hypothese('Nombre de clients payants au terme du pilote.'),
        hypothese('Coût d’acquisition client réel.'),
        hypothese('Taux de conversion prospect → client.'),
      ],
    },
    {
      key: 'm3_6',
      label: HORIZONS[3].label,
      period: HORIZONS[3].period,
      objectives: [
        hypothese('Stabiliser les processus de production ou de service.'),
        hypothese('Fidéliser les premiers clients et réduire le taux d’attrition.'),
        hypothese('Atteindre un niveau de revenus récurrents compatible avec les charges fixes.'),
      ],
      actions: [
        action(hypothese('Documenter les processus critiques et former les personnes impliquées.'), 'moyenne'),
        action(hypothese('Mettre en place un suivi de satisfaction et un rituel de recueil des retours.'), 'moyenne'),
        action(hypothese('Renforcer le canal d’acquisition le plus performant et abandonner les canaux non rentables.'), 'haute'),
        action(hypothese('Préparer les recrutements ou la sous-traitance nécessaires à la montée en charge.'), 'basse'),
      ],
      indicators: [
        hypothese('Taux de rétention à 3 mois.'),
        hypothese('Chiffre d’affaires mensuel récurrent.'),
        hypothese('Marge dégagée par client.'),
      ],
    },
    {
      key: 'm6_12',
      label: HORIZONS[4].label,
      period: HORIZONS[4].period,
      objectives: [
        hypothese('Étendre l’offre à un nouveau segment ou territoire.'),
        hypothese('Industrialiser les opérations sans dégrader la qualité de service.'),
        hypothese('Consolider la rentabilité et sécuriser la trésorerie.'),
      ],
      actions: [
        action(hypothese('Tester un deuxième segment ou une deuxième zone géographique à petite échelle.'), 'moyenne'),
        action(hypothese('Automatiser les tâches répétitives et formaliser les indicateurs de pilotage.'), 'moyenne'),
        action(hypothese('Constituer une réserve de trésorerie couvrant au moins 3 mois de charges fixes.'), 'haute'),
        action(hypothese('Réévaluer le positionnement et les prix à partir des données accumulées.'), 'basse'),
      ],
      indicators: [
        hypothese('Part du chiffre d’affaires issue du nouveau segment.'),
        hypothese('Trésorerie disponible en mois de charges fixes.'),
        hypothese('Évolution de la marge nette.'),
      ],
    },
  ];

  return steps;
}
