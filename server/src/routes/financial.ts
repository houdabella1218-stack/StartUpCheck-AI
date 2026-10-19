import { Router } from 'express';
import {
  financialCheckInputSchema,
  financialListQuerySchema,
  financialInputSchema,
} from '../lib/validation';
import {
  createFinancialCheck,
  deleteFinancialCheck,
  getFinancialCheck,
  listFinancialChecks,
  previewFinancialCheck,
} from '../services/financialService';
import { analysisExists } from '../services/analysisService';
import type { ZodError } from 'zod';

export const financialRouter = Router();

/** Format de reponse d'erreur de validation, identique au reste de l'API. */
function validationError(error: ZodError) {
  return {
    error: 'VALIDATION_ERROR',
    message: 'Certaines informations financières sont invalides.',
    details: error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    })),
  };
}

/**
 * POST /api/financial-checks/preview
 * Calcule une analyse financiere SANS la persister (simulateur live).
 * Doit etre declare avant les routes parametrees.
 */
financialRouter.post('/preview', (req, res, next) => {
  try {
    const parsed = financialInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(validationError(parsed.error));
    }
    return res.json(previewFinancialCheck(parsed.data));
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/financial-checks
 * Calcule et enregistre un Financial Check (rattache a une analyse si fourni).
 */
financialRouter.post('/', async (req, res, next) => {
  try {
    const parsed = financialCheckInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(validationError(parsed.error));
    }

    const { analysisId, ...input } = parsed.data;

    if (analysisId) {
      const exists = await analysisExists(analysisId);
      if (!exists) {
        return res.status(404).json({
          error: 'ANALYSIS_NOT_FOUND',
          message: "L'analyse à laquelle rattacher ces chiffres est introuvable.",
        });
      }
    }

    const record = await createFinancialCheck(input, analysisId ?? null);
    return res.status(201).json(record);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/financial-checks?analysisId=...&limit=...
 */
financialRouter.get('/', async (req, res, next) => {
  try {
    const query = financialListQuerySchema.safeParse(req.query);
    if (!query.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Paramètres de recherche invalides.',
        details: query.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'query',
          message: issue.message,
        })),
      });
    }

    const { items, total } = await listFinancialChecks(query.data);
    return res.json({ items, total });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/financial-checks/:id
 */
financialRouter.get('/:id', async (req, res, next) => {
  try {
    const record = await getFinancialCheck(req.params.id);
    if (!record) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Analyse financière introuvable.',
      });
    }
    return res.json(record);
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/financial-checks/:id
 */
financialRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteFinancialCheck(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Analyse financière introuvable.',
      });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});
