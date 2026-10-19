import { Router } from 'express';
import { countAnalyses } from '../services/analysisService';
import { countFinancialChecks } from '../services/financialService';
import { isLlmConfigured } from '../services/llm';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  let analyses = 0;
  let financialChecks = 0;
  let database = 'ok';

  try {
    analyses = await countAnalyses();
    financialChecks = await countFinancialChecks();
  } catch {
    database = 'indisponible';
  }

  res.json({
    status: 'ok',
    service: 'StartUpCheck AI API',
    version: '1.0.0',
    database,
    analysesStockees: analyses,
    analysesFinancieres: financialChecks,
    llmConfigured: isLlmConfigured(),
    timestamp: new Date().toISOString(),
  });
});
