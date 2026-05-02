'use client';

import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { ArrowRight, ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { ProjectCover } from '@/components/ui/ProjectCover';
import type { Project } from '@/content/projects';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/useReducedMotion';

// ProjectGalleryMobile — V8.10 sprint mobile finition design.
//
// Pattern technique conservé du V8.9 (validé par Léo) :
//   - Container parent : `min-h-[400vh] relative` — 4 hauteurs viewport.
//   - Sticky wrapper interne : `sticky top-0 h-screen overflow-hidden`.
//   - 4 cards en `absolute inset-x-6 inset-y-0`, superposées, opacity/
//     scale/translateY drivés par useScroll sur le container.
//   - Crossfade via opacity 0→1→1→0 sur 4 keypoints, scale 1.05→1→0.95,
//     translateY 50→0→-50.
//
// Ajustements design V8.10 :
//   - Card a une marge externe 24px (mx-6 via inset-x-6 du absolute) au
//     lieu d'être full-bleed. La card "flotte" dans le viewport blanc.
//   - rounded-3xl + overflow-hidden sur la card → cover et bloc texte
//     clippés dans les coins arrondis (24px).
//   - Titre projet centré (text-center).
//   - Tagline retirée du bloc texte (toujours présente i18n pour le
//     modal, juste plus affichée sur la card).
//   - CTA passe de bouton noir massif → text-only avec ArrowRight Lucide
//     animée au hover (translate-x-1, opacity-70). Inter font-medium,
//     pas de bg/border/padding box, vibe soft/classe Apple.
//   - Compteur "01 · 04" RETIRÉ (cleanup overlays). On garde uniquement
//     les dots verticaux à droite. activeIndex toujours computed pour
//     les dots.
//
// Scope visibility overlays (dots seuls) :
//   - IntersectionObserver sur containerRef threshold 0.05 → mounted
//     pendant la galerie, démonté hors champ. Pas de pollution Hero/
//     Contact.
//
// Reduced-motion : grid statique vertical avec MÊMES styles design
// (rounded-3xl, titre centré, CTA soft), pas de scroll-jacking.

const DEBUG = false;
const log = (...args: unknown[]) => {
  if (DEBUG && typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[ProjectGalleryMobile]', ...args);
  }
};

type ProjectGalleryMobileProps = {
  projects: readonly Project[];
  onOpen: (id: string) => void;
};

export function ProjectGalleryMobile({
  projects,
  onOpen,
}: ProjectGalleryMobileProps) {
  const t = useTranslations('projects');
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryInView, setGalleryInView] = useState(false);
  const total = projects.length;

  // Page scroll progress 0..1 sur le container 400vh. Drives card
  // animations + activeIndex (pour les dots).
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const idx = Math.max(0, Math.min(Math.floor(latest * total), total - 1));
    setActiveIndex((prev) => {
      if (prev !== idx) {
        log('activeIndex →', idx, 'progress=', latest.toFixed(3));
        return idx;
      }
      return prev;
    });
  });

  // IntersectionObserver — scope l'affichage des dots (seul overlay
  // restant) à la période où la galerie est visible.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setGalleryInView(entry.isIntersecting);
        log('galleryInView →', entry.isIntersecting);
      },
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // snapToCard : utilisé par les dots (navigation directe) ET par le
  // bouton retour bottom-right de chaque card (V8.13, snap à card-1).
  const snapToCard = (i: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const containerTop = rect.top + window.scrollY;
    const containerHeight = el.offsetHeight;
    window.scrollTo({
      top: containerTop + (i / total) * containerHeight,
      behavior: 'smooth',
    });
  };

  // Reduced-motion : grid statique vertical, mêmes styles design (rounded,
  // titre centré, CTA soft). layoutId conservé pour morph modal.
  if (reducedMotion) {
    return (
      <div className="flex flex-col gap-6">
        {projects.map((project, i) => (
          <StaticCard
            key={project.id}
            project={project}
            priority={i === 0}
            ctaLabel={t('cta')}
            openLabel={t('cardOpen')}
            onOpen={onOpen}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative -mx-6 min-h-[400vh]">
      {/* Overlays : dots verticaux uniquement (compteur retiré V8.10).
          Mounted UNIQUEMENT quand la galerie est intersected. */}
      {galleryInView && (
        <div
          className="fixed right-4 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-2"
          role="tablist"
          aria-label={t('cardOpen')}
        >
          {projects.map((project, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={project.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={project.title}
                onClick={() => snapToCard(i)}
                className={cn(
                  'rounded-full transition-[width,height,background-color] duration-300 ease-out',
                  // Dots sur fond blanc → noir/gris (le sprint précédent
                  // avait du blanc, mauvais contraste sur le fond white
                  // du site V6 light-only).
                  isActive ? 'h-3 w-3 bg-black' : 'h-2 w-2 bg-black/30',
                )}
              />
            );
          })}
        </div>
      )}

      {/* Sticky wrapper : reste collé au top du viewport pendant les
          400vh de scroll. */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {projects.map((project, i) => (
          <CardLayer
            key={project.id}
            project={project}
            index={i}
            total={total}
            isActive={i === activeIndex}
            scrollYProgress={scrollYProgress}
            priority={i === 0}
            ctaLabel={t('cta')}
            openLabel={t('cardOpen')}
            backLabel={t('previousCard')}
            onOpen={onOpen}
            onBack={() => snapToCard(Math.max(0, i - 1))}
          />
        ))}
      </div>
    </div>
  );
}

type CardLayerProps = {
  project: Project;
  index: number;
  total: number;
  isActive: boolean;
  scrollYProgress: MotionValue<number>;
  priority: boolean;
  ctaLabel: string;
  openLabel: string;
  backLabel: string;
  onOpen: (id: string) => void;
  onBack: () => void;
};

function CardLayer({
  project,
  index,
  total,
  isActive,
  scrollYProgress,
  priority,
  ctaLabel,
  openLabel,
  backLabel,
  onOpen,
  onBack,
}: CardLayerProps) {
  const cardStart = index / total;
  const cardEnd = (index + 1) / total;
  const cardMid = (cardStart + cardEnd) / 2;

  const opacity = useTransform(
    scrollYProgress,
    [cardStart - 0.05, cardStart, cardEnd, cardEnd + 0.05],
    [0, 1, 1, 0],
  );
  const scale = useTransform(
    scrollYProgress,
    [cardStart, cardMid, cardEnd],
    [1.05, 1, 0.95],
  );
  const translateY = useTransform(
    scrollYProgress,
    [cardStart, cardMid, cardEnd],
    [50, 0, -50],
  );

  return (
    // Card flottante (V8.11 réduite) :
    //   - inset-x-8       = 32px de margin gauche/droite (était 24px)
    //   - top/bottom 6vh  = ~51px de margin haut/bas (était full-height)
    //   - flex-[7]/flex-[3] sur cover/texte → ratio 70/30 préservé sur la
    //     nouvelle hauteur réduite (88vh).
    //   - rounded-3xl + overflow-hidden : coins clippés.
    // pointerEvents drivé par isActive (props parent — calé sur
    // activeIndex = floor(progress * total)). Bug fix V8.12 : les 4
    // cards sont superposées en absolute, sans ce filtre la dernière
    // du DOM (photographer-site) interceptait TOUS les taps même quand
    // visuellement c'est une autre card qui est affichée. Switch instantané
    // au crossfade boundary, pas de zone morte tap-able sur card cachée.
    <motion.div
      style={{
        opacity,
        scale,
        y: translateY,
        pointerEvents: isActive ? 'auto' : 'none',
        willChange: 'opacity, transform',
      }}
      className="absolute inset-x-8 top-[6vh] bottom-[6vh] flex flex-col overflow-hidden rounded-3xl shadow-2xl"
    >
      {/* Cover : flex-[7] → 70% de la card height. tap → modal.
          src `&clean=1` : variante PNG sans titre baké. La card affiche
          déjà le titre centré dans le bloc texte → on évite le doublon
          visuel ("bouts de texte" sur la cover signalés par Léo). */}
      <button
        type="button"
        onClick={() => onOpen(project.id)}
        aria-label={`${project.title} — ${openLabel}`}
        className="relative block w-full flex-[7] overflow-hidden focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-[-4px]"
      >
        <motion.div
          layoutId={`project-cover-${project.id}`}
          className="absolute inset-0"
        >
          <ProjectCover
            title={project.title}
            src={project.coverSrc ? `${project.coverSrc}&clean=1` : undefined}
            priority={priority}
          />
        </motion.div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-black/20"
          aria-hidden
        />
      </button>

      {/* Texte : flex-[3] → 30% de la card height. Titre centré +
          CTA unique "Voir le projet" qui ouvre le modal détails. Le lien
          vers le site live vit dans le modal (boutons "Voir le projet" +
          "Code source"). */}
      <div className="relative flex flex-[3] flex-col items-center justify-center gap-5 bg-white px-6 py-6">
        <h3 className="text-center font-display text-3xl font-bold leading-tight text-black">
          {project.title}
        </h3>
        <SoftCta label={ctaLabel} onClick={() => onOpen(project.id)} />

        {/* Bouton retour bottom-right (V8.13). Caché sur la première
            card (index 0) — pas de carte précédente dans la galerie. */}
        {index > 0 && (
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            className={cn(
              'absolute bottom-4 right-4 inline-flex size-10 items-center justify-center',
              'rounded-full bg-black/5 text-black',
              'transition-[background-color,transform] duration-200 ease-out',
              'hover:-translate-y-0.5 hover:bg-black/10',
              'focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2',
            )}
          >
            <ArrowUp className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// SoftCta — CTA "text-only avec flèche animée", vibe Apple soft.
// Action interne uniquement (ouvre le modal). Le lien live vers les sites
// externes vit dans le modal (boutons "Voir le projet" + "Code source"),
// pas sur la card galerie (cleanup V8.15 user request).
function SoftCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group inline-flex items-center gap-2',
        'font-medium text-base text-black',
        'transition-opacity duration-300 ease-out hover:opacity-70',
        'focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2',
      )}
    >
      {label}
      <ArrowRight
        className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-1"
        strokeWidth={1.75}
        aria-hidden
      />
    </button>
  );
}

// Reduced-motion fallback : card statique avec mêmes styles design (rounded,
// titre centré, CTA soft). Pas d'animation scroll-driven.
function StaticCard({
  project,
  priority,
  ctaLabel,
  openLabel,
  onOpen,
}: {
  project: Project;
  priority: boolean;
  ctaLabel: string;
  openLabel: string;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl shadow-2xl">
      <button
        type="button"
        onClick={() => onOpen(project.id)}
        aria-label={`${project.title} — ${openLabel}`}
        className="relative block aspect-[8/5] w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-[-4px]"
      >
        <motion.div
          layoutId={`project-cover-${project.id}`}
          className="absolute inset-0"
        >
          <ProjectCover
            title={project.title}
            src={project.coverSrc ? `${project.coverSrc}&clean=1` : undefined}
            priority={priority}
          />
        </motion.div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-black/20"
          aria-hidden
        />
      </button>
      <div className="flex flex-col items-center justify-center gap-6 bg-white px-6 py-8">
        <h3 className="text-center font-display text-3xl font-bold leading-tight text-black">
          {project.title}
        </h3>
        <SoftCta label={ctaLabel} onClick={() => onOpen(project.id)} />
      </div>
    </div>
  );
}
