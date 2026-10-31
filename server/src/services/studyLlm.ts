/**
 * StartUpCheck AI - Reformulation optionnelle de l'étude de projet par LLM.
 *
 * Ce module est 100 % optionnel et isolé du moteur déterministe :
 *  - aucun LLM configuré  -> `enrichStudyWithLlm` renvoie null, le moteur local
 *    est utilisé tel quel ;
 *  - erreur réseau, délai, JSON invalide -> repli silencieux (null) ;
 *  - le LLM ne reçoit QUE des textes déjà rédigés et ne peut renvoyer QUE des
 *    reformulations de ces textes (liste blanche de chemins) ;
 *  - aucun chiffre nouveau n'est accepté : les nombres du texte reformulé
 *    doivent déjà être présents dans le texte source. Tout montant ou
 *    pourcentage introduit fait rejeter la réponse entière.
 *
 * Les scores, les risques et les chiffres financiers ne transitent jamais par
 * le LLM et ne sont jamais modifiés par ce module.
 */

import { z } from 'zod';
import { STUDY_ENGINE_NOTICE_LLM } from '../engine/project-study';
import { resolveStudyText } from '../engine/project-study/edits';
import { countSources, ensurePeriod } from '../engine/project-study/text';
import type {
  StudyCore,
  StudyMeta,
  StudySectionKey,
  StudySource,
} from '../engine/project-study/types';
import { getLlmConfig } from './llm';

// ---------------------------------------------------------------------------
// Champs reformulables (liste blanche)
// ---------------------------------------------------------------------------

export type StudyLlmField = {
  /** Chemin stable vers un StudyText, ex. "sections.0.summary" */
  id: string;
  /** Rôle du texte, transmis au modèle */
  label: string;
  /** Texte source (déterministe) */
  text: string;
};

type SectionFieldSpec = {
  key: StudySectionKey;
  field: string;
  label: string;
};

/**
 * Champs narratifs confiés au LLM. Les textes purement calculés (pricing,
 * finance, indicateurs) en sont volontairement exclus.
 */
const SECTION_FIELDS: SectionFieldSpec[] = [
  { key: 'presentation', field: 'summary', label: 'Résumé exécutif' },
  { key: 'presentation', field: 'problem', label: 'Problème adressé' },
  { key: 'presentation', field: 'solution', label: 'Solution proposée' },
  { key: 'marche', field: 'overview', label: "Vue d'ensemble du marché" },
  { key: 'marche', field: 'demand', label: 'Demande' },
  { key: 'marche', field: 'competition', label: 'Concurrence' },
  { key: 'commercial', field: 'valueProposition', label: 'Proposition de valeur' },
  { key: 'commercial', field: 'offer', label: 'Offre' },
  { key: 'commercial', field: 'communication', label: 'Communication' },
  { key: 'commercial', field: 'acquisition', label: 'Acquisition' },
  { key: 'commercial', field: 'retention', label: 'Fidélisation' },
  { key: 'technique', field: 'scalability', label: "Passage à l'échelle" },
  { key: 'organisation', field: 'team', label: 'Équipe' },
  { key: 'organisation', field: 'management', label: 'Management' },
  { key: 'organisation', field: 'legal', label: 'Cadre juridique' },
  { key: 'plan_action', field: 'intro', label: "Introduction du plan d'action" },
  { key: 'conclusion', field: 'summary', label: 'Synthèse de la conclusion' },
  { key: 'conclusion', field: 'recommendation', label: 'Recommandation finale' },
];

/**
 * Construit la liste des textes réellement présents dans l'étude.
 * Les chemins sont calculés à partir de l'ordre réel des sections, jamais
 * codés en dur.
 */
export function buildStudyLlmFields(study: StudyCore): StudyLlmField[] {
  const fields: StudyLlmField[] = [];

  for (const spec of SECTION_FIELDS) {
    const index = study.sections.findIndex((section) => section.key === spec.key);
    if (index < 0) {
      continue;
    }
    const path = `sections.${index}.${spec.field}`;
    const target = resolveStudyText(study, path);
    if (target) {
      fields.push({ id: path, label: spec.label, text: target.text });
    }
  }

  study.risks.forEach((risk, index) => {
    fields.push({
      id: `risks.${index}.mitigation`,
      label: `Plan de mitigation - ${risk.title}`,
      text: risk.mitigation.text,
    });
  });

  return fields;
}

// ---------------------------------------------------------------------------
// Garde-fou numérique
// ---------------------------------------------------------------------------

/** Unité monétaire ou pourcentage : jamais introduits par le LLM. */
const CURRENCY_OR_PERCENT = /(?:\d+(?:[.,]\d+)?\s*%)|(?:\bDH\b)|(?:\bMAD\b)|dirham|€|\$/i;

/** Présence d'une unité monétaire ou d'un pourcentage, même sans chiffre. */
const MONEY_OR_PERCENT_UNIT = /%|\bDH\b|\bMAD\b|dirham|€|\$/i;

