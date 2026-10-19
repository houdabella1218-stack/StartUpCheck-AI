import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ProgressBarProps = {
  value: number;
  gradient?: string;
  className?: string;
  delay?: number;
  height?: 'sm' | 'md' | 'lg';
};

export function ProgressBar({
  value,
  gradient = 'from-brand-500 to-violet-500',
  className,
  delay = 0,
  height = 'md',
}: ProgressBarProps) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' } as const;
  const bounded = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-slate-100', heights[height], className)}>
      <motion.div
        className={cn('h-full rounded-full bg-gradient-to-r', gradient)}
        initial={{ width: 0 }}
        animate={{ width: `${bounded}%` }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
