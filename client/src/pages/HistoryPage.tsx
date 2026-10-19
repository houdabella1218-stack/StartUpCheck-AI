import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Inbox, Loader2, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { verdictTheme, riskTheme } from '@/lib/theme';
import { formatShortDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AnalysisSummary } from '@/types';

export function HistoryPage() {
  const [items, setItems] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.listAnalyses();
      setItems(response.items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Impossible de charger l’historique. Vérifiez que le serveur est démarré.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteAnalysis(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La suppression a échoué.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageContainer className="py-8 sm:py-10">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="brand" className="mb-3">
            Historique
          </Badge>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Analyses enregistrées
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Toutes vos analyses sont conservées localement dans une base SQLite sur votre machine.
          </p>
        </div>
        <Link to="/analyser" className="btn-primary w-full sm:w-auto">
          Nouvelle analyse
        </Link>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-bold text-rose-800">Erreur de chargement</p>
          <p className="mt-1 text-xs text-rose-700">{error}</p>
          <button type="button" onClick={() => void load()} className="btn-ghost mt-3 !py-2 text-xs">
            Réessayer
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          <span className="text-sm text-slate-600">Chargement de l'historique…</span>
        </div>
      ) : null}

      {!loading && items.length === 0 && !error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-12 pt-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Inbox className="h-7 w-7" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Aucune analyse pour le moment</h2>
              <p className="mt-2 max-w-md text-sm text-slate-600">
                Lancez votre première analyse pour voir le dashboard complet s'afficher ici.
              </p>
            </div>
            <Link to="/analyser" className="btn-primary">
              Analyser une idée
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {items.map((item, index) => {
          const verdict = verdictTheme[item.verdict];
          const risk = riskTheme[item.riskLevel];

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
            >
              <Card hover className="overflow-hidden">
                <CardContent className="flex flex-col gap-4 p-5 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke={verdict.ring}
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${(item.globalScore / 100) * 263.9} 263.9`}
                        />
                      </svg>
                      <span className="relative text-base font-extrabold tabular-nums text-slate-900">
                        {item.globalScore}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-extrabold text-slate-900">{item.projectName}</h3>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {item.sectorLabel} · 🌍 {item.marketLabel}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={cn('chip', verdict.badge)}>{verdict.label}</span>
                        <span className={cn('chip', risk.badge)}>Risque {risk.label}</span>
                        <span className="chip bg-slate-100 text-slate-500 ring-1 ring-slate-200">
                          {item.engine === 'llm' ? 'IA générative' : 'Moteur local'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {formatShortDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="no-print flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:text-rose-600 disabled:opacity-50"
                      aria-label={`Supprimer l'analyse ${item.projectName}`}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>

                    <Link to={`/resultats/${item.id}`} className="btn-primary !px-4 !py-2.5 text-xs">
                      Ouvrir
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </PageContainer>
  );
}
