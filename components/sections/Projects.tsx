'use client';

import { useTranslations } from 'next-intl';
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';

import { ProjectGalleryMobile } from '@/components/sections/ProjectGalleryMobile';
import { Gallery2DGrid } from '@/components/ui/Gallery2DGrid';
import { ProjectModal, type ModalOrigin } from '@/components/ui/ProjectModal';
import { SectionNumber } from '@/components/ui/SectionNumber';
import { gsap } from '@/lib/animations';
import { cn } from '@/lib/cn';
import { revealBlock, revealMask, revealWords } from '@/lib/reveals';
import { PROJECTS } from '@/content/projects';
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

  // V8.6 sprint mobile : 3 paths distincts.
  //   - Desktop (≥ 1024px) avec WebGL + !RM : galerie 3D R3F scroll-driven
  //   - Mobile (< 1024px) : ProjectGalleryMobile — colonne verticale 4 cards
  //     85vh chacune, animations scroll-driven Framer Motion (translateY,
  //     scale, opacity, rotateX, parallax cover). Remplace le carousel
  //     précédent (peu impactant). Reduced-motion géré INTERNE au composant
  //     (grid statique fade-in CSS), donc pas besoin de gate ici.
  //   - Reduced-motion sur DESKTOP OU WebGL absent : Gallery2DGrid (fallback
  //     statique). En mobile, ProjectGalleryMobile gère lui-même reduced-motion.
  const showGallery3D = mounted && isDesktop && hasWebGL && !reducedMotion;
  const showGalleryMobile = mounted && !isDesktop;
  const showGallery2DFallback = mounted && isDesktop && (reducedMotion || !hasWebGL);

  const activeProject = PROJECTS.find((p) => p.id === activeId) ?? null;
  const activeLabels = activeProject
    ? {
        close: t('modal.close'),
        visit: t('modal.visit'),
        source: t('modal.source'),
        stackLabel: t('modal.stackLabel'),
        yearLabel: t('modal.yearLabel'),
        roleLabel: t('modal.roleLabel'),
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
      // V7 sprint chirurgical : eyebrow "// Projects" retiré, plus de
      // tween eyebrow correspondant.
      revealMask({
        reducedMotion,
        target: '[data-reveal-mask]',
        root: rootRef.current,
        trigger: rootRef.current,
      });

      revealWords({
        reducedMotion,
        target: '[data-reveal-words]',
        root: rootRef.current,
        trigger: rootRef.current,
      });

      if (showGallery2DFallback) {
        revealBlock({
          reducedMotion,
          target: '[data-projects-card]',
          root: rootRef.current,
          trigger: document.querySelector('[data-projects-grid]'),
        });
      }
    }, rootRef);

    return () => ctx.revert();
  }, [reducedMotion, showGallery2DFallback]);

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
              {/* Wrapper mask reveal : revealMask force overflow-hidden au
                  runtime + anime l'inner h2 yPercent 100 → 0. V7 sprint
                  chirurgical : eyebrow "// Projects" retiré au-dessus. */}
              <div data-reveal-mask>
                <h2
                  id="projects-title"
                  className={cn(
                    'font-display font-semibold leading-[1.15]',
                    // Sprint mobile : text-3xl (30px) sur mobile pour
                    // que "Travaux récents" / "Selected work" tienne
                    // sur 1 ligne sur iPhone 14 Pro 393px. Desktop
                    // INCHANGÉ (md:text-display-m = 56px).
                    'text-3xl md:text-display-m',
                  )}
                >
                  {t('title')}
                </h2>
              </div>
              {/* Sprint mobile galerie : calibration finale du subtitle
                  pour tenir sur 1 ligne sur iPhone 14 Pro (393px - 48px
                  padding = 345px utiles). Le FR "Échantillon
                  représentatif. Détails sur demande." (47 chars) overflow
                  à text-sm (14px → ~350px) → on descend à text-xs (12px
                  → ~290px) qui passe confortablement. EN aligné en
                  parité ("Representative sample. Details on request.").
                  Desktop INCHANGÉ (md:text-body-l = 18px). */}
              <p
                data-reveal-words
                className="text-xs text-text-1 md:text-body-l"
              >
                {t('subtitle')}
              </p>
            </div>

            {/* Path 1 : Mobile gallery — colonne verticale 4 cards 85vh,
                animations scroll-driven Framer Motion (translateY/scale/
                opacity/rotateX + parallax cover). Reduced-motion géré
                INTERNE (grid statique fade-in CSS). */}
            {showGalleryMobile && (
              <ProjectGalleryMobile
                projects={PROJECTS}
                onOpen={handleOpen2D}
              />
            )}

            {/* Path 2 : Gallery 2D fallback — desktop reduced-motion ou
                WebGL absent. Mobile a son propre fallback dans le
                composant ProjectGalleryMobile. */}
            {showGallery2DFallback && <Gallery2DGrid onOpen={handleOpen2D} />}
          </div>
        </div>
      </div>

      {/* Path 3 : Galerie 3D R3F desktop — 400vh sticky pour scroll-
          driven camera (brief §6.7.1 "scène minimaliste fond bg-0").
          DESKTOP UNIQUEMENT (revert mobile sprint Option C). Le Suspense
          catch la promesse du chunk R3F et affiche la galerie 2D en
          fallback pendant parse/init. */}
      {showGallery3D && (
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
