/**
 * Service du module "Étude de projet".
 *
 * - previewProjectStudy   : generation SANS persistance ;
 * - createProjectStudy    : generation + persistance (version N+1) ;
 * - regenerateProjectStudy: nouvelle version a partir de l'analyse courante ;
 * - updateProjectStudy    : modification des textes uniquement ;
 * - lecture / suppression.
 *
 * Le moteur local est toujours la base. Le LLM ne peut que reformuler des
 * textes : jamais les scores ni les chiffres financiers. En cas d'absence de
 * configuration ou d'échec, le moteur local est utilisé silencieusement.
 */

import { applyStudyEdits, buildLocalStudy } from '../engine/project-study';
import type { StudyEdit } from '../engine/project-study';
import type {
  ProjectStudyRecord,
  ProjectStudySummary,
  StudyCore,
} from '../engine/project-study/types';
import type { AnalysisRecord } from '../engine/types';
import { prisma } from '../lib/prisma';
import { toProjectStudyRecord, toProjectStudySummary } from '../lib/dto';
import { getAnalysis } from './analysisService';
import { applyStudyRewrites, enrichStudyWithLlm } from './studyLlm';

/** Donnees Prisma pretes pour un `create`. */
export function toProjectStudyCreateData(core: StudyCore, version: number) {
  return {
    analysisId: core.analysisId,
    projectName: core.projectName,
    version,
    isCurrent: true,
    feasibilityStatus: core.feasibilityStatus,
    feasibilityScore: core.feasibilityScore,
    completenessScore: core.completenessScore,
    engine: core.meta.engine,
    methodologyVersion: core.meta.methodologyVersion,
    sectionsJson: JSON.stringify(core.sections),
    risksJson: JSON.stringify(core.risks),
    roadmapJson: JSON.stringify(core.roadmap),
    metaJson: JSON.stringify(core.meta),
  };
}

/**
 * Point d'entrée unique de génération.
 * Le moteur local produit toujours l'étude complète ; le LLM, s'il est
 * configuré, ne fait que reformuler certains textes. Toute erreur ou réponse
 * non conforme conduit à l'étude locale inchangée.
 */
export async function generateStudyCore(analysis: AnalysisRecord): Promise<StudyCore> {
  const local = buildLocalStudy(analysis);
  const enrichment = await enrichStudyWithLlm(local);
  if (!enrichment) {
    return local;
  }
  return applyStudyRewrites(local, enrichment.rewrites, enrichment.provider, enrichment.model);
}

export async function previewProjectStudy(analysisId: string): Promise<StudyCore | null> {
  const analysis = await getAnalysis(analysisId);
  if (!analysis) {
    return null;
  }
  return generateStudyCore(analysis);
}

export async function createProjectStudy(analysisId: string): Promise<ProjectStudyRecord | null> {
  const analysis = await getAnalysis(analysisId);
  if (!analysis) {
    return null;
  }
  const core = await generateStudyCore(analysis);
  return persistNewVersion(core);
}

/** Cree la version N+1 et desactive les versions precedentes. */
async function persistNewVersion(core: StudyCore): Promise<ProjectStudyRecord> {
  const last = await prisma.projectStudy.findFirst({
    where: { analysisId: core.analysisId },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const version = (last?.version ?? 0) + 1;

  // Transaction sous forme de tableau : atomique, et evite le typage du
  // callback `tx` (bug de typage Prisma 6.19 avec les modeles generes).
  const [, row] = await prisma.$transaction([
    prisma.projectStudy.updateMany({
      where: { analysisId: core.analysisId },
      data: { isCurrent: false },
    }),
    prisma.projectStudy.create({
      data: toProjectStudyCreateData(core, version),
    }),
  ]);

  return toProjectStudyRecord(row);
}

export async function regenerateProjectStudy(id: string): Promise<ProjectStudyRecord | null> {
  const existing = await prisma.projectStudy.findUnique({
    where: { id },
    select: { analysisId: true },
  });
  if (!existing) {
    return null;
  }
  return createProjectStudy(existing.analysisId);
}

export async function listProjectStudies(options: {
  analysisId?: string;
  limit?: number;
}): Promise<{ items: ProjectStudySummary[]; total: number }> {
  const where = options.analysisId ? { analysisId: options.analysisId } : undefined;

  const [rows, total] = await Promise.all([
    prisma.projectStudy.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { version: 'desc' }],
      take: options.limit ?? 30,
    }),
    prisma.projectStudy.count({ where }),
  ]);

  return { items: rows.map(toProjectStudySummary), total };
}

export async function getProjectStudy(id: string): Promise<ProjectStudyRecord | null> {
  const row = await prisma.projectStudy.findUnique({ where: { id } });
  return row ? toProjectStudyRecord(row) : null;
}

export async function getCurrentProjectStudy(
  analysisId: string,
): Promise<ProjectStudyRecord | null> {
  const row = await prisma.projectStudy.findFirst({
    where: { analysisId, isCurrent: true },
    orderBy: { version: 'desc' },
  });
  return row ? toProjectStudyRecord(row) : null;
}

export type UpdateStudyResult =
  | { ok: true; record: ProjectStudyRecord }
  | { ok: false; error: 'not_found' | 'invalid_path'; path?: string };

/**
 * Modification des textes. En "tout ou rien" : si un chemin est invalide,
 * rien n'est enregistre.
 */
export async function updateProjectStudy(
  id: string,
  edits: StudyEdit[],
): Promise<UpdateStudyResult> {
  const row = await prisma.projectStudy.findUnique({ where: { id } });
  if (!row) {
    return { ok: false, error: 'not_found' };
  }

  const record = toProjectStudyRecord(row);
  const result = applyStudyEdits(
    {
      sections: record.sections,
      risks: record.risks,
      roadmap: record.roadmap,
      meta: record.meta,
    },
    edits,
  );

  if (!result.ok) {
    return { ok: false, error: 'invalid_path', path: result.path };
  }

  const updated = await prisma.projectStudy.update({
    where: { id },
    data: {
      sectionsJson: JSON.stringify(result.value.sections),
      risksJson: JSON.stringify(result.value.risks),
      roadmapJson: JSON.stringify(result.value.roadmap),
      metaJson: JSON.stringify(result.value.meta),
    },
  });

  return { ok: true, record: toProjectStudyRecord(updated) };
}

export async function deleteProjectStudy(id: string): Promise<boolean> {
  const existing = await prisma.projectStudy.findUnique({
    where: { id },
    select: { id: true, analysisId: true, isCurrent: true },
  });
  if (!existing) {
    return false;
  }

  await prisma.projectStudy.delete({ where: { id } });

  // Si la version courante a ete supprimee, reactiver la plus recente.
  if (existing.isCurrent) {
    const latest = await prisma.projectStudy.findFirst({
      where: { analysisId: existing.analysisId },
      orderBy: { version: 'desc' },
      select: { id: true },
    });
    if (latest) {
      await prisma.projectStudy.update({
        where: { id: latest.id },
        data: { isCurrent: true },
      });
    }
  }

  return true;
}

export async function countProjectStudies(): Promise<number> {
  return prisma.projectStudy.count();
}
