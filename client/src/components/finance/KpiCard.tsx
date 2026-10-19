import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'positive' | 'negative' | 'brand' | 'warning';

const toneStyles: Record<Tone, { value: string; icon: string }> = {
  neutral: { value: 'text-slate-900', icon: 'bg-slate-100 text-slate-500' },
  positive: { value: 'text-emerald-600', icon: 'bg-emerald-50 text-emerald-600' },
  negative: { value: 'text-rose-600', icon: 'bg-rose-50 text-rose-600' },
  brand: { value: 'text-brand-700', icon: 'bg-brand-50 text-brand-600' },
  warning: { value: 'text-amber-600', icon: 'bg-amber-50 text-amber-600' },
};

/**
 * Carte KPI du module financier.
 * Le ton est choisi par l'appelant en fonction du signe de la valeur.
 * La valeur peut être une chaîne déjà formatée (y compris un message explicite
 * du type « Non applicable ») : aucun montant n'est jamais inventé ici.
 */
export function KpiCard({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
  emoji,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: Tone;
  emoji?: string;
  className?: string;
}) {
  const styles = toneStyles[tone];

  return (
    <div className={cn('card p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        {icon ? (
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', styles.icon)}>
            {icon}
          </span>
        ) : emoji ? (
          <span className="text-lg leading-none" aria-hidden>
            {emoji}
          </span>
        ) : null}
      </div>
      <p className={cn('mt-2 text-xl font-extrabold tracking-tight tabular-nums sm:text-2xl', styles.value)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-slate-500">{hint}</p> : null}
    </div>
  );
}
