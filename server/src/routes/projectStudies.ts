import { Router } from 'express';
import {
  projectStudyCreateSchema,
  projectStudyEditSchema,
  projectStudyListQuerySchema,
} from '../lib/validation';
import {
  createProjectStudy,
  deleteProjectStudy,
  getCurrentProjectStudy,
  getProjectStudy,
  listProjectStudies,
  previewProjectStudy,
  regenerateProjectStudy,
  updateProjectStudy,
} from '../services/projectStudyService';
import type { ZodError } from 'zod';

export const projectStudiesRouter = Router();

function validationError(error: ZodError) {
  return {
    error: 'VALIDATION_ERROR',
    message: "Certaines informations de l'étude sont invalides.",
    details: error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    })),
  };
}

/**
 * POST /api/project-studies/preview
 * Genere une etude SANS la persister (aperçu avant enregistrement).
 * Doit etre declare avant les routes parametrees.
 */
projectStudiesRouter.post('/preview', async (req, res, next) => {
  try {
    const parsed = projectStudyCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(validationError(parsed.error));
    }

    const study = await previewProjectStudy(parsed.data.analysisId);
    if (!study) {
      return res.status(404).json({
        error: 'ANALYSIS_NOT_FOUND',
        message: "L'analyse à l'origine de l'étude est introuvable.",
      });
    }
    return res.json(study);
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/project-studies
 * Genere et enregistre une nouvelle version de l'etude.
 */
projectStudiesRouter.post('/', async (req, res, next) => {
  try {
    const parsed = projectStudyCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(validationError(parsed.error));
    }

    const record = await createProjectStudy(parsed.data.analysisId);
    if (!record) {
      return res.status(404).json({
        error: 'ANALYSIS_NOT_FOUND',
        message: "L'analyse à l'origine de l'étude est introuvable.",
      });
    }
    return res.status(201).json(record);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/project-studies?analysisId=...&limit=...
 */
projectStudiesRouter.get('/', async (req, res, next) => {
  try {
    const query = projectStudyListQuerySchema.safeParse(req.query);
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

    const { items, total } = await listProjectStudies(query.data);
    return res.json({ items, total });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/project-studies/current?analysisId=...
 * Version active pour une analyse (404 si aucune etude).
 */
projectStudiesRouter.get('/current', async (req, res, next) => {
  try {
    const query = projectStudyListQuerySchema.safeParse(req.query);
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

    if (!query.data.analysisId) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: "Le paramètre 'analysisId' est requis.",
        details: [{ field: 'analysisId', message: "Le paramètre 'analysisId' est requis." }],
      });
    }

    const record = await getCurrentProjectStudy(query.data.analysisId);
    if (!record) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: "Aucune étude de projet n'existe pour cette analyse.",
      });
    }
    return res.json(record);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/project-studies/:id
 */
projectStudiesRouter.get('/:id', async (req, res, next) => {
  try {
    const record = await getProjectStudy(req.params.id);
    if (!record) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Étude de projet introuvable.',
      });
    }
    return res.json(record);
  } catch (error) {
    return next(error);
  }
});

/**
 * PATCH /api/project-studies/:id
 * Modifie uniquement des blocs de texte (scores et chiffres non modifiables).
 */
projectStudiesRouter.patch('/:id', async (req, res, next) => {
  try {
    const parsed = projectStudyEditSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(validationError(parsed.error));
    }

    const result = await updateProjectStudy(req.params.id, parsed.data.edits);

    if (!result.ok && result.error === 'not_found') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Étude de projet introuvable.',
      });
    }

    if (!result.ok) {
      return res.status(400).json({
        error: 'INVALID_EDIT_PATH',
        message:
          "Ce chemin ne correspond pas à un bloc de texte modifiable. Les scores et les chiffres financiers ne sont pas modifiables.",
        details: [{ field: 'edits.path', message: `Chemin invalide : ${result.path}` }],
      });
    }

    return res.json(result.record);
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/project-studies/:id/regenerate
 * Genere une nouvelle version a partir de l'analyse actuelle.
 */
projectStudiesRouter.post('/:id/regenerate', async (req, res, next) => {
  try {
    const record = await regenerateProjectStudy(req.params.id);
    if (!record) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Étude de projet introuvable.',
      });
    }
    return res.status(201).json(record);
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/project-studies/:id
 */
projectStudiesRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteProjectStudy(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Étude de projet introuvable.',
      });
    }
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});
