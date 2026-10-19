import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Layers,
  LineChart,
  ListChecks,
  Loader2,
  Radar,
  Search,
  Target,
  Wallet,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, SectionHeading } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { GlobalScoreCard } from '@/components/dashboard/GlobalScoreCard';
import { VerdictBanner } from '@/components/dashboard/VerdictBanner';
import { ScoreBreakdown } from '@/components/dashboard/ScoreBreakdown';
import { ScoreRadar } from '@/components/dashboard/ScoreRadar';
import { RiskCard } from '@/components/dashboard/RiskCard';
import { SwotGrid } from '@/components/dashboard/SwotGrid';
import { RecommendationList } from '@/components/dashboard/RecommendationList';
import { EngineNotice } from '@/components/dashboard/EngineNotice';
import { ExportButton } from '@/components/dashboard/ExportButton';
import { useAppStore } from '@/store/analysisStore';
import { api } from '@/lib/api';
import { formatDate, formatMAD } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Analysis, FinancialCheckRecord } from '@/types';

/**
 * Le module financier (graphiques + simulateur) est chargé à la demande :
 * l'onglet "Analyse" reste aussi léger qu'avant.
 */
const FinancialPanel = lazy(() =>
  import('@/components/finance/FinancialPanel').then((module) => ({
    default: module.FinancialPanel,
  })),
);

type ResultsTab = 'analyse' | 'finance';

