'use client';

import { useTranslations } from 'next-intl';

import { ProjectCard } from '@/components/ui/ProjectCard';
import { PROJECTS, type ProjectStatus } from '@/content/projects';

const STATUS_KEY_MAP: Record<ProjectStatus, 'live' | 'wip' | 'offline'> = {
  live: 'live',
  wip: 'wip',
  offline: 'offline',
};

type Gallery2DGridProps = {
  onOpen: (id: string) => void;
};

// Grille 2D projets (Sprint 3). Utilisée :
//  - en mode 2D pur (mobile, WebGL off, reduced-motion)
//  - comme fallback Suspense pendant le parse/init du chunk 3D en mode desktop
// Même visuel dans les deux cas → continuité quand la scène 3D prend le relais.
export function Gallery2DGrid({ onOpen }: Gallery2DGridProps) {
  const t = useTranslations('projects');

  return (
    <div
      data-projects-grid
      className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12 lg:grid-cols-3"
    >
      {PROJECTS.map((project) => {
        const statusKey = STATUS_KEY_MAP[project.status];
        return (
          <div key={project.id} data-projects-card>
            <ProjectCard
              project={project}
              statusLabel={t(`status.${statusKey}`)}
              tagline={t(`items.${project.id}.tagline`)}
              openLabel={t('cardOpen')}
              onOpen={() => onOpen(project.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
