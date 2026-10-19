import { Router } from 'express';
import { createAnalysisSchema, listQuerySchema } from '../lib/validation';
import {
  createAnalysis,
  deleteAnalysis,
  getAnalysis,
  listAnalyses,
} from '../services/analysisService';

export const analysesRouter = Router();

/**
 * POST /api/analyses
 * Crée une analyse : moteur déterministe + enrichissement éventuel, puis persistance.
 * Un bloc `financial` optionnel permet de créer simultanément l'analyse financière.
 */
analysesRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createAnalysisSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Certaines informations sont invalides.',
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'body',
          message: issue.message,
        })),
      });
    }

    const { financial, ...analysisInput } = parsed.data;
    const analysis = await createAnalysis(analysisInput, financial);
    return res.status(201).json(analysis);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/analyses
 * Historique des analyses (résumés), de la plus récente à la plus ancienne.
 */
analysesRouter.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.safeParse(req.query);
    const limit = query.success ? query.data.limit : 30;
    const analyses = await listAnalyses(limit);
    return res.json({ items: analyses, total: analyses.length });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/analyses/:id
 */
analysesRouter.get('/:id', async (req, res, next) => {
  try {
    const analysis = await getAnalysis(req.params.id);
    if (!analysis) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Analyse introuvable.',
      });
    }
    return res.json(analysis);
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/analyses/:id
 */
analysesRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteAnalysis(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Analyse introuvable.',
      });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});
