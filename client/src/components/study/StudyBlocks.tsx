import type { ReactNode } from 'react';
import { AlertTriangle, Info, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type {
  Priority,
  RiskLevelLabel,
  StudySectionKey,
  StudyStatus,
} from '@/types';

const STATUS_STYLES: Record<StudyStatus, { tone: 'success' | 'warning' | 'danger'; label: string }> =
  {
    viable: { tone: 'success', label: 'Projet viable' },
    viable_sous_conditions: { tone: 'warning', label: 'Viable sous conditions' },
    a_retravailler: { tone: 'danger', label: 'À retravailler' },
  };

export function StatusBadge({
  status,
  label,
  size = 'md',
}: {
  status: StudyStatus;
  label?: string;
  size?: 'sm' | 'md';
}) {
  const meta = STATUS_STYLES[status];
  return (
    <Badge tone={meta.tone} size={size}>
      {label ?? meta.label}
    </Badge>
  );
}

const PRIORITY_STYLES: Record<Priority, { label: string; tone: 'danger' | 'warning' | 'neutral' }> = {
  haute: { label: 'Priorité haute', tone: 'danger' },
  moyenne: { label: 'Priorité moyenne', tone: 'warning' },
  basse: { label: 'Priorité basse', tone: 'neutral' },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = PRIORITY_STYLES[priority];
  return (
    <Badge tone={meta.tone} className="whitespace-nowrap">
      {meta.label}
    </Badge>
  );
}

const RISK_STYLES: Record<
  RiskLevelLabel,
  { label: string; className: string; icon: typeof ShieldCheck }
> = {
  faible: {
    label: 'Faible',
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    icon: ShieldCheck,
  },
  modere: {
    label: 'Modéré',
    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    icon: ShieldAlert,
  },
  eleve: {
    label: 'Élevé',
    className: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    icon: AlertTriangle,
  },
  critique: {
    label: 'Critique',
    className: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    icon: AlertTriangle,
  },
};

export function RiskLevelBadge({ level, label }: { level: RiskLevelLabel; label?: string }) {
  const meta = RISK_STYLES[level];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
        meta.className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label ?? meta.label}
    </span>
  );
}

/** Carte de section homogène (titre + icône + contenu). */
export function StudyCard({
  title,
  icon,
  description,
  action,
  children,
  className,
  id,
}: {
  title: string;
  icon?: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <Card as="section" id={id} className={cn('scroll-mt-24', className)}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            {description ? (
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

/** Libellé + contenu (utilisé dans les grilles de présentation). */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      {children}
    </div>
  );
}

const CALLOUT_STYLES = {
  info: {
    wrap: 'border-sky-200 bg-sky-50/70 text-sky-900',
    icon: 'text-sky-600',
    Icon: Info,
  },
  warning: {
    wrap: 'border-amber-200 bg-amber-50/70 text-amber-900',
    icon: 'text-amber-600',
    Icon: AlertTriangle,
  },
  danger: {
    wrap: 'border-rose-200 bg-rose-50/70 text-rose-900',
    icon: 'text-rose-600',
    Icon: AlertTriangle,
  },
  success: {
    wrap: 'border-emerald-200 bg-emerald-50/70 text-emerald-900',
    icon: 'text-emerald-600',
    Icon: ShieldCheck,
  },
} as const;

export function Callout({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof CALLOUT_STYLES;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const style = CALLOUT_STYLES[tone];
  const Icon = style.Icon;
  return (
    <div className={cn('rounded-xl border px-4 py-3', style.wrap, className)}>
      <div className="flex items-start gap-2.5">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', style.icon)} aria-hidden />
        <div className="min-w-0 space-y-1 text-[13px] leading-relaxed">
          {title ? <p className="font-bold">{title}</p> : null}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}

export const SECTION_ICONS: Record<StudySectionKey, string> = {
  presentation: '📌',
  marche: '📊',
  commercial: '🤝',
  technique: '⚙️',
  organisation: '🧩',
  finance: '💰',
  risques: '⚠️',
  plan_action: '🗺️',
  conclusion: '🏁',
};

export const SECTION_SHORT_LABELS: Record<StudySectionKey, string> = {
  presentation: 'Présentation',
  marche: 'Marché',
  commercial: 'Commercial',
  technique: 'Technique',
  organisation: 'Organisation',
  finance: 'Finance',
  risques: 'Risques',
  plan_action: 'Plan d’action',
  conclusion: 'Conclusion',
};
