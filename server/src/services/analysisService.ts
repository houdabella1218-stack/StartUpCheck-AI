/**
 * Service d'analyse : orchestre le moteur, la persistance et la lecture.
 */

import { analyzeIdea } from '../engine';
import type { FinancialInput } from '../engine/financial/types';
import type { AnalysisInput, AnalysisRecord, AnalysisSummary } from '../engine/types';
import { prisma } from '../lib/prisma';
import { toAnalysisRecord, toAnalysisSummary } from '../lib/dto';
import { computeFinancialCheck } from '../engine/financial';
import { toFinancialCreateData } from './financialService';

/** Inclusion Prisma des analyses financieres rattachees. */
export const ANALYSIS_FINANCIAL_INCLUDE = {
  financialChecks: { orderBy: { createdAt: 'desc' as const }, take: 1 },
};

export async function createAnalysis(
  input: AnalysisInput,
  financial?: FinancialInput,
): Promise<AnalysisRecord> {
  const result = await analyzeIdea(input);

  const financialData = financial
    ? toFinancialCreateData(computeFinancialCheck(financial))
    : null;

  const row = await prisma.analysis.create({
    data: {
      projectName: result.projectName,
      description: input.description,
      sector: input.sector,
      sectorLabel: result.sectorLabel,
      market: input.market,
      marketLabel: result.marketLabel,
      targetClients: input.targetClients,
      budget: input.budget,
      currency: 'MAD',
      globalScore: result.globalScore,
      verdict: result.verdict,
      verdictLabel: result.verdictLabel,
      riskLevel: result.riskLevel,
      engine: result.meta.engine,
      scoresJson: JSON.stringify(result.scores),
      swotJson: JSON.stringify(result.swot),
      recommendationsJson: JSON.stringify(result.recommendations),
      metaJson: JSON.stringify({ ...result.meta, verdictReason: result.verdictReason }),
      ...(financialData ? { financialChecks: { create: financialData } } : {}),
    },
    include: ANALYSIS_FINANCIAL_INCLUDE,
  });

  return toAnalysisRecord(row);
}

export async function listAnalyses(limit = 30): Promise<AnalysisSummary[]> {
  const rows = await prisma.analysis.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map(toAnalysisSummary);
}

export async function getAnalysis(id: string): Promise<AnalysisRecord | null> {
  const row = await prisma.analysis.findUnique({
    where: { id },
    include: ANALYSIS_FINANCIAL_INCLUDE,
  });
  return row ? toAnalysisRecord(row) : null;
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  const existing = await prisma.analysis.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return false;
  await prisma.analysis.delete({ where: { id } });
  return true;
}

export async function countAnalyses(): Promise<number> {
  return prisma.analysis.count();
}

/**
 * Verifie l'existence d'une analyse SANS charger son contenu
 * (utilise pour valider un rattachement financier).
 */
export async function analysisExists(id: string): Promise<boolean> {
  const row = await prisma.analysis.findUnique({ where: { id }, select: { id: true } });
  return Boolean(row);
}
