import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type {
  Analysis,
  StudyEdit,
  StudyRecord,
  StudySection,
  StudySectionKey,
  StudySummary,
} from '@/types';
import { Callout } from './StudyBlocks';
import { StudyEditProvider } from './StudyEditContext';
import { StudyHeader } from './StudyHeader';
import { StudyNav } from './StudyNav';
import { collectTextsByPath } from './paths';
import { CommercialView } from './sections/CommercialView';
import { ConclusionView } from './sections/ConclusionView';
import { FinanceView } from './sections/FinanceView';
import { MarketView } from './sections/MarketView';
import { OrganizationView } from './sections/OrganizationView';
import { PresentationView } from './sections/PresentationView';
import { RisksView } from './sections/RisksView';
import { RoadmapView } from './sections/RoadmapView';
import { TechnicalView } from './sections/TechnicalView';

const EMPTY_SECTIONS: Array<{ key: StudySectionKey; title: string }> = [
  { key: 'presentation', title: 'Présentation' },
  { key: 'marche', title: 'Étude de marché' },
  { key: 'commercial', title: 'Étude commerciale' },
  { key: 'technique', title: 'Étude technique' },
  { key: 'organisation', title: 'Étude organisationnelle' },
  { key: 'finance', title: 'Étude financière' },
  { key: 'risques', title: 'Analyse des risques' },
  { key: 'plan_action', title: 'Plan d’action' },
  { key: 'conclusion', title: 'Conclusion' },
];

function SectionRenderer({
  section,
  study,
  onOpenFinanceTab,
}: {
  section: StudySection;
  study: StudyRecord;
  onOpenFinanceTab: () => void;
}) {
  switch (section.key) {
    case 'presentation':
      return <PresentationView section={section} />;
    case 'marche':
      return <MarketView section={section} />;
    case 'commercial':
      return <CommercialView section={section} />;
    case 'technique':
      return <TechnicalView section={section} />;
    case 'organisation':
      return <OrganizationView section={section} />;
    case 'finance':
      return <FinanceView section={section} onOpenFinanceTab={onOpenFinanceTab} />;
    case 'risques':
      return <RisksView section={section} risks={study.risks} />;
    case 'plan_action':
      return <RoadmapView section={section} roadmap={study.roadmap} />;
    case 'conclusion':
      return <ConclusionView section={section} />;
  }
}

