import { Building2, Globe2, Layers, Lightbulb, ListChecks, Rocket, Target, Users } from 'lucide-react';
import type { PresentationSection } from '@/types';
import { StudyCard } from '../StudyBlocks';
import { SECTION_INDEX } from '../StudyEditContext';
import { EditableBlock, EditableLine } from '../StudyText';

export function PresentationView({ section }: { section: PresentationSection }) {
  const base = `sections.${SECTION_INDEX.presentation}`;

  return (
    <div className="space-y-4">
      <StudyCard
        title="Résumé exécutif"
        icon={<Layers className="h-4 w-4 text-brand-600" />}
        description="Synthèse déterministe de l’analyse existante et du niveau de faisabilité."
      >
        <EditableBlock block={section.summary} path={`${base}.summary`} />
      </StudyCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <StudyCard
          title="Problème identifié"
          icon={<Lightbulb className="h-4 w-4 text-amber-500" />}
          description="Besoin auquel le projet répond, tel qu’il ressort de votre description."
        >
          <EditableBlock block={section.problem} path={`${base}.problem`} />
        </StudyCard>

        <StudyCard
          title="Solution proposée"
          icon={<Rocket className="h-4 w-4 text-emerald-500" />}
          description="Réponse apportée par le projet."
        >
          <EditableBlock block={section.solution} path={`${base}.solution`} />
        </StudyCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StudyCard title="Clientèle cible" icon={<Users className="h-4 w-4 text-sky-500" />}>
          <EditableBlock block={section.targetClients} path={`${base}.targetClients`} />
        </StudyCard>

        <StudyCard title="Secteur d’activité" icon={<Building2 className="h-4 w-4 text-violet-500" />}>
          <EditableBlock block={section.sector} path={`${base}.sector`} />
        </StudyCard>

        <StudyCard title="Marché visé" icon={<Globe2 className="h-4 w-4 text-teal-500" />}>
          <EditableBlock block={section.market} path={`${base}.market`} />
        </StudyCard>
      </div>

      <StudyCard
        title="Objectifs de l’étude"
        icon={<ListChecks className="h-4 w-4 text-brand-600" />}
        description="Ce que le projet doit démontrer ou atteindre pour sécuriser son lancement."
      >
        <ul className="space-y-3">
          {section.objectives.map((objective, index) => (
            <EditableLine
              key={index}
              block={objective}
              path={`${base}.objectives.${index}`}
              icon={<Target className="h-3.5 w-3.5" />}
            />
          ))}
        </ul>
      </StudyCard>
    </div>
  );
}
