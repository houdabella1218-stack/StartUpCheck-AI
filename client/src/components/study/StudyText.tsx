import { cn } from '@/lib/utils';
import type { StudyText } from '@/types';
import { SourceBadge } from './SourceBadge';
import { useStudyEdit } from './StudyEditContext';

type CommonProps = {
  block: StudyText;
  path?: string;
  editing?: boolean;
  draft?: string;
  onDraftChange?: (path: string, value: string) => void;
  className?: string;
  showNote?: boolean;
};

/** Paragraphe avec badge de source (et édition inline si demandé). */
export function StudyTextBlock({
  block,
  path,
  editing = false,
  draft,
  onDraftChange,
  className,
  showNote = true,
}: CommonProps) {
  const canEdit = editing && Boolean(path) && Boolean(onDraftChange);

  return (
    <div className={cn('space-y-1.5', className)}>
      {canEdit ? (
        <textarea
          value={draft ?? block.text}
          onChange={(event) => onDraftChange?.(path!, event.target.value)}
          rows={Math.min(8, Math.max(3, Math.ceil((draft ?? block.text).length / 90)))}
          className="w-full resize-y rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 shadow-inner outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          aria-label="Modifier ce texte"
        />
      ) : (
        <p className="text-sm leading-relaxed text-slate-700">{block.text}</p>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <SourceBadge source={block.source} compact />
        {showNote && block.note ? (
          <span className="text-[11px] leading-snug text-slate-400">{block.note}</span>
        ) : null}
      </div>
    </div>
  );
}

/** Ligne de liste avec badge de source discret. */
export function StudyTextLine({
  block,
  path,
  editing = false,
  draft,
  onDraftChange,
  icon,
  className,
}: CommonProps & { icon?: React.ReactNode }) {
  const canEdit = editing && Boolean(path) && Boolean(onDraftChange);

  return (
    <li className={cn('flex items-start gap-2.5', className)}>
      {icon ? <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span> : null}
      <div className="min-w-0 flex-1 space-y-1">
        {canEdit ? (
          <textarea
            value={draft ?? block.text}
            onChange={(event) => onDraftChange?.(path!, event.target.value)}
            rows={2}
            className="w-full resize-y rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-[13px] leading-relaxed text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            aria-label="Modifier ce texte"
          />
        ) : (
          <p className="text-[13px] leading-relaxed text-slate-700">{block.text}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <SourceBadge source={block.source} compact />
          {block.note ? (
            <span className="text-[11px] leading-snug text-slate-400">{block.note}</span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/** Paragraphe connecté au mode édition global. */
export function EditableBlock({
  block,
  path,
  className,
  showNote = true,
}: {
  block: StudyText;
  path: string;
  className?: string;
  showNote?: boolean;
}) {
  const { editing, drafts, onChange } = useStudyEdit();
  return (
    <StudyTextBlock
      block={block}
      path={path}
      editing={editing}
      draft={drafts[path]}
      onDraftChange={onChange}
      className={className}
      showNote={showNote}
    />
  );
}

/** Ligne de liste connectée au mode édition global. */
export function EditableLine({
  block,
  path,
  icon,
  className,
}: {
  block: StudyText;
  path: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  const { editing, drafts, onChange } = useStudyEdit();
  return (
    <StudyTextLine
      block={block}
      path={path}
      editing={editing}
      draft={drafts[path]}
      onDraftChange={onChange}
      icon={icon}
      className={className}
    />
  );
}
