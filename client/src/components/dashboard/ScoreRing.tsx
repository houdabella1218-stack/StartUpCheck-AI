import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/components/ui/AnimatedNumber';

type ScoreRingProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  from?: string;
  to?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  animate?: boolean;
  className?: string;
};

/**
 * Jauge circulaire (arc de 270°) avec dégradé, utilisée pour le score global
 * et le niveau de risque.
 */
export function ScoreRing({
  value,
  size = 240,
  strokeWidth = 18,
  from = '#6366f1',
  to = '#a855f7',
  trackColor = 'rgba(148,163,184,0.22)',
  label,
  sublabel,
  animate = true,
  className,
}: ScoreRingProps) {
  const bounded = Math.max(0, Math.min(100, value));
  const radius = (200 - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 0.75;
  const arc = circumference * arcFraction;

  const gradientId = `ring-grad-${from.replace('#', '')}-${to.replace('#', '')}`;
  const animatedValue = useCountUp(bounded, 1400, animate);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" width={size} height={size} className="-rotate-0">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>

        <g transform="rotate(-225 100 100)">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circumference}`}
          />
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circumference}`}
            initial={{ strokeDashoffset: arc }}
            animate={{ strokeDashoffset: arc - (arc * bounded) / 100 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-start">
          <span
            className="bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text font-extrabold tracking-tight text-transparent"
            style={{ fontSize: size * 0.26, lineHeight: 1 }}
          >
            {animatedValue}
          </span>
          <span className="mt-1 ml-0.5 font-bold text-slate-400" style={{ fontSize: size * 0.09 }}>
            /100
          </span>
        </div>
        {label ? (
          <span className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
        ) : null}
        {sublabel ? <span className="mt-0.5 text-[11px] text-slate-400">{sublabel}</span> : null}
      </div>
    </div>
  );
}
