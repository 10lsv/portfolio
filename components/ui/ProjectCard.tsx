'use client';

import { motion } from 'framer-motion';

import { ProjectCover } from '@/components/ui/ProjectCover';
import type { Project } from '@/content/projects';
import { cn } from '@/lib/cn';

type ProjectCardProps = {
  project: Project;
  tagline: string;
  openLabel: string;
  onOpen: () => void;
};

// Card projet (2D fallback de la galerie 3D). V7 sprint chirurgical :
// StatusBadge retiré (badge "EN COURS"/"TERMINÉ"/"LIVE" supprimé partout).
// Les wrappers cover/title/year/tagline restent tagués `layoutId` pour la
// morphose Framer Motion card → modal (brief §6.7).
export function ProjectCard({
  project,
  tagline,
  openLabel,
  onOpen,
}: ProjectCardProps) {
  const { id, title, year, coverSrc, featured } = project;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={`${title} — ${openLabel}`}
      layoutId={`project-card-${id}`}
      className={cn(
        'group relative flex w-full flex-col gap-4 text-left',
        'cursor-pointer',
      )}
    >
      <motion.div
        layoutId={`project-cover-${id}`}
        className={cn(
          // V8.2 : rounded-[16px] aligné visuellement avec le canvas-clip
          // 64px sur le PNG 1600 (4% du width des deux côtés, cohérent).
          'relative aspect-[8/5] w-full overflow-hidden rounded-[16px]',
          'border border-border',
          'transition-[border-color,transform] duration-(--duration-normal) ease-(--ease-out-smooth)',
          'group-hover:border-border-hi',
        )}
      >
        <ProjectCover title={title} src={coverSrc} priority={featured} />
      </motion.div>

      <div className="flex items-baseline justify-between gap-4">
        <motion.h3
          layoutId={`project-title-${id}`}
          className={cn(
            'font-display text-h3 md:text-h2 font-semibold leading-tight',
            'text-text-1 transition-colors duration-(--duration-fast) ease-(--ease-in-out)',
            'group-hover:text-accent',
          )}
        >
          {title}
        </motion.h3>
        <motion.span
          layoutId={`project-year-${id}`}
          className="font-mono text-caption text-text-2 uppercase tracking-[0.15em]"
        >
          {year}
        </motion.span>
      </div>

      <motion.p
        layoutId={`project-tagline-${id}`}
        className="text-body-s text-text-1"
      >
        {tagline}
      </motion.p>
    </motion.button>
  );
}
