import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { ScoreResult } from '@/types';

type ScoreRadarProps = {
  scores: ScoreResult[];
};

/**
 * Graphique radar des 5 dimensions.
 * Le niveau de risque est inversé à l'affichage : un point éloigné du centre
 * signifie toujours un facteur FAVORABLE.
 */
export function ScoreRadar({ scores }: ScoreRadarProps) {
  const data = scores.map((score) => ({
    dimension: shortLabel(score.label),
    fullLabel: score.label,
    valeur: score.inverted ? 100 - score.value : score.value,
    brut: score.value,
    inverted: score.inverted,
  }));

  return (
    <div className="h-[300px] w-full sm:h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <defs>
            <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0.18} />
            </linearGradient>
          </defs>

          <PolarGrid stroke="rgba(148,163,184,0.35)" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />

          <Radar
            name="Score"
            dataKey="valeur"
            stroke="#4f46e5"
            strokeWidth={2.5}
            fill="url(#radarFill)"
            fillOpacity={1}
            isAnimationActive
            animationDuration={1100}
          />

          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload as (typeof data)[number];
              return (
                <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-card backdrop-blur">
                  <p className="text-xs font-bold text-slate-900">{item.fullLabel}</p>
                  <p className="text-xs text-slate-500">
                    {item.inverted
                      ? `Risque : ${item.brut}/100 (inversé sur le radar)`
                      : `Score : ${item.brut}/100`}
                  </p>
                </div>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function shortLabel(label: string): string {
  const map: Record<string, string> = {
    'Potentiel du marché': 'Marché',
    Faisabilité: 'Faisabilité',
    Innovation: 'Innovation',
    'Potentiel de croissance': 'Croissance',
    'Niveau de risque': 'Risque',
  };
  return map[label] ?? label;
}
