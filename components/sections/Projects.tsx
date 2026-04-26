'use client';

import { useTranslations } from 'next-intl';
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';

import { Gallery2DGrid } from '@/components/ui/Gallery2DGrid';
import { ProjectModal, type ModalOrigin } from '@/components/ui/ProjectModal';
import { SectionNumber } from '@/components/ui/SectionNumber';
import { REVEAL_SCROLL_TRIGGER, gsap } from '@/lib/animations';
import { cn } from '@/lib/cn';
import { PROJECTS, type ProjectStatus } from '@/content/projects';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useWebGLSupport } from '@/lib/useWebGLSupport';

// React.lazy (pas next/dynamic) pour pouvoir poser un <Suspense> avec fallback
// 2D au-dessus : la promesse d'import est levée pendant le chunk load, Suspense
// catch et affiche la galerie 2D du Sprint 3 (brief §6.7.1). Compatible SSR
// via 'use client' — ce module n'est jamais évalué côté serveur.
const GalleryScene = lazy(() =>
  import('@/components/three/GalleryScene').then((m) => ({
    default: m.GalleryScene,
  })),
);

const STATUS_KEY_MAP: Record<ProjectStatus, 'live' | 'wip' | 'offline'> = {
  live: 'live',
  wip: 'wip',
  offline: 'offline',
};

export function Projects() {
  const t = useTranslations('projects');
  const reducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const hasWebGL = useWebGLSupport();

  const rootRef = useRef<HTMLElement>(null);
  const scrollRangeRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeOrigin, setActiveOrigin] = useState<ModalOrigin | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const use3D = mounted && isDesktop && hasWebGL && !reducedMotion;

  const activeProject = PROJECTS.find((p) => p.id === activeId) ?? null;
  const activeLabels = activeProject
    ? {
        close: t('modal.close'),
        visit: t('modal.visit'),
        source: t('modal.source'),
        stackLabel: t('modal.stackLabel'),
        yearLabel: t('modal.yearLabel'),
        roleLabel: t('modal.roleLabel'),
        statusLabel: t(`status.${STATUS_KEY_MAP[activeProject.status]}`),
        tagline: t(`items.${activeProject.id}.tagline`),
        description: t(`items.${activeProject.id}.description`),
        role: t(`items.${activeProject.id}.role`),
      }
    : null;

  const handleClose = useCallback(() => {
    setActiveId(null);
    // On ne reset pas `activeOrigin` ici : Framer Motion applique `exit` avec
    // les props courantes du motion.div, et un origin=null ferait fallback sur
    // le path layoutId pendant l'exit — rendu abrupt. L'origin sera remplacé
    // proprement à la prochaine ouverture (2D = null, 3D = nouveau point).
  }, []);

  const handleOpen2D = useCallback((id: string) => {
    setActiveOrigin(null);
    setActiveId(id);
  }, []);

  const handleOpen3D = useCallback((id: string, origin: ModalOrigin) => {
    setActiveOrigin(origin);
    setActiveId(id);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set('[data-projects-reveal]', { opacity: 1, y: 0 });
        gsap.set('[data-projects-card]', { opacity: 1, y: 0 });
        return;
      }

      gsap.from('[data-projects-reveal]', {
        opacity: 0,
        y: 32,
        duration: 0.8,
        stagger: 0.12,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: rootRef.current,
          ...REVEAL_SCROLL_TRIGGER,
        },
      });

      if (!use3D) {
        gsap.from('[data-projects-card]', {
          opacity: 0,
          y: 32,
          duration: 0.8,
          stagger: 0.1,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: '[data-projects-grid]',
            ...REVEAL_SCROLL_TRIGGER,
          },
        });
      }
    }, rootRef);

    return () => ctx.revert();
  }, [reducedMotion, use3D]);

  return (
    <section
      ref={rootRef}
      id="projects"
      className="px-6 py-16 md:px-16 md:py-32"
      aria-labelledby="projects-title"
    >
      <div className="mx-auto w-full max-w-(--container-max)">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:gap-16">
          <SectionNumber number={t('number')} className="md:shrink-0" />

          <div className="flex-1">
            <div className="mb-12 flex max-w-3xl flex-col gap-4 md:mb-16">
              <p data-projects-reveal className="caption text-accent">
                {t('eyebrow')}
              </p>
              <h2
                id="projects-title"
                data-projects-reveal
                className={cn(
                  'font-display font-semibold leading-[1.15]',
                  'text-h1 md:text-display-m',
                )}
              >
                {t('title')}
              </h2>
              <p data-projects-reveal className="text-body-l text-text-1">
                {t('subtitle')}
              </p>
            </div>

            {/* Mode 2D : galerie grid inline dans flex-1. Utilisée mobile,
                WebGL off, reduced-motion, et en attendant mount client. */}
            {!use3D && <Gallery2DGrid onOpen={handleOpen2D} />}
          </div>
        </div>
      </div>

      {/* Mode 3D : plage de scroll 400vh hors container pour canvas plein
          viewport (brief §6.7.1 "scène minimaliste fond bg-0"). Le Suspense
          catch la promesse du chunk R3F et affiche la galerie 2D en fallback
          pendant parse/init — continuité visuelle avec le mode 2D. */}
      {use3D && (
        <div
          ref={scrollRangeRef}
          className="relative h-[400vh] mt-8 md:mt-16 -mx-6 md:-mx-16"
        >
          <Suspense
            fallback={
              <div className="px-6 md:px-16">
                <Gallery2DGrid onOpen={handleOpen2D} />
              </div>
            }
          >
            <div className="sticky top-0 h-screen w-full">
              <GalleryScene
                projects={PROJECTS}
                scrollRef={scrollRangeRef}
                onOpen={handleOpen3D}
              />
            </div>
          </Suspense>
        </div>
      )}

      <ProjectModal
        project={activeProject}
        labels={activeLabels}
        origin={activeOrigin}
        onClose={handleClose}
      />
    </section>
  );
}
