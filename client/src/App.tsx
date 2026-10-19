import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/pages/HomePage';
import { AnalyzerPage } from '@/pages/AnalyzerPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { AboutPage } from '@/pages/AboutPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Le dashboard de résultats embarque la bibliothèque de graphiques (Recharts),
 * qui représente l'essentiel du poids du bundle. Il est donc chargé à la
 * demande : la page d'accueil et le formulaire restent très légers.
 */
const ResultsPage = lazy(() =>
  import('@/pages/ResultsPage').then((module) => ({ default: module.ResultsPage })),
);

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      <p className="text-sm font-semibold">Chargement du rapport…</p>
    </div>
  );
}

export function App() {
  return (
    <div className="app-shell flex min-h-screen flex-col">
      <Navbar />
      <ScrollToTop />

      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/analyser" element={<AnalyzerPage />} />
            <Route path="/resultats/:id" element={<ResultsPage />} />
            <Route path="/resultats" element={<Navigate to="/historique" replace />} />
            <Route path="/historique" element={<HistoryPage />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
