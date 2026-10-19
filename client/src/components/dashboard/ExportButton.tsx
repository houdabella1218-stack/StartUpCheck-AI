import { Download, Printer } from 'lucide-react';
import type { Analysis } from '@/types';

/**
 * Export du rapport : impression / PDF (via l'impression navigateur)
 * et téléchargement du rapport au format JSON.
 */
export function ExportButton({ analysis }: { analysis: Analysis }) {
  const handleDownload = () => {
    const payload = {
      application: 'StartUpCheck AI',
      genereLe: new Date().toISOString(),
      analyse: analysis,
      analyseFinanciere: analysis.financial ?? null,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `startupcheck-${slugify(analysis.projectName)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="no-print flex flex-wrap gap-2">
      <button type="button" className="btn-ghost" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Imprimer / PDF
      </button>
      <button type="button" className="btn-ghost" onClick={handleDownload}>
        <Download className="h-4 w-4" />
        Exporter (JSON)
      </button>
    </div>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
