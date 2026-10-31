import { Briefcase, GraduationCap, Handshake, Scale, ShieldCheck, Users } from 'lucide-react';
import type { OrganizationSection } from '@/types';
import { PriorityBadge, StudyCard } from '../StudyBlocks';
import { SECTION_INDEX } from '../StudyEditContext';
import { EditableBlock, EditableLine } from '../StudyText';

export function OrganizationView({ section }: { section: OrganizationSection }) {
  const base = `sections.${SECTION_INDEX.organisation}`;

  return (
    <div className="space-y-4">
      <StudyCard
        title="Équipe et dimensionnement"
        icon={<Users className="h-4 w-4 text-brand-600" />}
        description="Hypothèse de dimensionnement à ajuster selon vos contraintes réelles."
      >
        <EditableBlock block={section.team} path={`${base}.team`} />
      </StudyCard>

      <StudyCard
        title="Rôles clés"
        icon={<Briefcase className="h-4 w-4 text-violet-500" />}
        description="Rôles à couvrir au démarrage, classés par priorité."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-left text-[13px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                <th className="px-3 pb-1 font-bold">Rôle</th>
                <th className="px-3 pb-1 font-bold">Mission</th>
                <th className="px-3 pb-1 font-bold">Priorité</th>
              </tr>
            </thead>
            <tbody>
              {section.roles.map((role) => (
                <tr key={role.role} className="rounded-xl bg-slate-50/80">
                  <td className="rounded-l-xl px-3 py-2.5 font-bold text-slate-800">{role.role}</td>
                  <td className="px-3 py-2.5 text-slate-600">{role.mission}</td>
                  <td className="rounded-r-xl px-3 py-2.5">
                    <PriorityBadge priority={role.priority} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StudyCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <StudyCard
          title="Compétences requises"
          icon={<GraduationCap className="h-4 w-4 text-sky-500" />}
        >
          <ul className="space-y-3">
            {section.skills.map((skill, index) => (
              <EditableLine
                key={index}
                block={skill}
                path={`${base}.skills.${index}`}
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
              />
            ))}
          </ul>
        </StudyCard>

        <StudyCard
          title="Partenaires et appuis"
          icon={<Handshake className="h-4 w-4 text-emerald-600" />}
        >
          <ul className="space-y-3">
            {section.partners.map((partner, index) => (
              <EditableLine key={index} block={partner} path={`${base}.partners.${index}`} />
            ))}
          </ul>
        </StudyCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StudyCard title="Pilotage" icon={<Briefcase className="h-4 w-4 text-brand-600" />}>
          <EditableBlock block={section.management} path={`${base}.management`} />
        </StudyCard>

        <StudyCard title="Cadre juridique" icon={<Scale className="h-4 w-4 text-amber-600" />}>
          <EditableBlock block={section.legal} path={`${base}.legal`} />
        </StudyCard>
      </div>
    </div>
  );
}
