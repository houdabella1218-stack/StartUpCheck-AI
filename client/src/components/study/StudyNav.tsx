import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn } from '@/lib/utils';
import type { StudySectionKey } from '@/types';
import { SECTION_ICONS, SECTION_SHORT_LABELS } from './StudyBlocks';

export function StudyNav({
  sections,
  activeKey,
  onChange,
}: {
  sections: Array<{ key: StudySectionKey; title: string }>;
  activeKey: StudySectionKey;
  onChange: (key: StudySectionKey) => void;
}) {
  const index = Math.max(
    0,
    sections.findIndex((section) => section.key === activeKey),
  );
  const progress = ((index + 1) / sections.length) * 100;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 1 : -1;
    const next = sections[(index + delta + sections.length) % sections.length];
    if (next) {
      onChange(next.key);
      window.setTimeout(() => document.getElementById(`study-tab-${next.key}`)?.focus(), 0);
    }
  };

  return (
    <div className="no-print space-y-2">
      <div
        className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm"
        role="tablist"
        aria-label="Sections de l’étude de projet"
        onKeyDown={handleKeyDown}
      >
        {sections.map((section, position) => {
          const active = section.key === activeKey;
          return (
            <button
              key={section.key}
              id={`study-tab-${section.key}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`study-panel-${section.key}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(section.key)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition',
                active
                  ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-brand-700',
              )}
            >
              <span
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-extrabold',
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
                )}
                aria-hidden
              >
                {position + 1}
              </span>
              <span aria-hidden>{SECTION_ICONS[section.key]}</span>
              {SECTION_SHORT_LABELS[section.key]}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 px-1">
        <ProgressBar
          value={progress}
          height="sm"
          gradient="from-brand-500 to-violet-500"
          className="flex-1"
        />
        <span className="text-[11px] font-bold text-slate-400">
          Section {index + 1} / {sections.length}
        </span>
      </div>
    </div>
  );
}
