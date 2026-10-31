/**
 * StartUpCheck AI - Edition manuelle de l'etude de projet.
 *
 * L'utilisateur peut modifier les TEXTES de l'etude. Il ne peut jamais
 * modifier un score, un chiffre financier ou une probabilite : seules les
 * cibles qui sont des blocs de texte (StudyText) sont acceptees.
 *
 * Toute modification est requalifiee en source "saisie" : elle ne provient
 * plus du moteur ni d'un modele de langage.
 */

import type { StudyCore, StudyMeta, StudyText } from './types';
import { countSources, ensurePeriod } from './text';

export type StudyEdit = {
  /** Chemin vers un bloc de texte, ex. "sections.0.summary" */
  path: string;
  /** Nouveau texte */
  text: string;
};

export type StudyEditable = {
  sections: StudyCore['sections'];
  risks: StudyCore['risks'];
  roadmap: StudyCore['roadmap'];
  meta: StudyMeta;
};

export type ApplyEditsResult =
  | { ok: true; value: StudyEditable }
  | { ok: false; path: string };

const FORBIDDEN_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

function isStudyText(value: unknown): value is StudyText {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.text === 'string' && typeof candidate.source === 'string';
}

function resolve(root: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = root;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (FORBIDDEN_SEGMENTS.has(part)) {
      return undefined;
    }
    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Resout un chemin vers un bloc de texte. Retourne null si le chemin est
 * invalide ou ne pointe pas sur un StudyText.
 */
export function resolveStudyText(root: unknown, path: string): StudyText | null {
  const value = resolve(root, path);
  return isStudyText(value) ? value : null;
}

/**
 * Applique les modifications en "tout ou rien" : si un seul chemin est
 * invalide, aucune modification n'est appliquee.
 */
export function applyStudyEdits(editable: StudyEditable, edits: StudyEdit[]): ApplyEditsResult {
  const clone = JSON.parse(JSON.stringify(editable)) as StudyEditable;

  const targets: StudyText[] = [];
  for (const edit of edits) {
    const target = resolveStudyText(clone, edit.path);
    if (!target) {
      return { ok: false, path: edit.path };
    }
    targets.push(target);
  }

  edits.forEach((edit, index) => {
    const target = targets[index];
    target.text = ensurePeriod(edit.text);
    target.source = 'saisie';
    target.note = 'Texte modifié manuellement.';
  });

  const dataSources = { saisie: 0, calcule: 0, hypothese: 0, ia: 0 };
  countSources(
    { sections: clone.sections, risks: clone.risks, roadmap: clone.roadmap },
    dataSources,
  );
  clone.meta.dataSources = dataSources;
  clone.meta.lastEditedAt = new Date().toISOString();

  const warning =
    'Certains textes ont été modifiés manuellement : ils ne proviennent plus du moteur.';
  if (!clone.meta.warnings.includes(warning)) {
    clone.meta.warnings.push(warning);
  }

  return { ok: true, value: clone };
}
