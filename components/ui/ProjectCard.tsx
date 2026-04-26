'use client';

import { motion } from 'framer-motion';

import { ProjectCover } from '@/components/ui/ProjectCover';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Project } from '@/content/projects';
import { cn } from '@/lib/cn';

type ProjectCardProps = {
  project: Project;
  statusLabel: string;
  tagline: string;
  openLabel: string;
  onOpen: () => void;
};

// Card projet. Les wrappers cover/title/meta/badge sont tagués `layoutId`
// pour que Framer Motion anime la morphose card → modal (brief §6.7,
// pattern par défaut). Le même layoutId doit se retrouver côté modal.
export function ProjectCard({
  project,
  statusLabel,
  tagline,
  openLabel,
  onOpen,
}: ProjectCardProps) {
  const { id, title, year, coverSrc, status, featured } = project;

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
          'relative aspect-[4/3] w-full overflow-hidden rounded-md',
          'border border-border',
          'transition-[border-color,transform] duration-(--duration-normal) ease-(--ease-out-smooth)',
          'group-hover:border-border-hi',
        )}
      >
        <ProjectCover title={title} src={coverSrc} priority={featured} />
        <motion.div
          layoutId={`project-badge-${id}`}
          className="absolute left-4 top-4"
        >
          <StatusBadge status={status} label={statusLabel} />
        </motion.div>
      </motion.div>

      <div className="flex items-baseline justify-between gap-4">
        <motion.h3
          layoutId={`project-title-${id}`}
          className={cn(
            'font-display text-h3 md:text-h2 font-semibold leading-tight',
            'text-text-0 transition-colors duration-(--duration-fast) ease-(--ease-in-out)',
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
