import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Hammer,
  Lightbulb,
  Rocket,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { scoreTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import type { ScoreKey, ScoreResult } from '@/types';

const icons: Record<ScoreKey, React.ComponentType<{ className?: string }>> = {
  market: TrendingUp,
  feasibility: Hammer,
  innovation: Lightbulb,
  growth: Rocket,
  risk: ShieldAlert,
};

type ScoreBreakdownProps = {
  scores: ScoreResult[];
};

export function ScoreBreakdown({ scores }: ScoreBreakdownProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {scores.map((score, index) => (
        <ScoreCard key={score.key} score={score} index={index} />
      ))}
    </div>
  );
}

function ScoreCard({ score, index }: { score: ScoreResult; index: number }) {
  const [open, setOpen] = useState(false);
  const theme = scoreTheme[score.key];
  const Icon = icons[score.key];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.45 }}
      className="card card-hover flex flex-col p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: theme.track }}
          >
            <Icon className={cn('h-4 w-4', theme.icon)} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">{score.label}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Poids {Math.round(score.weight * 100)} %
              {score.inverted ? ' · inversé' : ''}
            </p>
          </div>
        </div>

        <div className={cn('shrink-0 text-right text-xl font-extrabold tabular-nums', theme.text)}>
          <AnimatedNumber value={score.value} />
          <span className="text-xs font-bold text-slate-400">/100</span>
        </div>
      </div>

      <div className="mt-3.5">
        <ProgressBar value={score.value} gradient={theme.bar} delay={0.1 * index} />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">{score.summary}</p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 inline-flex items-center gap-1 self-start text-[11px] font-bold uppercase tracking-wide text-slate-400 transition hover:text-brand-600"
      >
        Détail du calcul
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <ul className="mt-3 space-y-2 rounded-xl bg-slate-50/80 p-3">
              {score.factors.map((factor) => (
                <li key={factor.label}>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-500">{factor.label}</span>
                    <span className="font-bold tabular-nums text-slate-700">{factor.value}</span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(0, Math.min(100, factor.value))}%`, backgroundColor: theme.color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
