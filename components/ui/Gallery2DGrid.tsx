'use client';

import { useTranslations } from 'next-intl';

import { ProjectCard } from '@/components/ui/ProjectCard';
import { PROJECTS } from '@/content/projects';

type Gallery2DGridProps = {
  onOpen: (id: string) => void;
};

// Grille 2D projets (Sprint 3 + V7 chirurgical). Utilisée :
//  - en mode 2D pur (mobile, WebGL off, reduced-motion)
//  - comme fallback Suspense pendant le parse/init du chunk 3D en mode desktop
// V7 : statusLabel retiré du contrat ProjectCard (StatusBadge supprimé partout).
export function Gallery2DGrid({ onOpen }: Gallery2DGridProps) {
  const t = useTranslations('projects');

  return (
    <div
      data-projects-grid
      className="grid grid-cols-1 gap-10 md:gap-12 lg:grid-cols-2"
    >
      {PROJECTS.map((project) => (
        <div key={project.id} data-projects-card>
          <ProjectCard
            project={project}
            tagline={t(`items.${project.id}.tagline`)}
            openLabel={t('cardOpen')}
            onOpen={() => onOpen(project.id)}
          />
        </div>
      ))}
    </div>
  );
}
