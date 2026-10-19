/**
 * État global léger (Zustand) :
 *  - référentiels (secteurs, marchés, exemples) chargés une seule fois ;
 *  - résultat de la dernière analyse (pour éviter un aller-retour réseau).
 */

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Analysis, MetaResponse } from '@/types';

type AnalysisState = {
  meta: MetaResponse | null;
  metaLoading: boolean;
  metaError: string | null;
  lastAnalysis: Analysis | null;

  loadMeta: () => Promise<MetaResponse | null>;
  setLastAnalysis: (analysis: Analysis | null) => void;
};

export const useAppStore = create<AnalysisState>((set, get) => ({
  meta: null,
  metaLoading: false,
  metaError: null,
  lastAnalysis: null,

  loadMeta: async () => {
    const existing = get().meta;
    if (existing) return existing;

    set({ metaLoading: true, metaError: null });
    try {
      const meta = await api.getMeta();
      set({ meta, metaLoading: false });
      return meta;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      set({ metaLoading: false, metaError: message });
      return null;
    }
  },

  setLastAnalysis: (analysis) => set({ lastAnalysis: analysis }),
}));
