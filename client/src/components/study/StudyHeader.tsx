import {
  CalendarClock,
  Check,
  FileText,
  History,
  Loader2,
  Pencil,
  Printer,
  RefreshCw,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScoreRing } from '@/components/dashboard/ScoreRing';
import { cn } from '@/lib/utils';
import { formatShortDate } from '@/lib/format';
import type { StudyRecord, StudyStatus, StudySummary } from '@/types';
import { SourceLegend } from './SourceBadge';
import { StatusBadge } from './StudyBlocks';

const STATUS_GRADIENT: Record<StudyStatus, string> = {
  viable: 'from-emerald-500 via-teal-500 to-emerald-600',
  viable_sous_conditions: 'from-amber-400 via-orange-400 to-amber-500',
  a_retravailler: 'from-rose-500 via-rose-500 to-rose-600',
};

export function StudyHeader({
  study,
  versions,
  onSelectVersion,
  loadingVersion = false,
  onRegenerate,
  regenerating,
  editing,
  dirty,
  saving,
  onToggleEdit,
  onSave,
  onCancel,
  onPrint,
}: {
  study: StudyRecord;
  versions: StudySummary[];
  onSelectVersion: (id: string) => void;
  loadingVersion?: boolean;
  onRegenerate: () => void;
  regenerating: boolean;
  editing: boolean;
  dirty: boolean;
  saving: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onPrint: () => void;
}) {
  const financeComponent = study.meta.feasibility.components.find((c) => c.key === 'finance');
  const availableWeight = study.meta.feasibility.components
    .filter((c) => c.available)
    .reduce((sum, c) => sum + c.weight, 0);

  return (
    <Card className="overflow-hidden">
      <div className={cn('h-1.5 w-full bg-gradient-to-r', STATUS_GRADIENT[study.feasibilityStatus])} />

      <CardContent className="space-y-5 p-5 pt-5 sm:p-6 sm:pt-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={study.feasibilityStatus}
                label={study.feasibilityStatusLabel}
                size="md"
              />
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                <FileText className="h-3 w-3" aria-hidden />v{study.version}
              </span>
              {study.isCurrent ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 ring-1 ring-brand-200">
                  <Check className="h-3 w-3" aria-hidden />
                  Version active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                  Version archivée
                </span>
              )}
            </div>

            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              Étude de projet — {study.projectName}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3 w-3" aria-hidden />
                Générée le {formatShortDate(study.createdAt)}
              </span>
              {study.meta.lastEditedAt ? (
                <span className="inline-flex items-center gap-1">
                  <Pencil className="h-3 w-3" aria-hidden />
                  Modifiée le {formatShortDate(study.meta.lastEditedAt)}
                </span>
              ) : null}
              <span>Méthodologie v{study.meta.methodologyVersion}</span>
              <span>
                Moteur :{' '}
                {study.meta.engine === 'llm'
                  ? 'local + reformulation IA'
                  : 'local déterministe'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <ScoreRing
              value={study.feasibilityScore}
              size={132}
              strokeWidth={14}
              from={
                study.feasibilityStatus === 'viable'
                  ? '#10b981'
                  : study.feasibilityStatus === 'viable_sous_conditions'
                    ? '#f59e0b'
                    : '#f43f5e'
              }
              to={
                study.feasibilityStatus === 'viable'
                  ? '#14b8a6'
                  : study.feasibilityStatus === 'viable_sous_conditions'
                    ? '#fb923c'
                    : '#e11d48'
              }
              label="Faisabilité"
            />
            <div className="min-w-[150px] space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Complétude
                </p>
                <p className="text-lg font-extrabold text-slate-900">
                  {study.completenessScore}
                  <span className="text-xs font-bold text-slate-400"> /100</span>
                </p>
                <ProgressBar
                  value={study.completenessScore}
                  height="sm"
                  gradient="from-sky-400 to-brand-500"
                  className="mt-1"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Finance
                </p>
                <p className="text-sm font-bold text-slate-700">
                  {financeComponent?.available
                    ? `${financeComponent.value}/100`
                    : 'Non disponible'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Poids utilisés : {Math.round(availableWeight * 100)} %
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Mode de calcul du score de faisabilité
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
            {study.meta.feasibility.formula}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {study.meta.feasibility.components.map((component) => (
              <span
                key={component.key}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1',
                  component.available
                    ? 'bg-white text-slate-600 ring-slate-200'
                    : 'bg-slate-100 text-slate-400 ring-slate-200 line-through',
                )}
                title={component.available ? undefined : 'Composante omise et poids renormalisés'}
              >
                {component.label} · {component.value}
              </span>
            ))}
          </div>
        </div>

        {study.meta.warnings.length > 0 ? (
          <div className="space-y-2">
            {study.meta.warnings.map((warning) => (
              <div
                key={warning}
                className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-[12px] leading-relaxed text-amber-900"
              >
                <span aria-hidden className="mt-0.5">
                  ⚠️
                </span>
                <span>{warning}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Origine des contenus
            </p>
            <SourceLegend counts={study.meta.dataSources} />
            <p className="text-[11px] leading-snug text-slate-400">{study.meta.engineNotice}</p>
          </div>

          <div className="no-print flex flex-wrap items-center gap-2">
            {versions.length > 1 ? (
              <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-600">
                <History className="h-3.5 w-3.5" aria-hidden />
                <span className="sr-only">Choisir une version</span>
                <select
                  className="bg-transparent text-[11px] font-bold text-slate-700 outline-none"
                  value={study.id}
                  onChange={(event) => onSelectVersion(event.target.value)}
                  disabled={loadingVersion || editing}
                >
                  {versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      v{version.version}
                      {version.isCurrent ? ' (active)' : ''} — {version.feasibilityScore}/100
                    </option>
                  ))}
                </select>
                {loadingVersion ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600" aria-hidden />
                ) : null}
              </label>
            ) : null}

            <button type="button" className="btn-ghost" onClick={onPrint}>
              <Printer className="h-4 w-4" aria-hidden />
              Exporter en PDF
            </button>

            {editing ? (
              <>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={onCancel}
                  disabled={saving}
                >
                  <X className="h-4 w-4" aria-hidden />
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={onSave}
                  disabled={!dirty || saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Check className="h-4 w-4" aria-hidden />
                  )}
                  Enregistrer
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-ghost" onClick={onToggleEdit}>
                  <Pencil className="h-4 w-4" aria-hidden />
                  Modifier
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={onRegenerate}
                  disabled={regenerating}
                >
                  {regenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="h-4 w-4" aria-hidden />
                  )}
                  Régénérer
                </button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
