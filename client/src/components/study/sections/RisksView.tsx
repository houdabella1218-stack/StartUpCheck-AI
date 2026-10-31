import { AlertOctagon, Grid3x3, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { RiskCategory, RiskLevelLabel, RisksSection, StudyRisk } from '@/types';
import { RiskLevelBadge, StudyCard } from '../StudyBlocks';
import { SECTION_INDEX } from '../StudyEditContext';
import { EditableBlock } from '../StudyText';

const CATEGORY_TONE: Record<
  RiskCategory,
  'warning' | 'info' | 'brand' | 'violet' | 'neutral' | 'success'
> = {
  financier: 'warning',
  commercial: 'info',
  operationnel: 'brand',
  technique: 'violet',
  juridique: 'neutral',
  rh: 'success',
};

const LEVEL_CELL: Record<RiskLevelLabel, string> = {
  faible: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  modere: 'bg-amber-50 text-amber-700 ring-amber-200',
  eleve: 'bg-orange-50 text-orange-700 ring-orange-200',
  critique: 'bg-rose-50 text-rose-700 ring-rose-200',
};

function levelOf(score: number): RiskLevelLabel {
  if (score >= 13) return 'critique';
  if (score >= 9) return 'eleve';
  if (score >= 5) return 'modere';
  return 'faible';
}

function Scale({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</span>
      <span className="flex gap-0.5" aria-label={`${label} : ${value} sur 4`}>
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn(
              'h-1.5 w-4 rounded-full',
              step <= value ? 'bg-slate-700' : 'bg-slate-200',
            )}
          />
        ))}
      </span>
      <span className="text-[10px] font-bold tabular-nums text-slate-500">{value}/4</span>
    </div>
  );
}

function RiskMatrix({ risks }: { risks: StudyRisk[] }) {
  const impacts: Array<1 | 2 | 3 | 4> = [4, 3, 2, 1];
  const probabilities: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[420px]">
        <div className="mb-1 ml-10 grid grid-cols-4 gap-1 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
          {probabilities.map((probability) => (
            <span key={probability}>P{probability}</span>
          ))}
        </div>
        <div className="flex gap-1">
          <div className="flex w-9 flex-col justify-around text-right text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
            <span>I4</span>
            <span>I3</span>
            <span>I2</span>
            <span>I1</span>
          </div>
          <div className="grid flex-1 grid-cols-4 gap-1">
            {impacts.map((impact) =>
              probabilities.map((probability) => {
                const score = impact * probability;
                const level = levelOf(score);
                const cellRisks = risks.filter(
                  (risk) => risk.probability === probability && risk.impact === impact,
                );
                return (
                  <div
                    key={`${impact}-${probability}`}
                    className={cn(
                      'flex min-h-[42px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-bold ring-1',
                      LEVEL_CELL[level],
                    )}
                    title={`Impact ${impact} × Probabilité ${probability} = ${score} (${level})`}
                  >
                    <span className="tabular-nums opacity-70">{score}</span>
                    <span className="flex flex-wrap justify-center gap-0.5">
                      {cellRisks.map((risk) => (
                        <span
                          key={risk.id}
                          className="rounded bg-white/80 px-1 text-[9px] font-extrabold uppercase"
                          title={risk.title}
                        >
                          {risk.category.slice(0, 2)}
                        </span>
                      ))}
                    </span>
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RisksView({ section, risks }: { section: RisksSection; risks: StudyRisk[] }) {
  const base = `sections.${SECTION_INDEX.risques}`;
  const counts = risks.reduce<Record<RiskLevelLabel, number>>(
    (acc, risk) => {
      acc[risk.level] += 1;
      return acc;
    },
    { faible: 0, modere: 0, eleve: 0, critique: 0 },
  );

  return (
    <div className="space-y-4">
      <StudyCard
        title="Synthèse des risques"
        icon={<AlertOctagon className="h-4 w-4 text-rose-500" />}
        description="Probabilités et impacts sont des hypothèses déterministes, pas des mesures statistiques."
      >
        <EditableBlock block={section.intro} path={`${base}.intro`} />
        <div className="flex flex-wrap gap-2">
          {(['critique', 'eleve', 'modere', 'faible'] as RiskLevelLabel[]).map((level) => (
            <RiskLevelBadge
              key={level}
              level={level}
              label={`${counts[level]} ${level === 'critique' ? 'critique(s)' : level === 'eleve' ? 'élevé(s)' : level === 'modere' ? 'modéré(s)' : 'faible(s)'}`}
            />
          ))}
        </div>
      </StudyCard>

      <StudyCard
        title="Matrice probabilité × impact"
        icon={<Grid3x3 className="h-4 w-4 text-brand-600" />}
        description="Chaque case indique le niveau de risque (1 à 16) et les catégories concernées."
      >
        <RiskMatrix risks={risks} />
      </StudyCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {risks.map((risk, index) => (
          <StudyCard
            key={risk.id}
            title={risk.title}
            icon={<ShieldCheck className="h-4 w-4 text-slate-500" />}
            action={
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={CATEGORY_TONE[risk.category]}>{risk.categoryLabel}</Badge>
                <RiskLevelBadge level={risk.level} label={risk.levelLabel} />
              </div>
            }
            className={cn(
              risk.level === 'critique' && 'border-rose-200',
              risk.level === 'eleve' && 'border-orange-200',
            )}
          >
            <EditableBlock block={risk.description} path={`risks.${index}.description`} />

            <div className="flex flex-wrap items-center gap-4 rounded-lg bg-slate-50 px-3 py-2">
              <Scale value={risk.probability} label="Probabilité" />
              <Scale value={risk.impact} label="Impact" />
              <span className="ml-auto text-[11px] font-bold text-slate-500">
                Niveau {risk.score}/16
              </span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Plan de mitigation
              </p>
              <EditableBlock block={risk.mitigation} path={`risks.${index}.mitigation`} />
            </div>
          </StudyCard>
        ))}
      </div>
    </div>
  );
}
