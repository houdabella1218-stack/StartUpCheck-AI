/**
 * Client API StartUpCheck AI.
 * Toutes les requêtes passent par le proxy Vite (/api → http://localhost:4000).
 */

import type {
  Analysis,
  AnalysisSummary,
  CreateAnalysisPayload,
  FinancialCheck,
  FinancialCheckRecord,
  FinancialInput,
  MetaResponse,
} from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  readonly status: number;
  readonly details: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    status: number,
    details: Array<{ field: string; message: string }> = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      "Impossible de joindre le serveur d'analyse. Vérifiez qu'il est bien démarré (npm run dev).",
      0,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload.message === 'string' && payload.message) ||
      `Erreur ${response.status} lors de l'appel à l'API.`;
    const details = Array.isArray(payload?.details) ? payload.details : [];
    throw new ApiError(message, response.status, details);
  }

  return payload as T;
}

export const api = {
  getMeta(): Promise<MetaResponse> {
    return request<MetaResponse>('/meta');
  },

  createAnalysis(input: CreateAnalysisPayload): Promise<Analysis> {
    return request<Analysis>('/analyses', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // --- Module "Financial Check" -------------------------------------------

  /** Calcule sans persister (simulateur live). */
  previewFinancialCheck(input: FinancialInput): Promise<FinancialCheck> {
    return request<FinancialCheck>('/financial-checks/preview', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /** Calcule et enregistre (rattache à une analyse si `analysisId` est fourni). */
  createFinancialCheck(payload: FinancialInput & { analysisId?: string }): Promise<FinancialCheckRecord> {
    return request<FinancialCheckRecord>('/financial-checks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listFinancialChecks(analysisId?: string): Promise<{ items: FinancialCheckRecord[]; total: number }> {
    const query = analysisId ? `?analysisId=${encodeURIComponent(analysisId)}` : '';
    return request<{ items: FinancialCheckRecord[]; total: number }>(`/financial-checks${query}`);
  },

  getFinancialCheck(id: string): Promise<FinancialCheckRecord> {
    return request<FinancialCheckRecord>(`/financial-checks/${encodeURIComponent(id)}`);
  },

  deleteFinancialCheck(id: string): Promise<void> {
    return request<void>(`/financial-checks/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  listAnalyses(): Promise<{ items: AnalysisSummary[]; total: number }> {
    return request<{ items: AnalysisSummary[]; total: number }>('/analyses');
  },

  getAnalysis(id: string): Promise<Analysis> {
    return request<Analysis>(`/analyses/${encodeURIComponent(id)}`);
  },

  deleteAnalysis(id: string): Promise<void> {
    return request<void>(`/analyses/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  health(): Promise<{
    status: string;
    database: string;
    analysesStockees: number;
    llmConfigured: boolean;
  }> {
    return request('/health');
  },
};
