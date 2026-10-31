import { AlertTriangle, Boxes, Cpu, Factory, Gauge, MapPin, Truck, Workflow } from 'lucide-react';
import type { TechnicalSection } from '@/types';
import { StudyCard } from '../StudyBlocks';
import { SECTION_INDEX } from '../StudyEditContext';
import { EditableBlock, EditableLine } from '../StudyText';

export function TechnicalView({ section }: { section: TechnicalSection }) {
  const base = `sections.${SECTION_INDEX.technique}`;

  return (
    <div className="space-y-4">
      <StudyCard
        title="Solution technique"
        icon={<Cpu className="h-4 w-4 text-brand-600" />}
        description="Description de la solution telle que vous l’avez fournie."
      >
        <EditableBlock block={section.solution} path={`${base}.solution`} />
      </StudyCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <StudyCard title="Technologies" icon={<Boxes className="h-4 w-4 text-violet-500" />}>
          <ul className="space-y-3">
            {section.technologies.map((item, index) => (
              <EditableLine key={index} block={item} path={`${base}.technologies.${index}`} />
            ))}
          </ul>
        </StudyCard>

        <StudyCard title="Équipements" icon={<Factory className="h-4 w-4 text-amber-500" />}>
          <ul className="space-y-3">
            {section.equipment.map((item, index) => (
              <EditableLine key={index} block={item} path={`${base}.equipment.${index}`} />
            ))}
          </ul>
        </StudyCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StudyCard title="Locaux et implantation" icon={<MapPin className="h-4 w-4 text-rose-500" />}>
          <EditableBlock block={section.premises} path={`${base}.premises`} />
        </StudyCard>

        <StudyCard
          title="Capacité de passage à l’échelle"
          icon={<Gauge className="h-4 w-4 text-emerald-600" />}
        >
          <EditableBlock block={section.scalability} path={`${base}.scalability`} />
        </StudyCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StudyCard title="Fournisseurs" icon={<Truck className="h-4 w-4 text-sky-500" />}>
          <ul className="space-y-3">
            {section.suppliers.map((item, index) => (
              <EditableLine key={index} block={item} path={`${base}.suppliers.${index}`} />
            ))}
          </ul>
        </StudyCard>

        <StudyCard title="Processus" icon={<Workflow className="h-4 w-4 text-brand-600" />}>
          <ol className="space-y-3">
            {section.process.map((item, index) => (
              <EditableLine
                key={index}
                block={item}
                path={`${base}.process.${index}`}
                icon={
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-50 text-[9px] font-extrabold text-brand-700">
                    {index + 1}
                  </span>
                }
              />
            ))}
          </ol>
        </StudyCard>

        <StudyCard title="Contraintes" icon={<AlertTriangle className="h-4 w-4 text-rose-500" />}>
          <ul className="space-y-3">
            {section.constraints.map((item, index) => (
              <EditableLine key={index} block={item} path={`${base}.constraints.${index}`} />
            ))}
          </ul>
        </StudyCard>
      </div>
    </div>
  );
}