/**
 * Extrait les nombres d'un texte sous forme normalisée, pour comparer le texte
 * source et sa reformulation : "150 000" -> "150000", "12,5" -> "12.5".
 */
export function numericTokens(input: string): string[] {
  const normalized = input
    .replace(/(\d)[\s\u00A0\u202F](?=\d{3}(?:\D|$))/g, '$1')
    .replace(/(\d),(\d)/g, '$1.$2');
  return normalized.match(/\d+(?:\.\d+)?/g) ?? [];
}

function consume(bag: Map<string, number>, token: string): boolean {
  const remaining = bag.get(token) ?? 0;
  if (remaining <= 0) {
    return false;
  }
  bag.set(token, remaining - 1);
  return true;
}

export type StudyRewriteRejectionReason =
  | 'unknown'
  | 'too_short'
  | 'unchanged'
  | 'new_numeric';

export type StudyRewriteValidation = {
  accepted: Record<string, string>;
  rejected: Array<{ id: string; reason: StudyRewriteRejectionReason }>;
  /** Un montant, un pourcentage ou une unité nouvelle a été détecté. */
  wholesaleRejected: boolean;
};

/**
 * Valide les reformulations renvoyées par le modèle.
 *
 * Règles :
 *  - un identifiant inconnu est ignoré (jamais appliqué) ;
 *  - un texte trop court ou identique à la source est ignoré ;
 *  - un nombre absent du texte source fait rejeter CE champ ;
 *  - un montant, un pourcentage ou une unité monétaire nouvelle fait rejeter
 *    la réponse ENTIÈRE.
 */
export function validateStudyRewrites(
  fields: StudyLlmField[],
  raw: Record<string, unknown>,
): StudyRewriteValidation {
  const byId = new Map(fields.map((field) => [field.id, field]));
  const accepted: Record<string, string> = {};
  const rejected: Array<{ id: string; reason: StudyRewriteRejectionReason }> = [];

  for (const [id, value] of Object.entries(raw)) {
    const field = byId.get(id);
    if (!field) {
      rejected.push({ id, reason: 'unknown' });
      continue;
    }
    if (typeof value !== 'string') {
      rejected.push({ id, reason: 'too_short' });
      continue;
    }

    const text = value.replace(/\s+/g, ' ').trim();
    if (text.length < 20) {
      rejected.push({ id, reason: 'too_short' });
      continue;
    }
    if (text === field.text.trim()) {
      rejected.push({ id, reason: 'unchanged' });
      continue;
    }

    // Une unité monétaire ou un pourcentage qui n'existe pas dans la source
    // constitue une donnée financière inventée : rejet global.
    if (MONEY_OR_PERCENT_UNIT.test(text) && !MONEY_OR_PERCENT_UNIT.test(field.text)) {
      rejected.push({ id, reason: 'new_numeric' });
      return { accepted: {}, rejected, wholesaleRejected: true };
    }

    const sourceBag = new Map<string, number>();
    for (const token of numericTokens(field.text)) {
      sourceBag.set(token, (sourceBag.get(token) ?? 0) + 1);
    }
    const introduced = numericTokens(text).filter((token) => !consume(sourceBag, token));

    if (introduced.length > 0) {
      if (CURRENCY_OR_PERCENT.test(text)) {
        rejected.push({ id, reason: 'new_numeric' });
        return { accepted: {}, rejected, wholesaleRejected: true };
      }
      rejected.push({ id, reason: 'new_numeric' });
      continue;
    }

    accepted[id] = ensurePeriod(text);
  }

  return { accepted, rejected, wholesaleRejected: false };
}

// ---------------------------------------------------------------------------
// Application des reformulations
// ---------------------------------------------------------------------------

/**
 * Applique les reformulations validées : chaque texte touché devient une
 * source "ia", et les métadonnées de transparence sont mises à jour.
 * Retourne l'étude d'origine si aucune reformulation n'a été appliquée.
 */
export function applyStudyRewrites(
  study: StudyCore,
  rewrites: Record<string, string>,
  provider: string,
  model: string,
): StudyCore {
  const clone = JSON.parse(JSON.stringify(study)) as StudyCore;
  let applied = 0;

  for (const [path, text] of Object.entries(rewrites)) {
    const target = resolveStudyText(clone, path);
    if (!target) {
      continue;
    }
    target.text = ensurePeriod(text);
    target.source = 'ia';
    target.note = `Reformulé par ${provider} (${model}) : texte non vérifié.`;
    applied += 1;
  }

  if (applied === 0) {
    return study;
  }

  const dataSources: Record<StudySource, number> = {
    saisie: 0,
    calcule: 0,
    hypothese: 0,
    ia: 0,
  };
  countSources(
    { sections: clone.sections, risks: clone.risks, roadmap: clone.roadmap },
    dataSources,
  );

  const warning =
    `Certains textes ont été reformulés par un modèle de langage (${provider} · ${model}) : ` +
    "ils sont marqués « IA » et n'ont pas été vérifiés. Les scores, les risques et les chiffres " +
    'financiers restent calculés localement.';

  const meta: StudyMeta = {
    ...clone.meta,
    engine: 'llm',
    engineLabel: `Moteur local + reformulation IA (${provider})`,
    engineNotice: STUDY_ENGINE_NOTICE_LLM,
    llmProvider: provider,
    llmModel: model,
    dataSources,
    warnings: [
      ...clone.meta.warnings.filter(
        (item) => !item.startsWith('Certains textes ont été reformulés par un modèle de langage'),
      ),
      warning,
    ],
  };
  clone.meta = meta;

  return clone;
}

