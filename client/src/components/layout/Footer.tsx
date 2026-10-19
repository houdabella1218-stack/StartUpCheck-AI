import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';

export function Footer() {
  return (
    <footer className="no-print mt-16 border-t border-slate-200/70 bg-white/60">
      <PageContainer size="wide">
        <div className="flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 text-white">
              <BarChart3 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">
                StartUpCheck <span className="gradient-text">AI</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Projet universitaire · analyse de viabilité d'idées de business
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
            <Link to="/analyser" className="transition hover:text-brand-600">
              Analyser
            </Link>
            <Link to="/historique" className="transition hover:text-brand-600">
              Historique
            </Link>
            <Link to="/a-propos" className="transition hover:text-brand-600">
              Méthodologie
            </Link>
            <span className="text-slate-300">|</span>
            <span>Devise : MAD (DH)</span>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
