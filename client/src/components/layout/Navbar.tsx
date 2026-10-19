import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BarChart3, History, Info, Menu, Rocket, Sparkles, X } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { to: '/analyser', label: 'Analyser une idée', icon: Sparkles },
  { to: '/historique', label: 'Historique', icon: History },
  { to: '/a-propos', label: 'Méthodologie', icon: Info },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
      <PageContainer size="wide">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-white shadow-glow">
              <BarChart3 className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-extrabold tracking-tight text-slate-900">
                StartUpCheck <span className="gradient-text">AI</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Analyse de viabilité
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}

            <Link to="/analyser" className="btn-primary ml-2 !px-4 !py-2.5">
              <Rocket className="h-4 w-4" />
              Nouvelle analyse
            </Link>
          </nav>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Ouvrir le menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-slate-200/70 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition',
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
                    )
                  }
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              ))}
              <Link to="/analyser" onClick={() => setOpen(false)} className="btn-primary mt-2">
                <Rocket className="h-4 w-4" />
                Nouvelle analyse
              </Link>
            </nav>
          </div>
        ) : null}
      </PageContainer>
    </header>
  );
}
