import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { priorityTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import type { Recommendation } from '@/types';

export function RecommendationList({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <ol className="grid gap-3 lg:grid-cols-2">
      {recommendations.map((recommendation, index) => {
        const theme = priorityTheme[recommendation.priority];

        return (
          <motion.li
            key={`${recommendation.title}-${index}`}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
            className="card card-hover flex gap-4 p-5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-sm font-extrabold text-white shadow-glow">
              {index + 1}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{recommendation.title}</h3>
                <span className={cn('chip', theme.badge)}>{theme.label}</span>
              </div>

              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{recommendation.detail}</p>

              <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Axe : {recommendation.axis}
                <ArrowRight className="h-3 w-3" />
              </p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
