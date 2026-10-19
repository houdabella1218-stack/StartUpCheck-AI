import { motion } from 'framer-motion';
import { Lightbulb, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Swot } from '@/types';

type Quadrant = {
  key: keyof Swot;
  title: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  wrapper: string;
  accent: string;
  bullet: string;
};

const QUADRANTS: Quadrant[] = [
  {
    key: 'strengths',
    title: 'Forces',
    helper: 'Atouts internes du projet',
    icon: TrendingUp,
    wrapper: 'border-emerald-200/70 bg-emerald-50/50',
    accent: 'text-emerald-700',
    bullet: 'bg-emerald-500',
  },
  {
    key: 'weaknesses',
    title: 'Faiblesses',
    helper: 'Points internes à corriger',
    icon: TrendingDown,
    wrapper: 'border-rose-200/70 bg-rose-50/50',
    accent: 'text-rose-700',
    bullet: 'bg-rose-500',
  },
  {
    key: 'opportunities',
    title: 'Opportunités',
    helper: 'Leviers externes favorables',
    icon: Lightbulb,
    wrapper: 'border-sky-200/70 bg-sky-50/50',
    accent: 'text-sky-700',
    bullet: 'bg-sky-500',
  },
  {
    key: 'threats',
    title: 'Menaces',
    helper: 'Risques externes à surveiller',
    icon: ShieldAlert,
    wrapper: 'border-amber-200/70 bg-amber-50/50',
    accent: 'text-amber-700',
    bullet: 'bg-amber-500',
  },
];

export function SwotGrid({ swot }: { swot: Swot }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {QUADRANTS.map((quadrant, index) => {
        const Icon = quadrant.icon;
        const items = swot[quadrant.key] ?? [];

        return (
          <motion.div
            key={quadrant.key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: index * 0.07 }}
            className={cn('rounded-2xl border p-5 shadow-soft backdrop-blur-sm', quadrant.wrapper)}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                <Icon className={cn('h-4 w-4', quadrant.accent)} />
              </span>
              <div>
                <h3 className={cn('text-sm font-extrabold uppercase tracking-wide', quadrant.accent)}>
                  {quadrant.title}
                </h3>
                <p className="text-[11px] font-medium text-slate-500">{quadrant.helper}</p>
              </div>
            </div>

            <ul className="mt-4 space-y-2.5">
              {items.map((item, itemIndex) => (
                <li key={`${quadrant.key}-${itemIndex}`} className="flex gap-2.5">
                  <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', quadrant.bullet)} />
                  <span className="text-[13px] leading-relaxed text-slate-700">{item}</span>
                </li>
              ))}
              {items.length === 0 ? (
                <li className="text-[13px] italic text-slate-400">Aucun élément identifié.</li>
              ) : null}
            </ul>
          </motion.div>
        );
      })}
    </div>
  );
}
