/**
 * Validation des entrées avec Zod.
 * Les clés de secteur et de marché sont vérifiées contre les barèmes réels.
 */

import { z } from 'zod';
import { MARKETS, SECTORS } from '../engine/catalog';

const sectorKeys = SECTORS.map((s) => s.key) as [string, ...string[]];
const marketKeys = MARKETS.map((m) => m.key) as [string, ...string[]];

export const analysisInputSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(2, 'Le nom du projet doit contenir au moins 2 caractères.')
    .max(80, 'Le nom du projet ne doit pas dépasser 80 caractères.'),

  description: z
    .string()
    .trim()
    .min(30, "Décrivez votre idée en au moins 30 caractères pour permettre l'analyse.")
    .max(3000, 'La description ne doit pas dépasser 3000 caractères.'),

  sector: z.enum(sectorKeys, {
    errorMap: () => ({ message: "Sélectionnez un secteur d'activité valide." }),
  }),

  market: z.enum(marketKeys, {
    errorMap: () => ({ message: 'Sélectionnez un marché cible valide.' }),
  }),

  targetClients: z
    .string()
    .trim()
    .min(3, 'Précisez la clientèle ciblée.')
    .max(400, 'La clientèle cible ne doit pas dépasser 400 caractères.'),

  budget: z
    .number({ invalid_type_error: 'Le budget doit être un nombre.' })
    .nonnegative('Le budget ne peut pas être négatif.')
    .max(5_000_000_000, 'Le budget saisi est hors limites.'),
});

export type AnalysisInputDto = z.infer<typeof analysisInputSchema>;

export const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});

/* -------------------------------------------------------------------------- */
/* Module "Financial Check"                                                   */
/* -------------------------------------------------------------------------- */

const MAX_AMOUNT = 1_000_000_000_000; // 1 000 milliards de DH : garde-fou
const MAX_UNITS = 100_000_000; // 100 millions de ventes / clients par mois

function amountField(label: string) {
  return z
    .number({ invalid_type_error: `${label} doit être un nombre.` })
    .finite(`${label} doit être un nombre fini.`)
    .nonnegative(`${label} ne peut pas être négatif.`)
    .max(MAX_AMOUNT, `${label} est hors limites.`);
}

/**
 * Les 5 hypotheses financieres saisies par l'utilisateur.
 * `.strict()` : toute cle inconnue est REJETEE. Sans cela, une faute de frappe
 * (ex. `unitPricee`) serait silencieusement ignoree et produirait un
 * enregistrement incomplet ou orphelin au lieu d'une erreur explicite.
 */
export const financialInputSchema = z
  .object({
    initialInvestment: amountField("L'investissement initial"),
    unitPrice: amountField('Le prix de vente moyen'),
    monthlyUnits: z
      .number({ invalid_type_error: 'Le nombre de ventes mensuelles doit être un nombre.' })
      .finite('Le nombre de ventes mensuelles doit être un nombre fini.')
      .nonnegative('Le nombre de ventes mensuelles ne peut pas être négatif.')
      .max(MAX_UNITS, 'Le nombre de ventes mensuelles est hors limites.'),
    fixedCostsMonthly: amountField('Les charges fixes mensuelles'),
    variableCostPerUnit: amountField('Le coût variable moyen par vente'),
  })
  .strict();

export type FinancialInputDto = z.infer<typeof financialInputSchema>;

/** Creation d'un Financial Check, optionnellement rattache a une analyse. */
export const financialCheckInputSchema = financialInputSchema.extend({
  analysisId: z.string().trim().min(1, "L'identifiant d'analyse est invalide.").optional(),
});

export type FinancialCheckInputDto = z.infer<typeof financialCheckInputSchema>;

/** Creation d'une analyse, avec hypotheses financieres optionnelles. */
export const createAnalysisSchema = analysisInputSchema.extend({
  financial: financialInputSchema.optional(),
});

export type CreateAnalysisDto = z.infer<typeof createAnalysisSchema>;

/**
 * Filtres de liste. `.strict()` : un nom de parametre errone
 * (ex. `?analysis=...` au lieu de `?analysisId=...`) renvoie 400
 * au lieu de retourner silencieusement l'integralite des enregistrements.
 */
export const financialListQuerySchema = z
  .object({
    analysisId: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(30),
  })
  .strict();

/* -------------------------------------------------------------------------- */
/* Module "Étude de projet"                                                   */
/* -------------------------------------------------------------------------- */

/** Generation ou previsualisation d'une etude pour une analyse existante. */
export const projectStudyCreateSchema = z
  .object({
    analysisId: z.string().trim().min(1, "L'identifiant d'analyse est invalide."),
  })
  .strict();

export type ProjectStudyCreateDto = z.infer<typeof projectStudyCreateSchema>;

/**
 * Filtres de liste. `.strict()` : un parametre errone renvoie 400 au lieu de
 * retourner silencieusement toutes les etudes.
 */
export const projectStudyListQuerySchema = z
  .object({
    analysisId: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(30),
  })
  .strict();

/**
 * Modification manuelle : uniquement des blocs de texte, identifies par leur
 * chemin. Les scores et les chiffres ne sont pas modifiables par cette route.
 */
export const projectStudyEditSchema = z
  .object({
    edits: z
      .array(
        z
          .object({
            path: z.string().trim().min(1, 'Le chemin du texte est requis.').max(200),
            text: z
              .string()
              .trim()
              .min(1, 'Le texte ne peut pas être vide.')
              .max(4000, 'Le texte ne doit pas dépasser 4000 caractères.'),
          })
          .strict(),
      )
      .min(1, 'Aucune modification fournie.')
      .max(200, 'Trop de modifications en une seule fois.'),
  })
  .strict();

export type ProjectStudyEditDto = z.infer<typeof projectStudyEditSchema>;
