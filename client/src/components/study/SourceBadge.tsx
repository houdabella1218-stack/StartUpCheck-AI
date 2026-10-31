import { Bot, Calculator, HelpCircle, PenLine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { StudySource } from '@/types';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'violet';

export const SOURCE_META: Record<
  StudySource,
  { label: string; short: string; tone: Tone; icon: LucideIcon; description: string }
> = {
  saisie: {
    label: 'Donnée saisie',
    short: 'Saisie',
    tone: 'info',
    icon: PenLine,
    description: 'Information fournie par vous, sans transformation.',
  },
  calcule: {
    label: 'Donnée calculée',
    short: 'Calculé',
    tone: 'success',
    icon: Calculator,
    description: 'Résultat déterministe produit par le moteur StartUpCheck.',
  },
  hypothese: {
    label: 'Hypothèse',
    short: 'Hypothèse',
    tone: 'warning',
    icon: HelpCircle,
    description: 'Déduction heuristique à confirmer : ce n’est pas une donnée réelle.',
  },
  ia: {
    label: 'Contenu généré par IA',
    short: 'IA',
    tone: 'violet',
    icon: Bot,
    description: 'Texte reformulé par un modèle de langage, non vérifié.',
  },
};

export function SourceBadge({
  source,
  compact = false,
  className,
}: {
  source: StudySource;
  compact?: boolean;
  className?: string;
}) {
  const meta = SOURCE_META[source];
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone} className={cn('shrink-0', className)} title={meta.description}>
      <Icon className="h-3 w-3" aria-hidden />
      {compact ? meta.short : meta.label}
    </Badge>
  );
}

/** Bandeau de transparence : nombre de blocs par origine. */
export function SourceLegend({
  counts,
  className,
}: {
  counts: Record<StudySource, number>;
  className?: string;
}) {
  const order: StudySource[] = ['saisie', 'calcule', 'hypothese', 'ia'];
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {order.map((source) => {
        const meta = SOURCE_META[source];
        const Icon = meta.icon;
        return (
          <span
            key={source}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200"
            title={meta.description}
          >
            <Icon className="h-3 w-3 text-slate-400" aria-hidden />
            {meta.short}
            <span className="font-extrabold text-slate-900">{counts[source] ?? 0}</span>
          </span>
        );
      })}
    </div>
  );
}
