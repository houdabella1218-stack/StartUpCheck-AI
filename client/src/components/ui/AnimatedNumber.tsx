import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

/**
 * Compteur animé (0 → valeur) déclenché à l'apparition dans le viewport.
 */
export function useCountUp(target: number, duration = 1200, start = true) {
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;

    const startTime = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [target, duration, start]);

  return value;
}

export function AnimatedNumber({
  value,
  duration = 1200,
  suffix = '',
  className,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const animated = useCountUp(value, duration, inView);

  return (
    <span ref={ref} className={className}>
      {animated}
      {suffix}
    </span>
  );
}
