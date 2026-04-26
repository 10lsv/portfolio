'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Github, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef } from 'react';

import { ProjectCover } from '@/components/ui/ProjectCover';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Project } from '@/content/projects';
import { cn } from '@/lib/cn';
import { lockScroll, unlockScroll } from '@/lib/scrollLock';

type ModalLabels = {
  close: string;
  visit: string;
  source: string;
  stackLabel: string;
  yearLabel: string;
  roleLabel: string;
  statusLabel: string;
  tagline: string;
  description: string;
  role: string;
};

export type ModalOrigin = { x: number; y: number };

type ProjectModalProps = {
  project: Project | null;
  labels: ModalLabels | null;
  onClose: () => void;
  /**
   * Si fourni (mode 3D, brief §6.7.1) : le modal apparaît en crossfade + scale
   * depuis ce point en coordonnées viewport. Sinon : layoutId morph depuis la
   * card 2D source.
   */
  origin?: ModalOrigin | null;
};

// Modal projet.
// A11y : role=dialog + aria-modal, Escape ferme, focus posé sur le bouton
// close à l'ouverture. Le scroll est verrouillé (body + Lenis) pendant
// l'affichage.
export function ProjectModal({
  project,
  labels,
  onClose,
  origin,
}: ProjectModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const isOpen = project !== null && labels !== null;
  const hasOrigin = !!origin;

  useEffect(() => {
    if (!isOpen) return;

    lockScroll();

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);

    const raf = requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', handler);
      unlockScroll();
    };
  }, [isOpen, onClose]);

  // Offset initial pour l'entrée depuis origin (mode 3D) : on exprime la
  // translation comme "delta par rapport au centre de viewport", ainsi le
  // modal flex-centré peut juste animer x/y à 0 en fin de transition.
  const originOffset = useMemo(() => {
    if (!origin || typeof window === 'undefined') return { x: 0, y: 0 };
    return {
      x: origin.x - window.innerWidth / 2,
      y: origin.y - window.innerHeight / 2,
    };
  }, [origin]);

  return (
    <AnimatePresence>
      {isOpen && project && labels && (
        <div
          key="project-modal-root"
          className={cn(
            'fixed inset-0 z-50 flex overflow-y-auto p-4 md:p-10',
            hasOrigin
              ? 'items-center justify-center'
              : 'items-start justify-center',
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`project-modal-title-${project.id}`}
        >
          <motion.button
            type="button"
            aria-label={labels.close}
            onClick={onClose}
            className="absolute inset-0 size-full cursor-default bg-bg-0/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {hasOrigin ? (
            <motion.div
              className={cn(
                'relative z-10 flex w-full max-w-[960px] flex-col gap-8',
                'rounded-lg border border-border bg-bg-1 p-6 md:p-10',
              )}
              initial={{
                x: originOffset.x,
                y: originOffset.y,
                scale: 0.12,
                opacity: 0,
              }}
              animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              exit={{
                x: originOffset.x,
                y: originOffset.y,
                scale: 0.12,
                opacity: 0,
              }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <ModalInner
                project={project}
                labels={labels}
                onClose={onClose}
                closeBtnRef={closeBtnRef}
                skipLayoutIds
              />
            </motion.div>
          ) : (
            <motion.div
              layoutId={`project-card-${project.id}`}
              className={cn(
                'relative z-10 flex w-full max-w-[960px] flex-col gap-8',
                'rounded-lg border border-border bg-bg-1 p-6 md:p-10',
                'my-auto',
              )}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <ModalInner
                project={project}
                labels={labels}
                onClose={onClose}
                closeBtnRef={closeBtnRef}
                skipLayoutIds={false}
              />
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}

// Contenu interne du modal. Quand `skipLayoutIds` est true (entrée origin-based
// mode 3D), les motion.* internes n'utilisent pas layoutId — sinon Framer
// tenterait un morph depuis une card 2D qui n'existe pas, rendu abrupt.
function ModalInner({
  project,
  labels,
  onClose,
  closeBtnRef,
  skipLayoutIds,
}: {
  project: Project;
  labels: ModalLabels;
  onClose: () => void;
  closeBtnRef: React.RefObject<HTMLButtonElement | null>;
  skipLayoutIds: boolean;
}): ReactNode {
  const layoutIdOrNone = (id: string) => (skipLayoutIds ? undefined : id);

  return (
    <>
      <button
        ref={closeBtnRef}
        type="button"
        onClick={onClose}
        aria-label={labels.close}
        className={cn(
          'absolute right-4 top-4 z-20 inline-flex size-10 items-center justify-center',
          'rounded-full border border-border bg-bg-1',
          'text-text-1 transition-colors duration-(--duration-fast) ease-(--ease-in-out)',
          'hover:border-border-hi hover:text-text-0',
        )}
      >
        <X className="size-4" strokeWidth={1.75} aria-hidden />
      </button>

      <motion.div
        layoutId={layoutIdOrNone(`project-cover-${project.id}`)}
        className={cn(
          'relative aspect-[16/9] w-full overflow-hidden rounded-md',
          'border border-border',
        )}
      >
        <ProjectCover title={project.title} src={project.coverSrc} />
        <motion.div
          layoutId={layoutIdOrNone(`project-badge-${project.id}`)}
          className="absolute left-4 top-4"
        >
          <StatusBadge status={project.status} label={labels.statusLabel} />
        </motion.div>
      </motion.div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <motion.h2
            id={`project-modal-title-${project.id}`}
            layoutId={layoutIdOrNone(`project-title-${project.id}`)}
            className={cn(
              'font-display font-semibold leading-tight text-text-0',
              'text-h1 md:text-display-m',
            )}
          >
            {project.title}
          </motion.h2>
          <motion.span
            layoutId={layoutIdOrNone(`project-year-${project.id}`)}
            className="font-mono text-caption text-text-2 uppercase tracking-[0.15em]"
          >
            {project.year}
          </motion.span>
        </div>

        <motion.p
          layoutId={layoutIdOrNone(`project-tagline-${project.id}`)}
          className="text-body-l text-text-1"
        >
          {labels.tagline}
        </motion.p>

        <motion.p
          className="text-body text-text-1"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          {labels.description}
        </motion.p>

        <motion.dl
          className="grid grid-cols-1 gap-6 border-t border-border pt-6 md:grid-cols-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="flex flex-col gap-2">
            <dt className="caption text-text-2">{labels.roleLabel}</dt>
            <dd className="text-body-s text-text-0">{labels.role}</dd>
          </div>
          <div className="flex flex-col gap-2">
            <dt className="caption text-text-2">{labels.yearLabel}</dt>
            <dd className="text-body-s text-text-0">{project.year}</dd>
          </div>
          <div className="flex flex-col gap-2">
            <dt className="caption text-text-2">{labels.stackLabel}</dt>
            <dd className="text-body-s text-text-0">
              {project.stack.join(' · ')}
            </dd>
          </div>
        </motion.dl>

        {(project.url || project.github) && (
          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-2 rounded-md border border-accent bg-accent px-4 py-2',
                  'font-mono text-caption uppercase tracking-[0.15em] text-text-0',
                  'transition-colors duration-(--duration-fast) ease-(--ease-in-out)',
                  'hover:bg-accent-hi hover:border-accent-hi',
                )}
              >
                <ExternalLink className="size-4" strokeWidth={1.75} aria-hidden />
                {labels.visit}
              </a>
            )}
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-2 rounded-md border border-border px-4 py-2',
                  'font-mono text-caption uppercase tracking-[0.15em] text-text-1',
                  'transition-colors duration-(--duration-fast) ease-(--ease-in-out)',
                  'hover:border-border-hi hover:text-text-0',
                )}
              >
                <Github className="size-4" strokeWidth={1.75} aria-hidden />
                {labels.source}
              </a>
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}
