import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { analysesRouter } from './routes/analyses';
import { financialRouter } from './routes/financial';
import { healthRouter } from './routes/health';
import { metaRouter } from './routes/meta';

export function createApp() {
  const app = express();

  const allowedOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Autorise les outils sans origine (curl, tests) et les origines listées.
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, true); // projet local : on reste permissif
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req, res) => {
    res.json({
      service: 'StartUpCheck AI API',
      documentation: {
        health: 'GET /api/health',
        meta: 'GET /api/meta',
        create: 'POST /api/analyses',
        list: 'GET /api/analyses',
        detail: 'GET /api/analyses/:id',
        remove: 'DELETE /api/analyses/:id',
        financialPreview: 'POST /api/financial-checks/preview',
        financialCreate: 'POST /api/financial-checks',
        financialList: 'GET /api/financial-checks?analysisId=...',
        financialDetail: 'GET /api/financial-checks/:id',
        financialRemove: 'DELETE /api/financial-checks/:id',
      },
    });
  });

  app.use('/api/health', healthRouter);
  app.use('/api/meta', metaRouter);
  app.use('/api/analyses', analysesRouter);
  app.use('/api/financial-checks', financialRouter);

  // 404 JSON
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: `Route introuvable : ${req.method} ${req.originalUrl}`,
    });
  });

  // Gestionnaire d'erreurs centralisé
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[api] Erreur non gérée :', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: "Une erreur interne est survenue lors de l'analyse. Réessayez.",
    });
  });

  return app;
}
