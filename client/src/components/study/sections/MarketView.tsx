import { AlertTriangle, BarChart3, Compass, Flag, Swords, TrendingUp, Users } from 'lucide-react';
import type { MarketSection } from '@/types';
import { Callout, StudyCard } from '../StudyBlocks';
import { SECTION_INDEX } from '../StudyEditContext';
import { EditableBlock, EditableLine } from '../StudyText';

export function MarketView({ section }: { section: MarketSection }) {
  const base = `sections.${SECTION_INDEX.marche}`;

  return (
    <div className="space-y-4">
      <Callout tone="warning" title="Périmètre des données de marché">
        <EditableBlock block={section.notice} path={`${base}.notice`} showNote={false} />
      </Callout>

      <StudyCard
        title="Vue d’ensemble du marché"
        icon={<BarChart3 className="h-4 w-4 text-brand-600" />}
        description="Indices heuristiques de cadrage : ils ne remplacent pas une étude de marché chiffrée."
      >
        <EditableBlock block={section.overview} path={`${base}.overview`} />
        <EditableBlock block={section.demand} path={`${base}.demand`} />
      </StudyCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <StudyCard
          title="Segments de clientèle"
          icon={<Users className="h-4 w-4 text-sky-500" />}
        >
          <ul className="space-y-3">
            {section.targetSegments.map((segment, index) => (
              <EditableLine
                key={index}
                block={segment}
                path={`${base}.targetSegments.${index}`}
                icon={<Users className="h-3.5 w-3.5" />}
              />
            ))}
          </ul>
        </StudyCard>

        <StudyCard
          title="Concurrence"
          icon={<Swords className="h-4 w-4 text-rose-500" />}
        >
          <EditableBlock block={section.competition} path={`${base}.competition`} />
        </StudyCard>
      </div>

      <StudyCard
        title="Tendances sectorielles"
        icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
        description="Mouvements de fond issus du catalogue sectoriel StartUpCheck."
      >
        <ul className="space-y-3">
          {section.trends.map((trend, index) => (
            <EditableLine
              key={index}
              block={trend}
              path={`${base}.trends.${index}`}
              icon={<Compass className="h-3.5 w-3.5" />}
            />
          ))}
        </ul>
      </StudyCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <StudyCard
          title="Opportunités"
          icon={<Flag className="h-4 w-4 text-emerald-600" />}
          className="border-emerald-100"
        >
          <ul className="space-y-3">
            {section.opportunities.length > 0 ? (
              section.opportunities.map((item, index) => (
                <EditableLine
                  key={index}
                  block={item}
                  path={`${base}.opportunities.${index}`}
                  icon={<span className="text-emerald-500">▲</span>}
                />
              ))
            ) : (
              <li className="text-[13px] text-slate-400">Aucune opportunité identifiée.</li>
            )}
          </ul>
        </StudyCard>

        <StudyCard
          title="Menaces"
          icon={<AlertTriangle className="h-4 w-4 text-rose-600" />}
          className="border-rose-100"
        >
          <ul className="space-y-3">
            {section.threats.length > 0 ? (
              section.threats.map((item, index) => (
                <EditableLine
                  key={index}
                  block={item}
                  path={`${base}.threats.${index}`}
                  icon={<span className="text-rose-500">▼</span>}
                />
              ))
            ) : (
              <li className="text-[13px] text-slate-400">Aucune menace identifiée.</li>
            )}
          </ul>
        </StudyCard>
      </div>
    </div>
  );
}
