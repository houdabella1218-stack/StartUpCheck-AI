import { motion } from 'framer-motion';
import { AlertTriangle, Gauge, Info, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/dashboard/ScoreRing';
import { verdictTheme } from '@/lib/theme';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Analysis } from '@/types';

type GlobalScoreCardProps = {
  analysis: Analysis;
  className?: string;
};

export function GlobalScoreCard({ analysis, className }: GlobalScoreCardProps) {
  const theme = verdictTheme[analysis.verdict];
  const riskScore = analysis.scores.find((s) => s.key === 'risk')?.value ?? 0;

  return (
    <div className={cn('card relative overflow-hidden', className)}>
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r',
          theme.banner,
        )}
        aria-hidden
      />

      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="flex justify-center">
          <ScoreRing
            value={analysis.globalScore}
            size={232}
            from={theme.from}
            to={theme.to}
            label="Score global"
            sublabel="viabilité du projet"
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand" size="md" className="gap-2">
              <Target className="h-3.5 w-3.5" />
              {analysis.sectorLabel}
            </Badge>
            <Badge tone="neutral" size="md">
              🌍 {analysis.marketLabel}
            </Badge>
            <span className={cn('chip', theme.badge)}>
              <Sparkles className="h-3.5 w-3.5" />
              Verdict : {theme.label}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {analysis.projectName}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            {analysis.verdictReason}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            <MiniStat
              icon={<Gauge className="h-4 w-4" />}
              label="Score global"
              value={`${analysis.globalScore}/100`}
              tone="text-brand-600"
            />
            <MiniStat
              icon={
                analysis.riskLevel === 'faible' || analysis.riskLevel === 'modere' ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )
              }
              label="Niveau de risque"
              value={analysis.riskLabel}
              tone="text-rose-600"
            />
            <MiniStat
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Risque (note)"
              value={`${riskScore}/100`}
              tone="text-rose-600"
            />
            <MiniStat
              icon={<Info className="h-4 w-4" />}
              label="Confiance"
              value={`${Math.round(analysis.meta.confidence * 100)} %`}
              tone="text-sky-600"
            />
          </motion.div>

          <p className="mt-4 text-xs text-slate-400">
            Analysé le {formatDate(analysis.createdAt)} · méthodologie v{analysis.meta.methodologyVersion}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5">
      <div className={cn('mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide', tone)}>
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}
