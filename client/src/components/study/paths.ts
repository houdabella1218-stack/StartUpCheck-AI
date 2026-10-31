import type { StudyRecord } from '@/types';

/**
 * Aplatit tous les blocs de texte de l'étude en `chemin → texte`.
 * Les chemins correspondent exactement à ceux acceptés par
 * `PATCH /api/project-studies/:id`.
 */
export function collectTextsByPath(study: StudyRecord): Record<string, string> {
  const map: Record<string, string> = {};

  study.sections.forEach((section, index) => {
    walk(`sections.${index}`, section, map);
  });
  study.risks.forEach((risk, index) => {
    walk(`risks.${index}`, risk, map);
  });
  study.roadmap.forEach((step, index) => {
    walk(`roadmap.${index}`, step, map);
  });

  return map;
}

function walk(prefix: string, value: unknown, map: Record<string, string>): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(`${prefix}.${index}`, item, map));
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.text === 'string' && typeof record.source === 'string') {
    map[prefix] = record.text;
    return;
  }

  for (const [key, item] of Object.entries(record)) {
    if (key === 'text' || key === 'source' || key === 'note') {
      continue;
    }
    walk(`${prefix}.${key}`, item, map);
  }
}
