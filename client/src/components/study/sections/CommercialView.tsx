import { BadgeDollarSign, Handshake, Megaphone, MessageSquareHeart, Package, Radio, Target } from 'lucide-react';
import type { CommercialSection } from '@/types';
import { StudyCard } from '../StudyBlocks';
import { SECTION_INDEX } from '../StudyEditContext';
import { EditableBlock, EditableLine } from '../StudyText';

export function CommercialView({ section }: { section: CommercialSection }) {
  const base = `sections.${SECTION_INDEX.commercial}`;

  return (
    <div className="space-y-4">
      <StudyCard
        title="Proposition de valeur"
        icon={<Target className="h-4 w-4 text-brand-600" />}
        description="Ce que le projet apporte concrètement à sa cible."
      >
        <EditableBlock block={section.valueProposition} path={`${base}.valueProposition`} />
      </StudyCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <StudyCard title="Offre" icon={<Package className="h-4 w-4 text-violet-500" />}>
          <EditableBlock block={section.offer} path={`${base}.offer`} />
        </StudyCard>

        <StudyCard
          title="Politique tarifaire"
          icon={<BadgeDollarSign className="h-4 w-4 text-emerald-600" />}
        >
          <EditableBlock block={section.pricing} path={`${base}.pricing`} />
        </StudyCard>
      </div>

      <StudyCard
        title="Canaux de distribution"
        icon={<Radio className="h-4 w-4 text-sky-500" />}
        description="Canaux cohérents avec le niveau d’adoption numérique du marché."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {section.channels.map((channel, index) => (
            <EditableLine
              key={index}
              block={channel}
              path={`${base}.channels.${index}`}
              icon={<Handshake className="h-3.5 w-3.5" />}
            />
          ))}
        </ul>
      </StudyCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <StudyCard title="Communication" icon={<Megaphone className="h-4 w-4 text-amber-500" />}>
          <EditableBlock block={section.communication} path={`${base}.communication`} />
        </StudyCard>

        <StudyCard title="Acquisition" icon={<Target className="h-4 w-4 text-brand-600" />}>
          <EditableBlock block={section.acquisition} path={`${base}.acquisition`} />
        </StudyCard>

        <StudyCard
          title="Fidélisation"
          icon={<MessageSquareHeart className="h-4 w-4 text-rose-500" />}
        >
          <EditableBlock block={section.retention} path={`${base}.retention`} />
        </StudyCard>
      </div>
    </div>
  );
}