// ---------------------------------------------------------------------------
// Appel LLM (une seule requête JSON structurée)
// ---------------------------------------------------------------------------

const responseSchema = z.object({
  textes: z.record(z.string(), z.string()),
});

export type StudyLlmEnrichment = {
  rewrites: Record<string, string>;
  provider: string;
  model: string;
};

const SYSTEM_PROMPT =
  'Tu produis uniquement du JSON valide, en français, sans balise Markdown. ' +
  'Tu ne produis jamais de chiffre, de montant, de pourcentage ni de donnée de marché nouveau.';

function readPresentation(study: StudyCore) {
  const section = study.sections.find((item) => item.key === 'presentation');
  if (!section || section.key !== 'presentation') {
    return null;
  }
  return section;
}

function buildPrompt(study: StudyCore, fields: StudyLlmField[]): string {
  const presentation = readPresentation(study);
  const finance = study.sections.find((item) => item.key === 'finance');

  const financeLine =
    finance && finance.key === 'finance' && finance.available
      ? `disponible (santé : ${finance.health?.label ?? 'non précisée'})`
      : 'absent (aucun chiffre financier ne doit être inventé)';

  const payload = fields.map((field) => ({
    id: field.id,
    role: field.label,
    texte: field.text,
  }));

  return `Tu es un rédacteur spécialisé en business plans. Tu reformules des textes DÉJÀ rédigés par un moteur déterministe. Tu ne produis aucune donnée nouvelle.

Contexte (déjà calculé, à ne pas modifier) :
- Projet : ${study.projectName}
- Secteur : ${presentation?.sector.text ?? 'non précisé'}
- Marché : ${presentation?.market.text ?? 'non précisé'}
- Clientèle cible : ${presentation?.targetClients.text ?? 'non précisée'}
- Faisabilité : ${study.feasibilityStatusLabel}
- Financial Check : ${financeLine}

Règles absolues :
1. Ne calcule, n'invente et ne modifie aucun chiffre, montant, pourcentage, score ou donnée de marché.
2. Tu peux conserver les chiffres déjà présents dans un texte source, mais tu ne dois en introduire aucun nouveau.
3. N'invente aucune statistique, taille de marché, part de marché ni prévision.
4. Reformule en français professionnel et concret, 1 à 3 phrases par texte.
5. Utilise exactement les identifiants fournis, sans en ajouter ni en retirer.
6. Réponds uniquement avec un JSON strict de la forme :
{ "textes": { "identifiant": "texte reformulé" } }

Textes à reformuler :
${JSON.stringify(payload, null, 2)}`;
}

/** Certains modèles encadrent le JSON par des balises Markdown. */
function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) {
    return trimmed.slice(first, last + 1);
  }
  return trimmed;
}

/**
 * Tente une reformulation par LLM. Renvoie null si aucun modèle n'est
 * configuré ou si la réponse n'est pas exploitable : l'appelant conserve alors
 * l'étude locale.
 */
export async function enrichStudyWithLlm(study: StudyCore): Promise<StudyLlmEnrichment | null> {
  const config = getLlmConfig();
  if (!config) {
    return null;
  }

  const fields = buildStudyLlmFields(study);
  if (fields.length === 0) {
    return null;
  }

  const controller = new AbortController();
  const timeoutMs = Math.max(config.timeoutMs, 20000);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(study, fields) },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.warn(
        `[study-llm] Réponse ${response.status} de ${config.provider}. Repli sur le moteur local.`,
        body.slice(0, 300),
      );
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('[study-llm] Réponse vide. Repli sur le moteur local.');
      return null;
    }

    const parsed = responseSchema.parse(JSON.parse(extractJson(content)));
    const validation = validateStudyRewrites(fields, parsed.textes);

    if (validation.wholesaleRejected) {
      console.warn(
        '[study-llm] La réponse contient un montant ou un pourcentage non justifié. Repli sur le moteur local.',
      );
      return null;
    }

    const acceptedCount = Object.keys(validation.accepted).length;
    if (acceptedCount < Math.ceil(fields.length * 0.5)) {
      console.warn(
        `[study-llm] Réponse trop incomplète (${acceptedCount}/${fields.length}). Repli sur le moteur local.`,
      );
      return null;
    }

    return {
      rewrites: validation.accepted,
      provider: config.provider,
      model: config.model,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[study-llm] Échec de la reformulation (${message}). Repli sur le moteur local.`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