export function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lastAnalysis = useAppStore((s) => s.lastAnalysis);
  const setLastAnalysis = useAppStore((s) => s.setLastAnalysis);

  const [analysis, setAnalysis] = useState<Analysis | null>(
    lastAnalysis && lastAnalysis.id === id ? lastAnalysis : null,
  );
  const [loading, setLoading] = useState(!analysis);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ResultsTab>('analyse');

  const handleFinancialSaved = (record: FinancialCheckRecord) => {
    setAnalysis((previous) => {
      if (!previous) return previous;
      const updated = { ...previous, financial: record };
      setLastAnalysis(updated);
      return updated;
    });
  };

  /** Navigation clavier entre onglets (flèches gauche / droite). */
  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next: ResultsTab = tab === 'analyse' ? 'finance' : 'analyse';
    setTab(next);
    // Déplace le focus sur l'onglet activé après le rendu
    // (`setTimeout` plutôt que `requestAnimationFrame`, qui est suspendu
    // lorsque l'onglet du navigateur n'est pas au premier plan).
    window.setTimeout(() => document.getElementById(`tab-${next}`)?.focus(), 0);
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) return;
      if (analysis && analysis.id === id) return;

      setLoading(true);
      setError(null);

      try {
        const result = await api.getAnalysis(id!);
        if (cancelled) return;
        setAnalysis(result);
        setLastAnalysis(result);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger cette analyse. Vérifiez que le serveur est démarré.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading) {
    return (
      <PageContainer className="py-16">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          <p className="text-sm font-semibold">Chargement de l'analyse…</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !analysis) {
    return (
      <PageContainer size="narrow" className="py-16">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 pt-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Search className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Analyse introuvable</h1>
              <p className="mt-2 text-sm text-slate-600">
                {error ?? "Cette analyse n'existe pas ou a été supprimée."}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" className="btn-ghost" onClick={() => navigate('/historique')}>
                Voir l'historique
              </button>
              <Link to="/analyser" className="btn-primary">
                Nouvelle analyse
              </Link>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide" className="py-8 sm:py-10">
      <div className="no-print mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate('/historique')}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 transition hover:text-brand-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à l'historique
        </button>
        <ExportButton analysis={analysis} />
      </div>

      {/* Onglets : analyse de viabilité / analyse financière */}
      <div
        className="no-print mb-5 space-y-1.5"
        role="tablist"
        aria-label="Sections du rapport"
        onKeyDown={handleTabKeyDown}
      >
        <div className="inline-flex w-full flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto">
          <TabButton
            id="tab-analyse"
            controls="panel-analyse"
            active={tab === 'analyse'}
            onClick={() => setTab('analyse')}
            icon={<LineChart className="h-4 w-4" />}
            label="Analyse de viabilité"
          />
          <TabButton
            id="tab-finance"
            controls="panel-finance"
            active={tab === 'finance'}
            onClick={() => setTab('finance')}
            icon={<Wallet className="h-4 w-4" />}
            label="Finance"
            highlight={Boolean(analysis.financial)}
          />
        </div>
        <p className="text-[11px] leading-snug text-slate-400">
          L&apos;impression / l&apos;export PDF imprime la section affichée. L&apos;export JSON
          contient toujours l&apos;analyse de viabilité et les chiffres financiers.
        </p>
      </div>

      {tab === 'analyse' ? (
        <div
          id="panel-analyse"
          role="tabpanel"
          aria-labelledby="tab-analyse"
          className="space-y-6"
        >
        {/* Transparence sur l'origine du rapport */}
        <EngineNotice meta={analysis.meta} />

        {/* Score global */}
        <GlobalScoreCard analysis={analysis} />

        {/* Verdict */}
        <VerdictBanner
          verdict={analysis.verdict}
          verdictLabel={analysis.verdictLabel}
          globalScore={analysis.globalScore}
        />

        {/* Scores détaillés */}
        <section className="pt-2">
          <SectionHeading
            eyebrow="Détail de l'évaluation"
            title="Les 5 dimensions analysées"
            description="Chaque dimension est pondérée dans le score global. Le niveau de risque est inversé : un risque élevé fait baisser la viabilité."
            icon={<LineChart className="h-5 w-5 text-brand-600" />}
          />

          <div className="grid gap-4 lg:grid-cols-[420px_1fr] lg:items-start">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radar className="h-4 w-4 text-brand-600" />
                  Profil du projet
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Plus la surface est large, plus le projet est équilibré.
                </p>
              </CardHeader>
              <CardContent>
                <ScoreRadar scores={analysis.scores} />
              </CardContent>
            </Card>

            <ScoreBreakdown scores={analysis.scores} />
          </div>
        </section>

        {/* Risque + rappel des informations saisies */}
        <section className="pt-2">
          <div className="grid gap-4 lg:grid-cols-2">
            <RiskCard analysis={analysis} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-brand-600" />
                  Informations analysées
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Rappel des données utilisées pour produire ce rapport.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="brand">{analysis.sectorLabel}</Badge>
                  <Badge tone="info">🌍 {analysis.marketLabel}</Badge>
                  <Badge tone="violet">
                    <Wallet className="h-3.5 w-3.5" />
                    {formatMAD(analysis.inputs.budget)}
                  </Badge>
                  <Badge tone="neutral">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(analysis.createdAt)}
                  </Badge>
                </div>

                <InfoBlock title="Clientèle cible" value={analysis.inputs.targetClients} />
                <InfoBlock title="Description de l'idée" value={analysis.inputs.description} />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SWOT */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4 }}
          className="pt-2"
        >
          <SectionHeading
            eyebrow="Analyse stratégique"
            title="Matrice SWOT"
            description="Forces et faiblesses internes, opportunités et menaces externes identifiées pour ce projet."
            icon={<Layers className="h-5 w-5 text-brand-600" />}
          />
          <SwotGrid swot={analysis.swot} />
        </motion.section>

        {/* Recommandations */}
        <section className="pt-2">
          <SectionHeading
            eyebrow="Plan d'action"
            title="Recommandations"
            description="Conseils priorisés pour lever les points bloquants et renforcer le projet."
            icon={<ListChecks className="h-5 w-5 text-brand-600" />}
          />
          <RecommendationList recommendations={analysis.recommendations} />
        </section>

        {/* Conclusion */}
        <section className="pt-2">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Conclusion</p>
              <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">
                Justification du verdict
              </h2>
            </div>
            <CardContent className="p-6 pt-6">
              <p className="text-sm leading-relaxed text-slate-700">{analysis.verdictReason}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                <Badge tone="neutral">
                  Moteur : {analysis.meta.engine === 'llm' ? 'local + IA générative' : 'local'}
                </Badge>
                <Badge tone="neutral">Méthodologie v{analysis.meta.methodologyVersion}</Badge>
                <Badge tone="neutral">
                  Indice de confiance : {Math.round(analysis.meta.confidence * 100)} %
                </Badge>
                <Link to="/a-propos" className="text-xs font-bold text-brand-600 hover:underline">
                  Comprendre la méthode de calcul →
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="no-print flex flex-wrap justify-center gap-3 pt-4">
          <Link to="/analyser" className="btn-primary">
            Analyser une autre idée
          </Link>
          <Link to="/historique" className="btn-ghost">
            Voir l'historique
          </Link>
        </div>
        </div>
      ) : (
        <div id="panel-finance" role="tabpanel" aria-labelledby="tab-finance">
          <Suspense
            fallback={
              <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
                <p className="text-sm font-semibold">Chargement du module financier…</p>
              </div>
            }
          >
            {/* `key` : garantit la réinitialisation du panneau si l'analyse change */}
            <FinancialPanel
              key={analysis.id}
              analysis={analysis}
              onSaved={handleFinancialSaved}
            />
          </Suspense>
        </div>
      )}
    </PageContainer>
  );
}

/** Bouton d'onglet accessible (rôle tab + navigation clavier). */
function TabButton({
  id,
  controls,
  active,
  onClick,
  icon,
  label,
  highlight = false,
}: {
  id: string;
  controls: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <button
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition sm:flex-none',
        active
          ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-sm'
          : 'text-slate-500 hover:bg-slate-50 hover:text-brand-700',
      )}
    >
      {icon}
      {label}
      {highlight && !active ? (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
      ) : null}
    </button>
  );
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-slate-700">{value}</p>
    </div>
  );
}
