import { BrainCircuit, Calculator, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisMeta } from '@/types';

/**
 * Bandeau de TRANSPARENCE.
 *
 * Il indique toujours l'origine réelle du rapport :
 *  - "Moteur d'analyse local" : aucun LLM configuré ou appel échoué. Aucune
 *    mention d'IA générative n'est affichée.
 *  - "Moteur local + enrichissement IA générative" : un LLM a rédigé le texte.
 *
 * Les scores, eux, sont TOUJOURS calculés localement par des règles de calcul.
 */
export function EngineNotice({ meta, className }: { meta: AnalysisMeta; className?: string }) {
  const isLlm = meta.engine === 'llm';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-start sm:gap-4',
        isLlm ? 'border-violet-200 bg-violet-50/60' : 'border-slate-200 bg-slate-50/80',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          isLlm ? 'bg-violet-100 text-violet-700' : 'bg-white text-brand-600 ring-1 ring-slate-200',
        )}
      >
        {isLlm ? <BrainCircuit className="h-5 w-5" /> : <Calculator className="h-5 w-5" />}
      </span>

      <div className="min-w-0">
        <p className={cn('text-sm font-bold', isLlm ? 'text-violet-800' : 'text-slate-800')}>
          {meta.engineLabel}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">{meta.engineNotice}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Calculator className="h-3.5 w-3.5" />
            Scores : calcul déterministe local
          </span>
          {isLlm ? (
            <span className="inline-flex items-center gap-1.5">
              <BrainCircuit className="h-3.5 w-3.5" />
              Texte : {meta.llmProvider}
              {meta.llmModel ? ` · ${meta.llmModel}` : ''}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Texte : règles internes (aucune IA générative)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
