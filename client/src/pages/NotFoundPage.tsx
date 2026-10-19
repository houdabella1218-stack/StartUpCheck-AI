import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/Card';

export function NotFoundPage() {
  return (
    <PageContainer size="narrow" className="py-20">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-12 pt-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Compass className="h-7 w-7" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Erreur 404</p>
            <h1 className="mt-2 text-xl font-extrabold text-slate-900">Page introuvable</h1>
            <p className="mt-2 text-sm text-slate-600">
              La page que vous cherchez n'existe pas ou a été déplacée.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/" className="btn-ghost">
              Retour à l'accueil
            </Link>
            <Link to="/analyser" className="btn-primary">
              Lancer une analyse
            </Link>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
