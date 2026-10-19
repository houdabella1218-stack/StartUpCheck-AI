/**
 * Service du module "Financial Check".
 *
 * - previewFinancialCheck : calcul SANS persistance (simulateur live) ;
 * - createFinancialCheck  : calcul + persistance (rattachable a une analyse) ;
 * - lecture / suppression.
 *
 * Aucun appel LLM : le moteur financier est integralement deterministe.
 */

import { computeFinancialCheck } from '../engine/financial';
import type { FinancialCheckCore, FinancialCheckRecord, FinancialInput } from '../engine/financial/types';
import { prisma } from '../lib/prisma';
import { toFinancialRecord } from '../lib/dto';

/** Donnees Prisma pretes pour un `create` (ou `create` imbrique). */
export function toFinancialCreateData(core: FinancialCheckCore) {
  return {
    currency: core.currency,

    initialInvestment: core.input.initialInvestment,
    unitPrice: core.input.unitPrice,
    monthlyUnits: core.input.monthlyUnits,
    fixedCostsMonthly: core.input.fixedCostsMonthly,
    variableCostPerUnit: core.input.variableCostPerUnit,

    healthStatus: core.health.status,
    healthScore: core.health.score,

    monthlyResult: core.computed.monthlyResult,
    annualResult: core.computed.annualResult,
    contributionMarginRate: core.computed.contributionMarginRate,
    breakEvenRevenue: core.computed.breakEvenRevenue,
    breakEvenUnits: core.computed.breakEvenUnits,
    roiAnnual: core.computed.roiAnnual,
    paybackMonths: core.computed.paybackMonths,

    assumptionsJson: JSON.stringify(core.assumptions),
    computedJson: JSON.stringify(core.computed),
    scenariosJson: JSON.stringify(core.scenarios),
    metaJson: JSON.stringify({
      ...core.meta,
      warnings: core.warnings,
      health: core.health,
    }),
  };
}

/** Calcul complet, sans aucune ecriture en base (simulateur). */
export function previewFinancialCheck(input: FinancialInput): FinancialCheckCore {
  return computeFinancialCheck(input);
}

/** Calcule et persiste un Financial Check, optionnellement rattache a une analyse. */
export async function createFinancialCheck(
  input: FinancialInput,
  analysisId?: string | null,
): Promise<FinancialCheckRecord> {
  const core = computeFinancialCheck(input);

  const row = await prisma.financialCheck.create({
    data: {
      analysisId: analysisId ?? null,
      ...toFinancialCreateData(core),
    },
  });

  return toFinancialRecord(row);
}

export async function listFinancialChecks(options: {
  analysisId?: string;
  limit?: number;
}): Promise<{ items: FinancialCheckRecord[]; total: number }> {
  const where = options.analysisId ? { analysisId: options.analysisId } : undefined;

  // `total` = nombre reel d'enregistrements correspondant au filtre
  // (et non la taille de la page courante).
  const [rows, total] = await Promise.all([
    prisma.financialCheck.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit ?? 30,
    }),
    prisma.financialCheck.count({ where }),
  ]);

  return { items: rows.map(toFinancialRecord), total };
}

export async function getFinancialCheck(id: string): Promise<FinancialCheckRecord | null> {
  const row = await prisma.financialCheck.findUnique({ where: { id } });
  return row ? toFinancialRecord(row) : null;
}

export async function deleteFinancialCheck(id: string): Promise<boolean> {
  const existing = await prisma.financialCheck.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return false;
  await prisma.financialCheck.delete({ where: { id } });
  return true;
}

export async function countFinancialChecks(): Promise<number> {
  return prisma.financialCheck.count();
}
