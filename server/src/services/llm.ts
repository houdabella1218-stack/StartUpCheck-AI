/**
 * StartUpCheck AI - Enrichissement par IA générative (100 % OPTIONNEL).
 *
 * Ce service est "provider-agnostic" : il interroge une API compatible OpenAI
 * (OpenAI, Mistral, Groq, Together, Ollama en local...). Il suffit de renseigner
 * LLM_BASE_URL / LLM_MODEL / LLM_API_KEY dans le fichier .env.
 *
 * RÈGLES DE CONCEPTION :
 *  - Si aucune clé n'est configurée, `isLlmConfigured()` renvoie false et le
 *    moteur local est utilisé. L'application fonctionne pleinement.
 *  - Toute erreur (réseau, délai, JSON invalide) fait retomber silencieusement
 *    sur le moteur local. Aucune exception ne remonte à l'utilisateur.
 *  - Le LLM ne calcule JAMAIS les scores : il ne rédige que le SWOT, les
 *    recommandations et la justification du verdict.
 *  - L'origine du texte est toujours tracée et affichée à l'utilisateur.
 */

import { z } from 'zod';
import type { AnalysisInput, Recommendation, ScoreResult, Swot } from '../engine/types';

export type LlmConfig = {
  provider: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
};

export function getLlmConfig(): LlmConfig | null {
  const provider = (process.env.LLM_PROVIDER ?? '').trim();
  const baseUrl = (process.env.LLM_BASE_URL ?? '').trim();
  const model = (process.env.LLM_MODEL ?? '').trim();
  const apiKey = (process.env.LLM_API_KEY ?? '').trim();
  const timeoutMs = Number(process.env.LLM_TIMEOUT_MS ?? 12000) || 12000;

  // Une configuration est considérée comme valide si les trois champs clés
  // sont présents. Une clé vide (cas d'Ollama en local) est tolérée dès lors
  // qu'un baseUrl et un modèle sont fournis explicitement.
  const hasCore = Boolean(baseUrl && model);
  const isLocalProvider = /ollama|localhost|127\.0\.0\.1/i.test(baseUrl);

  if (!hasCore) return null;
  if (!apiKey && !isLocalProvider) return null;

  return {
    provider: provider || 'openai-compatible',
    baseUrl: baseUrl.replace(/\/+$/, ''),
    model,
    apiKey: apiKey || 'ollama',
    timeoutMs,
  };
}

export function isLlmConfigured(): boolean {
  return getLlmConfig() !== null;
}

const swotSchema = z.object({
  forces: z.array(z.string().min(3)).min(2).max(6),
  faiblesses: z.array(z.string().min(3)).min(2).max(6),
  opportunites: z.array(z.string().min(3)).min(2).max(6),
  menaces: z.array(z.string().min(3)).min(2).max(6),
});

const recommendationSchema = z.object({
  titre: z.string().min(4),
  detail: z.string().min(20),
  priorite: z.enum(['haute', 'moyenne', 'basse']),
  axe: z.string().min(2),
});

const llmResponseSchema = z.object({
  swot: swotSchema,
  recommandations: z.array(recommendationSchema).min(3).max(8),
  justificationVerdict: z.string().min(30).max(900),
});

export type LlmEnrichment = {
  swot: Swot;
  recommendations: Recommendation[];
  verdictReason: string;
  provider: string;
  model: string;
};

function buildPrompt(input: AnalysisInput, scores: ScoreResult[], globalScore: number, verdictLabel: string, riskLabel: string): string {
  const scoreLines = scores
    .map((s) => `- ${s.label} : ${s.value}/100 (poids ${Math.round(s.weight * 100)}%)`)
    .join('\n');

  return `Tu es un analyste en création d'entreprise. Tu travailles pour une application d'analyse de viabilité.

Un utilisateur a soumis l'idée suivante :

Nom du projet : ${input.projectName}
Description : ${input.description}
Secteur : ${input.sector}
Marché / pays ciblé : ${input.market}
Clientèle cible : ${input.targetClients}
Budget disponible : ${input.budget} MAD

Les scores ci-dessous ont DÉJÀ été calculés par le moteur interne. Tu ne dois PAS les recalculer ni les contredire :
${scoreLines}
Score global : ${globalScore}/100
Niveau de risque : ${riskLabel}
Verdict retenu : ${verdictLabel}

Rédige en français, de façon concrète et actionnable, au format JSON STRICT suivant (aucun texte hors du JSON) :

{
  "swot": {
    "forces": ["...", "..."],
    "faiblesses": ["...", "..."],
    "opportunites": ["...", "..."],
    "menaces": ["...", "..."]
  },
  "recommandations": [
    { "titre": "...", "detail": "...", "priorite": "haute", "axe": "Marché" }
  ],
  "justificationVerdict": "..."
}

Contraintes :
- 3 à 5 éléments par catégorie SWOT, chacun en une phrase courte et spécifique au projet.
- 4 à 6 recommandations, chacune avec un titre court et un détail de 2 à 3 phrases.
- "priorite" vaut exactement "haute", "moyenne" ou "basse".
- "axe" est une des valeurs : Marché, Faisabilité, Innovation, Croissance, Risque.
- N'invente aucun chiffre qui contredit les scores fournis.
- N'écris jamais que tu es une IA ni que tu ne peux pas répondre.`;
}

/**
 * Tente un enrichissement par LLM.
 * Renvoie null si aucun LLM n'est configuré ou si l'appel échoue.
 */
export async function enrichWithLlm(
  input: AnalysisInput,
  scores: ScoreResult[],
  globalScore: number,
  verdictLabel: string,
  riskLabel: string,
): Promise<LlmEnrichment | null> {
  const config = getLlmConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

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
        temperature: 0.6,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              "Tu produis uniquement du JSON valide, en français, sans commentaire ni balise Markdown.",
          },
          {
            role: 'user',
            content: buildPrompt(input, scores, globalScore, verdictLabel, riskLabel),
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.warn(`[llm] Réponse ${response.status} de ${config.provider}. Bascule sur le moteur local.`, body.slice(0, 300));
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('[llm] Réponse vide. Bascule sur le moteur local.');
      return null;
    }

    const parsed = llmResponseSchema.parse(JSON.parse(extractJson(content)));

    return {
      swot: {
        strengths: parsed.swot.forces,
        weaknesses: parsed.swot.faiblesses,
        opportunities: parsed.swot.opportunites,
        threats: parsed.swot.menaces,
      },
      recommendations: parsed.recommandations.map((r) => ({
        title: r.titre,
        detail: r.detail,
        priority: r.priorite,
        axis: r.axe,
      })),
      verdictReason: parsed.justificationVerdict,
      provider: config.provider,
      model: config.model,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[llm] Échec de l'enrichissement (${message}). Bascule sur le moteur local.`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Certains modèles encadrent le JSON par des balises Markdown. */
function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}
