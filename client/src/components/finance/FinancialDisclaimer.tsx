import { Calculator, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

/**
 * Bandeaux de transparence du module financier :
 *  - les calculs sont déterministes (aucune IA générative) ;
 *  - les montants sont des projections, pas un conseil financier.
 */
export function FinancialDisclaimer({
  engineNotice,
  disclaimer,
}: {
  engineNotice: string;
  disclaimer: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-start sm:gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 ring-1 ring-slate-200">
          <Calculator className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800">Module financier déterministe</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{engineNotice}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-start sm:gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 ring-1 ring-amber-200">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-amber-900">Avertissement</p>
            <Badge tone="warning">Projections</Badge>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/90">{disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
