import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'violet';
  size?: 'sm' | 'md';
};

const tones: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  brand: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  info: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  violet: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
};

export function Badge({ className, tone = 'neutral', size = 'sm', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
