import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { IdeaForm } from '@/components/form/IdeaForm';
import { AnalysisLoading, ErrorBanner } from '@/components/feedback/AnalysisLoading';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/store/analysisStore';
import { api, ApiError } from '@/lib/api';
import type { CreateAnalysisPayload } from '@/types';

export function AnalyzerPage() {
  const navigate = useNavigate();
  const { meta, metaLoading, metaError, loadMeta, setLastAnalysis } = useAppStore();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Array<{ field: string; message: string }>>([]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const handleSubmit = async (input: CreateAnalysisPayload) => {
    setAnalyzing(true);
    setError(null);
    setFieldErrors([]);

    try {
      const analysis = await api.createAnalysis(input);
      setLastAnalysis(analysis);
      // Petit délai pour laisser l'animation se terminer naturellement.
      await new Promise((resolve) => setTimeout(resolve, 700));
      navigate(`/resultats/${analysis.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.details);
      } else {
        setError(err instanceof Error ? err.message : "Une erreur inattendue s'est produite.");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <PageContainer className="py-8 sm:py-10">
      {analyzing ? <AnalysisLoading /> : null}

      <button
        type="button"
        onClick={() => navigate('/')}
        className="no-print mb-5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour à l'accueil
      </button>

      <div className="mb-7">
        <Badge tone="brand" className="mb-3">
          Étape 1 sur 2
        </Badge>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Décrivez votre idée de business
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Renseignez les informations ci-dessous. Plus votre description est précise, plus l'analyse
          sera pertinente : problème résolu, solution proposée et modèle économique.
        </p>
      </div>

      {error ? (
        <div className="mb-5">
          <ErrorBanner message={error} onRetry={() => setError(null)} />
          {fieldErrors.length > 0 ? (
            <ul className="mt-3 space-y-1 rounded-xl border border-rose-100 bg-white p-3">
              {fieldErrors.map((detail) => (
                <li key={detail.field} className="text-xs text-rose-700">
                  <span className="font-bold">{detail.field}</span> : {detail.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {metaLoading && !meta ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-8 pt-8">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
            <span className="text-sm text-slate-600">Chargement des référentiels…</span>
          </CardContent>
        </Card>
      ) : null}

      {metaError && !meta ? (
        <ErrorBanner
          message={`${metaError} Le serveur d'analyse doit être démarré : lancez « npm run dev » à la racine du projet.`}
          onRetry={() => void loadMeta()}
        />
      ) : null}

      {meta ? <IdeaForm meta={meta} loading={analyzing} onSubmit={handleSubmit} /> : null}

      {meta ? (
        <Card className="mt-6 border-slate-200 bg-slate-50/60">
          <CardContent className="flex items-start gap-3 p-4 pt-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p className="text-xs leading-relaxed text-slate-500">
              <span className="font-bold text-slate-700">Transparence.</span> Les scores sont calculés
              par des règles de calcul locales appliquées à des barèmes sectoriels : le résultat est
              reproductible et ne dépend d'aucun service externe. L'origine exacte du texte du rapport
              (règles internes ou IA générative) est toujours indiquée sur le dashboard
              {meta.engine.llmConfigured
                ? ' — un enrichissement par IA générative est actuellement configuré.'
                : " — aucun enrichissement par IA générative n'est configuré pour le moment."}
              {meta.engine.financial
                ? " Le module « Finance » calcule vos indicateurs financiers de façon déterministe, sans aucune IA générative."
                : ''}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}
