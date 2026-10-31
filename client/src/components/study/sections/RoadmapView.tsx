import { CalendarRange, CheckCircle2, Flag, ListChecks, MapPinned, Target } from 'lucide-react';
import type { ActionPlanSection, RoadmapStep } from '@/types';
import { PriorityBadge, StudyCard } from '../StudyBlocks';
import { SECTION_INDEX } from '../StudyEditContext';
import { EditableBlock, EditableLine } from '../StudyText';

export function RoadmapView({
  section,
  roadmap,
}: {
  section: ActionPlanSection;
  roadmap: RoadmapStep[];
}) {
  const base = `sections.${SECTION_INDEX.plan_action}`;

  return (
    <div className="space-y-4">
      <StudyCard
        title="Feuille de route"
        icon={<MapPinned className="h-4 w-4 text-brand-600" />}
        description="Repères de travail sur 12 mois : objectifs, actions prioritaires et indicateurs de réussite."
      >
        <EditableBlock block={section.intro} path={`${base}.intro`} />
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
          {roadmap.map((step, index) => (
            <span
              key={step.key}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-extrabold text-brand-700">
                {index + 1}
              </span>
              {step.period}
            </span>
          ))}
        </div>
      </StudyCard>

      <ol className="relative space-y-4 border-l-2 border-dashed border-brand-100 pl-5 sm:pl-6">
        {roadmap.map((step, index) => (
          <li key={step.key} className="relative">
            <span
              className="absolute -left-[30px] top-4 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-violet-600 text-[10px] font-extrabold text-white shadow-sm sm:-left-[34px]"
              aria-hidden
            >
              {index + 1}
            </span>

            <StudyCard
              title={step.label}
              icon={<CalendarRange className="h-4 w-4 text-brand-600" />}
              action={
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 ring-1 ring-brand-200">
                  {step.period}
                </span>
              }
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    <Target className="h-3 w-3" aria-hidden />
                    Objectifs
                  </p>
                  <ul className="space-y-2.5">
                    {step.objectives.map((objective, objectiveIndex) => (
                      <EditableLine
                        key={objectiveIndex}
                        block={objective}
                        path={`roadmap.${index}.objectives.${objectiveIndex}`}
                        icon={<span className="mt-1 block h-1.5 w-1.5 rounded-full bg-brand-400" />}
                      />
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    <Flag className="h-3 w-3" aria-hidden />
                    Actions
                  </p>
                  <ul className="space-y-3">
                    {step.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="space-y-1.5">
                        <EditableLine
                          block={action.text}
                          path={`roadmap.${index}.actions.${actionIndex}.text`}
                          icon={<CheckCircle2 className="h-3.5 w-3.5 text-slate-300" />}
                        />
                        <div className="pl-6">
                          <PriorityBadge priority={action.priority} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    <ListChecks className="h-3 w-3" aria-hidden />
                    Indicateurs de réussite
                  </p>
                  <ul className="space-y-2.5">
                    {step.indicators.map((indicator, indicatorIndex) => (
                      <EditableLine
                        key={indicatorIndex}
                        block={indicator}
                        path={`roadmap.${index}.indicators.${indicatorIndex}`}
                        icon={
                          <span className="mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded border border-slate-300 text-[8px] text-slate-400" aria-hidden>
                            ✓
                          </span>
                        }
                      />
                    ))}
                  </ul>
                </div>
              </div>
            </StudyCard>
          </li>
        ))}
      </ol>
    </div>
  );
}
