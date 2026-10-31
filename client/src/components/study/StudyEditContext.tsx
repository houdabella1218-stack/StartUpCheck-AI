import { createContext, useContext } from 'react';
import type { StudySectionKey } from '@/types';

/** Index fixe des sections dans le tableau `sections` (ordre du moteur). */
export const SECTION_INDEX: Record<StudySectionKey, number> = {
  presentation: 0,
  marche: 1,
  commercial: 2,
  technique: 3,
  organisation: 4,
  finance: 5,
  risques: 6,
  plan_action: 7,
  conclusion: 8,
};

type StudyEditContextValue = {
  editing: boolean;
  drafts: Record<string, string>;
  onChange: (path: string, value: string) => void;
};

const StudyEditContext = createContext<StudyEditContextValue>({
  editing: false,
  drafts: {},
  onChange: () => undefined,
});

export function StudyEditProvider({
  editing,
  drafts,
  onChange,
  children,
}: StudyEditContextValue & { children: React.ReactNode }) {
  return (
    <StudyEditContext.Provider value={{ editing, drafts, onChange }}>
      {children}
    </StudyEditContext.Provider>
  );
}

export function useStudyEdit(): StudyEditContextValue {
  return useContext(StudyEditContext);
}
