import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Rocket, XCircle } from 'lucide-react';
import { verdictTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import type { Verdict } from '@/types';

const SCALE: Array<{ verdict: Verdict; range: string; min: number; max: number }> = [
  { verdict: 'risque', range: '0 – 49', min: 0, max: 49 },
  { verdict: 'ameliorer', range: '50 – 69', min: 50, max: 69 },
  { verdict: 'developper', range: '70 – 100', min: 70, max: 100 },
];

const ICONS: Record<Verdict, React.ComponentType<{ className?: string }>> = {
  developper: Rocket,
  ameliorer: AlertTriangle,
  risque: XCircle,
};

export function VerdictBanner({
  verdict,
  verdictLabel,
  globalScore,
}: {
  verdict: Verdict;
  verdictLabel: string;
  globalScore: number;
}) {
  const theme = verdictTheme[verdict];
  const Icon = ICONS[verdict];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card overflow-hidden"
    >
      <div className={cn('bg-gradient-to-r p-6 text-white sm:p-8', theme.banner)}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Icon className="h-7 w-7" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/80">Verdict final</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{verdictLabel}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/90">{theme.description}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-center rounded-2xl bg-white/15 px-6 py-4 backdrop-blur">
            <span className="text-xs font-bold uppercase tracking-wide text-white/80">Score</span>
            <span className="text-3xl font-extrabold tabular-nums">
              {globalScore}
              <span className="text-base font-bold text-white/70">/100</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
        {SCALE.map((step) => {
          const active = verdict === step.verdict;
          const stepTheme = verdictTheme[step.verdict];
          const StepIcon = step.verdict === 'risque' ? XCircle : step.verdict === 'ameliorer' ? AlertTriangle : CheckCircle2;

          return (
            <div
              key={step.verdict}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3 transition',
                active
                  ? 'border-transparent bg-slate-900/[0.03] ring-2 ring-offset-1 ' + stepTheme.badge.split(' ').slice(-1)[0]
                  : 'border-slate-200 bg-white opacity-70',
              )}
            >
              <StepIcon className={cn('h-4 w-4 shrink-0', stepTheme.accent)} />
              <div className="min-w-0">
                <p className={cn('text-sm font-bold', active ? stepTheme.accent : 'text-slate-600')}>
                  {verdictTheme[step.verdict].label}
                </p>
                <p className="text-[11px] font-medium text-slate-400">Score {step.range}</p>
              </div>
              {active ? (
                <span className="ml-auto shrink-0 rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Actuel
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
