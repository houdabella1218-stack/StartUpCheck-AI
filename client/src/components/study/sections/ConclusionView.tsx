import { Award, CheckCircle2, Compass, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConclusionSection, StudyStatus } from '@/types';
import { StatusBadge, StudyCard } from '../StudyBlocks';
import { SECTION_INDEX } from '../StudyEditContext';
import { EditableBlock, EditableLine } from '../StudyText';

const HERO: Record<StudyStatus, string> = {
  viable: 'from-emerald-500 via-teal-500 to-emerald-600',
  viable_sous_conditions: 'from-amber-400 via-orange-400 to-amber-500',
  a_retravailler: 'from-rose-500 via-rose-500 to-rose-600',
};

export function ConclusionView({ section }: { section: ConclusionSection }) {
  const base = `sections.${SECTION_INDEX.conclusion}`;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-card sm:p-6',
          HERO[section.status],
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">
              <Award className="h-3.5 w-3.5" aria-hidden />
              Niveau global de faisabilité
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {section.statusLabel}
            </h2>
            <p className="max-w-2xl text-[13px] leading-relaxed text-white/90">
              Score de faisabilité : <strong>{section.score}/100</strong>
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-3xl font-extrabold tabular-nums">{section.score}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">
              sur 100
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-white/12 px-4 py-3 backdrop-blur-sm">
          <EditableBlock block={section.summary} path={`${base}.summary`} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StudyCard
          title="Forces du projet"
          icon={<ThumbsUp className="h-4 w-4 text-emerald-600" />}
          className="border-emerald-100"
        >
          <ul className="space-y-3">
            {section.strengths.length > 0 ? (
              section.strengths.map((strength, index) => (
                <EditableLine
                  key={index}
                  block={strength}
                  path={`${base}.strengths.${index}`}
                  icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                />
              ))
            ) : (
              <li className="text-[13px] text-slate-400">Aucune force identifiée.</li>
            )}
          </ul>
        </StudyCard>

        <StudyCard
          title="Faiblesses à corriger"
          icon={<ThumbsDown className="h-4 w-4 text-rose-500" />}
          className="border-rose-100"
        >
          <ul className="space-y-3">
            {section.weaknesses.length > 0 ? (
              section.weaknesses.map((weakness, index) => (
                <EditableLine
                  key={index}
                  block={weakness}
                  path={`${base}.weaknesses.${index}`}
                  icon={<span className="mt-1 block h-1.5 w-1.5 rounded-full bg-rose-400" />}
                />
              ))
            ) : (
              <li className="text-[13px] text-slate-400">Aucune faiblesse identifiée.</li>
            )}
          </ul>
        </StudyCard>
      </div>

      <StudyCard
        title="Conditions de réussite"
        icon={<Compass className="h-4 w-4 text-brand-600" />}
        description="Prérequis à lever avant d’engager des dépenses irréversibles."
      >
        <ul className="space-y-3">
          {section.successConditions.map((condition, index) => (
            <EditableLine
              key={index}
              block={condition}
              path={`${base}.successConditions.${index}`}
              icon={<span className="mt-1 block h-1.5 w-1.5 rounded-full bg-brand-400" />}
            />
          ))}
        </ul>
      </StudyCard>

      <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-violet-50 p-5 shadow-sm sm:p-6">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Recommandation finale
        </p>
        <div className="mt-2">
          <EditableBlock block={section.recommendation} path={`${base}.recommendation`} />
        </div>
        <div className="mt-3">
          <StatusBadge status={section.status} label={section.statusLabel} />
        </div>
      </div>
    </div>
  );
}