export function StudyPanel({
  analysis,
  onOpenFinanceTab,
}: {
  analysis: Analysis;
  onOpenFinanceTab: () => void;
}) {
  const [study, setStudy] = useState<StudyRecord | null>(null);
  const [versions, setVersions] = useState<StudySummary[]>([]);
  const [activeKey, setActiveKey] = useState<StudySectionKey>('presentation');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [loadingVersion, setLoadingVersion] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const original = useMemo(() => (study ? collectTextsByPath(study) : {}), [study]);

  const dirty =
    editing &&
    Object.entries(drafts).some(
      ([path, value]) => value.trim() !== (original[path] ?? '').trim(),
    );

  const refreshVersions = useCallback(async () => {
    const { items } = await api.listProjectStudies(analysis.id);
    setVersions(items);
  }, [analysis.id]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const current = await api.getCurrentProjectStudy(analysis.id);
        const { items } = await api.listProjectStudies(analysis.id);
        if (cancelled) return;
        setStudy(current);
        setVersions(items);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setStudy(null);
          setVersions([]);
        } else {
          setError(err instanceof Error ? err.message : 'Erreur inconnue.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [analysis.id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const record = await api.createProjectStudy(analysis.id);
      setStudy(record);
      setActiveKey('presentation');
      await refreshVersions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La génération a échoué.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!study) return;
    const confirmed = window.confirm(
      'Régénérer l’étude ? Une nouvelle version sera créée à partir de l’analyse et du Financial Check actuels. Les versions précédentes restent accessibles.',
    );
    if (!confirmed) return;

    setRegenerating(true);
    setError(null);
    try {
      const record = await api.regenerateProjectStudy(study.id);
      setStudy(record);
      setEditing(false);
      setDrafts({});
      await refreshVersions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La régénération a échoué.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleSelectVersion = async (id: string) => {
    if (!study || id === study.id) return;
    setLoadingVersion(true);
    setError(null);
    try {
      const record = await api.getProjectStudy(id);
      setStudy(record);
      setEditing(false);
      setDrafts({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger cette version.');
    } finally {
      setLoadingVersion(false);
    }
  };

  const handleToggleEdit = () => {
    if (!study) return;
    setDrafts(collectTextsByPath(study));
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setDrafts({});
  };

  const handleSave = async () => {
    if (!study) return;

    const edits: StudyEdit[] = Object.entries(drafts)
      .filter(([path, value]) => value.trim() !== (original[path] ?? '').trim())
      .map(([path, text]) => ({ path, text: text.trim() }));

    if (edits.length === 0) {
      setEditing(false);
      return;
    }

    if (edits.some((edit) => edit.text.length === 0)) {
      setError('Un texte modifié ne peut pas être vide.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const record = await api.updateProjectStudy(study.id, edits);
      setStudy(record);
      setEditing(false);
      setDrafts({});
      await refreshVersions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'L’enregistrement a échoué.');
    } finally {
      setSaving(false);
    }
  };

  const handleDraftChange = (path: string, value: string) => {
    setDrafts((current) => ({ ...current, [path]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" aria-hidden />
          Chargement de l’étude de projet…
        </CardContent>
      </Card>
    );
  }

  if (error && !study) {
    return (
      <Card>
        <CardContent className="space-y-3 py-12 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" aria-hidden />
          <p className="text-sm font-semibold text-slate-700">{error}</p>
          <button type="button" className="btn-ghost" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Réessayer
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!study) {
    return (
      <Card className="overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 via-violet-500 to-fuchsia-500" />
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-brand-50 p-2.5 text-brand-600">
              <Wand2 className="h-6 w-6" aria-hidden />
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                Générer l’étude de projet
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">
                L’étude réutilise automatiquement votre analyse, le SWOT, les scores et le
                Financial Check. Aucune donnée n’est à ressaisir.
              </p>
            </div>
          </div>

          <ul className="grid gap-2 sm:grid-cols-3">
            {EMPTY_SECTIONS.map((section, index) => (
              <li
                key={section.key}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-[12px] font-semibold text-slate-600"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-brand-700 ring-1 ring-slate-200">
                  {index + 1}
                </span>
                {section.title}
              </li>
            ))}
          </ul>

          <Callout tone="info" title="Transparence">
            Chaque bloc de texte indique son origine : <strong>saisie</strong>,{' '}
            <strong>calculé</strong>, <strong>hypothèse</strong> ou <strong>IA</strong>. Les scores et
            les chiffres financiers sont toujours calculés localement.
          </Callout>

          {!analysis.financial ? (
            <Callout tone="warning" title="Financial Check absent">
              La section Finance affichera « Données financières non disponibles » : aucun chiffre
              ne sera inventé. La composante Finance sera omise du score de faisabilité et les poids
              restants seront renormalisés.
            </Callout>
          ) : null}

          {error ? (
            <Callout tone="danger" title="Erreur">
              {error}
            </Callout>
          ) : null}

          <button
            type="button"
            className="btn-primary"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            Générer l’étude de projet
          </button>
        </CardContent>
      </Card>
    );
  }

  const sections = study.sections.map((section) => ({
    key: section.key,
    title: section.title,
  }));
  const activeIndex = sections.findIndex((section) => section.key === activeKey);
  const activeSection = study.sections.find((section) => section.key === activeKey);

  return (
    <div className="space-y-4">
      <div className="no-print space-y-4">
        <StudyHeader
          study={study}
          versions={versions}
          onSelectVersion={handleSelectVersion}
          loadingVersion={loadingVersion}
          onRegenerate={handleRegenerate}
          regenerating={regenerating}
          editing={editing}
          dirty={dirty}
          saving={saving}
          onToggleEdit={handleToggleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          onPrint={handlePrint}
        />

        {error ? (
          <Callout tone="danger" title="Erreur">
            {error}
          </Callout>
        ) : null}

        {editing ? (
          <Callout tone="info" title="Mode édition">
            Seuls les textes sont modifiables. Les scores, les risques et les chiffres financiers
            restent calculés par le moteur et ne peuvent pas être saisis à la main.
          </Callout>
        ) : null}

        <StudyNav sections={sections} activeKey={activeKey} onChange={setActiveKey} />

        <StudyEditProvider editing={editing} drafts={drafts} onChange={handleDraftChange}>
          <div
            id={`study-panel-${activeKey}`}
            role="tabpanel"
            aria-labelledby={`study-tab-${activeKey}`}
            className="space-y-4"
          >
            {activeSection ? (
              <SectionRenderer
                section={activeSection}
                study={study}
                onOpenFinanceTab={onOpenFinanceTab}
              />
            ) : null}
          </div>
        </StudyEditProvider>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              const previous = sections[Math.max(0, activeIndex - 1)];
              if (previous) setActiveKey(previous.key);
            }}
            disabled={activeIndex <= 0}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Section précédente
          </button>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            {study.projectName}
          </span>

          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              const next = sections[Math.min(sections.length - 1, activeIndex + 1)];
              if (next) setActiveKey(next.key);
            }}
            disabled={activeIndex >= sections.length - 1}
          >
            Section suivante
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Version imprimable : toutes les sections, sans navigation. */}
      <div className="hidden print:block">
        <div className="mb-6 border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Étude de projet — {study.projectName}
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {study.feasibilityStatusLabel} · Score de faisabilité {study.feasibilityScore}/100 ·
            Version {study.version}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{study.meta.engineNotice}</p>
        </div>

        <div className="space-y-6">
          {study.sections.map((section) => (
            <section key={section.key} className={cn('study-print-section space-y-2')}>
              <h2 className="text-lg font-extrabold text-slate-900">{section.title}</h2>
              <SectionRenderer
                section={section}
                study={study}
                onOpenFinanceTab={onOpenFinanceTab}
              />
            </section>
          ))}
        </div>

        <footer className="mt-8 border-t border-slate-200 pt-3 text-[10px] leading-relaxed text-slate-500">
          <p>
            Étude générée le{' '}
            {new Date(study.meta.generatedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            · {study.meta.engineLabel} · Méthodologie v{study.meta.methodologyVersion} · Version{' '}
            {study.version}
          </p>
          <p className="mt-1">
            Les scores, les risques et les chiffres financiers sont calculés localement. Les
            hypothèses et les textes marqués « IA » ne constituent pas des données vérifiées.
          </p>
        </footer>
      </div>
    </div>
  );
}
