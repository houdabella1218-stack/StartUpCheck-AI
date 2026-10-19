import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  'Validation des informations fournies',
  'Application des barèmes sectoriels',
  "Calcul du potentiel de marché",
  'Évaluation de la faisabilité et du budget',
  'Analyse des signaux d’innovation',
  'Pondération du niveau de risque',
  'Rédaction du SWOT et des recommandations',
];

export function AnalysisLoading() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Avancement purement visuel, calé sur la durée réelle d'une analyse locale.
    const interval = setInterval(() => {
      setCurrent((value) => (value >= STEPS.length - 1 ? value : value + 1));
    }, 260);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8"
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-white">
            <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-brand-500/40" />
            <Loader2 className="relative h-5 w-5 animate-spin" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-900">Analyse en cours…</p>
            <p className="text-xs text-slate-500">Le moteur traite votre idée localement.</p>
          </div>
        </div>

        <ul className="mt-6 space-y-2.5">
          {STEPS.map((step, index) => {
            const done = index < current;
            const active = index === current;

            return (
              <li key={step} className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition',
                    done
                      ? 'bg-emerald-500 text-white'
                      : active
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-slate-100 text-slate-400',
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'text-[13px] transition',
                    done ? 'text-slate-400' : active ? 'font-semibold text-slate-900' : 'text-slate-400',
                  )}
                >
                  {step}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
            initial={{ width: '4%' }}
            animate={{ width: '96%' }}
            transition={{ duration: 2.4, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="rounded-2xl border border-rose-200 bg-rose-50 p-4"
      >
        <p className="text-sm font-bold text-rose-800">L'analyse n'a pas pu être réalisée</p>
        <p className="mt-1 text-xs leading-relaxed text-rose-700">{message}</p>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="btn-ghost mt-3 !py-2 text-xs">
            Réessayer
          </button>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}
