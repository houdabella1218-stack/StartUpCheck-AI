/**
 * StartUpCheck AI - Utilitaires de texte deterministes pour l'etude de projet.
 *
 * Aucune generation aleatoire : les memes donnees produisent toujours le meme
 * texte. Aucun chiffre de marche n'est invente ici.
 */

import type { StudySource, StudyText } from './types';

/** Normalise un texte : minuscules, sans accents, espaces compresses. */
export function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Decoupe un texte en phrases simples (ponctuation forte). */
export function splitSentences(input: string): string[] {
  return input
    .replace(/\r/g, '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

/**
 * Selectionne les phrases contenant au moins un mot-cle (sans accents).
 * Retourne null si aucune phrase ne correspond.
 */
export function pickSentences(input: string, keywords: string[], max = 2): string | null {
  const sentences = splitSentences(input);
  const selected: string[] = [];

  for (const sentence of sentences) {
    const normalized = normalize(sentence);
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      selected.push(ensurePeriod(sentence));
      if (selected.length >= max) {
        break;
      }
    }
  }

  return selected.length > 0 ? selected.join(' ') : null;
}

/** Tronque proprement un texte a une longueur maximale. */
export function truncate(input: string, maxLength: number): string {
  const clean = input.trim().replace(/\s+/g, ' ');
  if (clean.length <= maxLength) {
    return clean;
  }
  const cut = clean.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export function ensurePeriod(input: string): string {
  const clean = input.trim();
  if (clean.length === 0) {
    return clean;
  }
  return /[.!?…]$/.test(clean) ? clean : `${clean}.`;
}

export function capitalize(input: string): string {
  const clean = input.trim();
  if (clean.length === 0) {
    return clean;
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/** Bloc de texte source "saisie". */
export function saisie(text: string, note?: string): StudyText {
  return withNote({ text: ensurePeriod(text), source: 'saisie' }, note);
}

/** Bloc de texte source "saisie", sans ponctuation ajoutee (libelles courts). */
export function saisieLabel(text: string, note?: string): StudyText {
  return withNote({ text: text.trim(), source: 'saisie' }, note);
}

/** Bloc de texte source "calcule". */
export function calcule(text: string, note?: string): StudyText {
  return withNote({ text: ensurePeriod(text), source: 'calcule' }, note);
}

/** Bloc de texte source "hypothese". */
export function hypothese(text: string, note?: string): StudyText {
  return withNote({ text: ensurePeriod(text), source: 'hypothese' }, note);
}

function withNote(text: StudyText, note?: string): StudyText {
  return note ? { ...text, note } : text;
}

/** Libelle qualitatif d'un indice 0-100 (jamais presente comme une mesure). */
export function levelWord(value: number): string {
  if (value >= 75) {
    return 'très élevé';
  }
  if (value >= 55) {
    return 'élevé';
  }
  if (value >= 40) {
    return 'modéré';
  }
  if (value >= 25) {
    return 'faible';
  }
  return 'très faible';
}

/** Accorde un adjectif simple au feminin. */
export function feminine(word: string): string {
  return word
    .replace(/très élevé$/, 'très élevée')
    .replace(/(?<!très )élevé$/, 'élevée')
    .replace(/modéré$/, 'modérée')
    .replace(/faible$/, 'faible');
}

/** Formate un montant en dirhams, sans jamais inventer de valeur. */
export function formatMAD(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'non calculable';
  }
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${digits} DH`;
}

/** Formate un pourcentage deja exprime en ratio (0.42 -> 42,0 %). */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'non calculable';
  }
  return `${(value * 100).toFixed(decimals).replace('.', ',')} %`;
}

/** Compte les blocs de texte par source, pour le bandeau de transparence. */
export function countSources(value: unknown, counts: Record<StudySource, number>): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      countSources(item, counts);
    }
    return;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const source = record.source;
    if (
      typeof record.text === 'string' &&
      (source === 'saisie' || source === 'calcule' || source === 'hypothese' || source === 'ia')
    ) {
      counts[source] += 1;
    }
    for (const item of Object.values(record)) {
      if (item !== record.text) {
        countSources(item, counts);
      }
    }
  }
}
