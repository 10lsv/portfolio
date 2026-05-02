'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Github, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef } from 'react';

import { ProjectCover } from '@/components/ui/ProjectCover';
import type { Project } from '@/content/projects';
import { cn } from '@/lib/cn';
import { lockScroll, unlockScroll } from '@/lib/scrollLock';
import { useReducedMotion } from '@/lib/useReducedMotion';

type ModalLabels = {
  close: string;
  visit: string;
  source: string;
  stackLabel: string;
  yearLabel: string;
  roleLabel: string;
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
   * depuis ce point en coordonnées viewport. Sinon (mode 2D) : la cover morph
   * via layoutId depuis la card source.
   */
  origin?: ModalOrigin | null;
};

// ProjectModal V8.4 — sheet horizontal desktop / vertical mobile.
//
// Layout :
//   - Container 80vw × 80vh sur lg+ (cap max-w-[1280px] max-h-[800px])
//     95vw × 90vh sur mobile (plus généreux, layout vertical)
//   - bg-white, rounded-2xl, shadow-2xl, overflow-hidden
//   - Desktop : grid 40/60 — cover gauche full-height, infos droite
//   - Mobile : flex-col — cover h-64 en haut, infos flex-1 scroll en bas
//
// Animations :
//   - Backdrop : fade 200ms
//   - Container :
//     - Mode 2D (no origin) : fade + scale-up subtil 0.96 → 1, 400ms Apple ease.
//       Le morph layoutId="project-cover-${id}" sur la cover déplace la cover
//       de la position card 2D vers la zone gauche du modal — wow factor du
//       brief §6.7 conservé.
//     - Mode 3D (origin) : entry depuis offset origin + scale 0.12 + blur
//       (legacy). Pas de layoutId sur la cover (la card 3D n'a pas de DOM).
//   - Info panel : slide-in delay 0.15s — apparait après que la cover soit
//     posée. Reduced-motion → fade-only.
//
// A11y : role=dialog + aria-modal, ESC ferme, focus posé sur close au mount,
// scroll body locké via scrollLock helper. aria-labelledby pointe sur le H2
// titre du panel infos. Backdrop button = click-outside ferme.
export function ProjectModal({
  project,
  labels,
  onClose,
  origin,
}: ProjectModalProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
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

  // Offset initial pour l'entrée depuis origin (mode 3D) : translation
  // exprimée comme delta vs centre viewport, ainsi le modal flex-centré
  // anime juste x/y vers 0 en fin de transition.
  const originOffset = useMemo(() => {
    if (!origin || typeof window === 'undefined') return { x: 0, y: 0 };
    return {
      x: origin.x - window.innerWidth / 2,
      y: origin.y - window.innerHeight / 2,
    };
  }, [origin]);

  // Variants selon le mode d'entrée.
  const containerInitial = hasOrigin
    ? {
        x: originOffset.x,
        y: originOffset.y,
        scale: 0.12,
        opacity: 0,
        filter: 'blur(16px)',
      }
    : { opacity: 0, scale: 0.96 };

  const containerAnimate = hasOrigin
    ? { x: 0, y: 0, scale: 1, opacity: 1, filter: 'blur(0px)' }
    : { opacity: 1, scale: 1 };

  const containerExit = hasOrigin
    ? {
        x: originOffset.x,
        y: originOffset.y,
        scale: 0.12,
        opacity: 0,
        filter: 'blur(16px)',
      }
    : { opacity: 0, scale: 0.96 };

  const containerTransition = hasOrigin
    ? {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
        filter: { duration: 0.35, ease: 'easeOut' as const },
      }
    : { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const };

  // Slide-in du panneau infos — fade-only en reduced-motion.
  const infoInitial = reducedMotion
    ? { opacity: 0 }
    : { opacity: 0, x: 20 };
  const infoAnimate = { opacity: 1, x: 0 };
  const infoExit = reducedMotion ? { opacity: 0 } : { opacity: 0, x: 20 };

  return (
    <AnimatePresence>
      {isOpen && project && labels && (
        <div
          key="project-modal-root"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`project-modal-title-${project.id}`}
        >
          {/* Backdrop click-outside (button pour focus a11y) */}
          <motion.button
            type="button"
            aria-label={labels.close}
            onClick={onClose}
            className="absolute inset-0 size-full cursor-default bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Sheet container 80×80 desktop / 95×90 mobile */}
          <motion.div
            className={cn(
              'relative z-10 overflow-hidden rounded-2xl bg-white shadow-2xl',
              'h-[90vh] w-[95vw]',
              'lg:h-[80vh] lg:max-h-[800px] lg:w-[80vw] lg:max-w-[1280px]',
            )}
            initial={containerInitial}
            animate={containerAnimate}
            exit={containerExit}
            transition={containerTransition}
            // stop propagation : un click dans le modal ne déclenche pas
            // le close du backdrop (click outside).
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermer × — top-right, hover rotate 90° */}
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label={labels.close}
              className={cn(
                'absolute right-4 top-4 z-20 inline-flex size-10 items-center justify-center',
                'rounded-full bg-black/5 text-black',
                'transition-[background-color,transform] duration-200 ease-(--ease-expo-out)',
                'hover:rotate-90 hover:bg-black/10',
                'focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2',
              )}
            >
              <X className="size-5" strokeWidth={1.75} aria-hidden />
            </button>

            <ModalContent
              project={project}
              labels={labels}
              skipLayoutIds={hasOrigin}
              infoInitial={infoInitial}
              infoAnimate={infoAnimate}
              infoExit={infoExit}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

type ModalContentProps = {
  project: Project;
  labels: ModalLabels;
  skipLayoutIds: boolean;
  infoInitial: { opacity: number; x?: number };
  infoAnimate: { opacity: number; x: number };
  infoExit: { opacity: number; x?: number };
};

// Contenu interne du modal — séparé pour clarté. Layout flex-col mobile +
// grid 40/60 desktop. Le cover (gauche desktop / haut mobile) porte le
// layoutId pour le morph card → modal en mode 2D ; en mode 3D
// (skipLayoutIds), pas de layoutId — le container global anime depuis
// l'origin point projeté.
function ModalContent({
  project,
  labels,
  skipLayoutIds,
  infoInitial,
  infoAnimate,
  infoExit,
}: ModalContentProps): ReactNode {
  const layoutIdOrNone = (id: string) => (skipLayoutIds ? undefined : id);

  return (
    <div className="flex h-full flex-col lg:grid lg:grid-cols-[40%_60%]">
      {/* Cover — gauche desktop full-height / haut mobile h-48 (V8.13).
          Réduit de h-64 à h-48 sur mobile pour libérer de la place
          verticale au panel d'infos (le bouton "Voir le projet" était
          rejeté hors viewport sur iPhone 14 Pro avant la réduction).
          V8.7 : append `&clean=1` à coverSrc pour fetch la variante PNG
          sans titre baké. */}
      <motion.div
        layoutId={layoutIdOrNone(`project-cover-${project.id}`)}
        className="relative h-48 w-full overflow-hidden lg:h-full"
      >
        <ProjectCover
          title={project.title}
          src={project.coverSrc ? `${project.coverSrc}&clean=1` : undefined}
        />
      </motion.div>

      {/* Info panel — droite desktop / bas mobile. V8.13 : padding +
          gaps réduits sur mobile pour fit complet sur iPhone 14 Pro
          (avant : la CTA "Voir le projet" était sous le fold). */}
      <motion.div
        className={cn(
          'flex flex-1 flex-col overflow-y-auto',
          'gap-4 p-6 lg:gap-6 lg:p-12',
        )}
        initial={infoInitial}
        animate={infoAnimate}
        exit={infoExit}
        transition={{
          delay: 0.15,
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {/* Titre + année — text-3xl mobile (était text-4xl), libère
            ~12px de hauteur. */}
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2
            id={`project-modal-title-${project.id}`}
            className={cn(
              'font-display font-bold leading-tight text-black',
              'text-3xl lg:text-5xl',
              'tracking-tight',
            )}
          >
            {project.title}
          </h2>
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-text-3">
            {project.year}
          </span>
        </div>

        {/* Tagline — text-sm mobile (était text-base). */}
        <p className="text-sm lg:text-lg text-black/80 leading-relaxed">
          {labels.tagline}
        </p>

        {/* Description longue — text-xs mobile (était text-sm). */}
        <p className="text-xs lg:text-base text-black/70 leading-relaxed">
          {labels.description}
        </p>

        {/* Meta : Rôle / Stack — gap-4/pt-4 mobile (était gap-8/pt-6). */}
        <dl className="grid grid-cols-1 gap-4 border-t border-black/10 pt-4 md:grid-cols-2 md:gap-8 md:pt-6">
          <div className="flex flex-col gap-1.5">
            <dt className="font-mono text-xs uppercase tracking-[0.15em] text-text-3">
              {labels.roleLabel}
            </dt>
            <dd className="text-sm text-black">{labels.role}</dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className="font-mono text-xs uppercase tracking-[0.15em] text-text-3">
              {labels.stackLabel}
            </dt>
            <dd className="text-sm text-black">
              {project.stack.join(' · ')}
            </dd>
          </div>
        </dl>

        {/* CTAs : Voir le projet (primaire noir) + Code source (secondaire).
            V8.15 : forcés sur 1 ligne unique sur mobile via flex-nowrap +
            flex-1 (chaque bouton prend 50% de la largeur dispo) + padding
            réduit px-3 py-2.5 + whitespace-nowrap sur le label. Desktop
            inchangé (lg:flex-initial → fit-content, lg:px-6 lg:py-3). */}
        {(project.url || project.github) && (
          <div className="mt-2 flex flex-nowrap items-stretch gap-2 lg:gap-3">
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-black',
                  'px-3 py-2.5 lg:flex-initial lg:px-6 lg:py-3',
                  'text-sm font-semibold text-white whitespace-nowrap',
                  'transition-opacity duration-200 ease-(--ease-expo-out)',
                  'hover:opacity-90',
                )}
              >
                <ExternalLink className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                {labels.visit}
              </a>
            )}
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-black bg-transparent',
                  'px-3 py-2.5 lg:flex-initial lg:px-6 lg:py-3',
                  'text-sm font-semibold text-black whitespace-nowrap',
                  'transition-[background-color,color] duration-200 ease-(--ease-expo-out)',
                  'hover:bg-black hover:text-white',
                )}
              >
                <Github className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                {labels.source}
              </a>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
