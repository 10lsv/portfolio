'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { gsap } from '@/lib/animations';
import { cn } from '@/lib/cn';
import { useIntro } from '@/lib/IntroContext';

// Loader d'intro (brief §6.1) — sprint boost agressif :
//  - underline tracé : scaleX 0 → 1 + glow box-shadow 0 → 0 0 20px accent
//    en parallèle, retombe à 0 à la fin du tracé
//  - compteur 00 → 100 : glitch translateX ±2px tous les 25 unités
//  - exit "split" : 2 layers bg-bg-0 (top half + bottom half), top slide
//    up -100%, bottom slide down +100% — révèle Hero + Header derrière.
//
// reduced-motion : court-circuit complet, le Loader n'est pas rendu (gating
// dans IntroProvider/IntroMount).
//
// z-index doc : **z-[100]** — couvre toute la z-stack actuelle.
export function Loader() {
  const t = useTranslations('loader');
  const { markDone } = useIntro();
  const rootRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const splitTopRef = useRef<HTMLDivElement>(null);
  const splitBottomRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(underlineRef.current, {
        scaleX: 0,
        transformOrigin: 'left center',
        boxShadow: '0 0 0px rgba(139,0,0,0)',
      });
      gsap.set(nameRef.current, { opacity: 1, y: 0, scale: 1 });
      gsap.set([splitTopRef.current, splitBottomRef.current], { y: 0 });

      const counter = { value: 0 };
      let lastGlitchBoundary = 0;

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: markDone,
      });

      // Trace underline (800ms) + glow box-shadow synchronisé : pulse 0
      // → 20px → 0 sur la même durée que le tracé. Le pic au milieu donne
      // l'impression que le trait "s'allume" pendant qu'il s'écrit.
      tl.to(
        underlineRef.current,
        { scaleX: 1, duration: 0.8, ease: 'power4.out' },
        0,
      );
      tl.to(
        underlineRef.current,
        {
          boxShadow: '0 0 20px rgba(139,0,0,0.8)',
          duration: 0.4,
          ease: 'power2.out',
        },
        0,
      );
      tl.to(
        underlineRef.current,
        {
          boxShadow: '0 0 0px rgba(139,0,0,0)',
          duration: 0.4,
          ease: 'power2.in',
        },
        0.4,
      );

      // Compteur 00 → 100 en parallèle, même durée. Glitch translateX
      // ±2px déclenché à chaque passage de boundary 25/50/75.
      tl.to(
        counter,
        {
          value: 100,
          duration: 0.8,
          ease: 'power1.out',
          onUpdate: () => {
            if (!counterRef.current) return;
            const rounded = Math.round(counter.value);
            counterRef.current.textContent = String(rounded).padStart(2, '0');
            const nextBoundary = lastGlitchBoundary + 25;
            if (rounded >= nextBoundary && nextBoundary <= 100) {
              lastGlitchBoundary = nextBoundary;
              gsap
                .timeline()
                .to(counterRef.current, {
                  x: -2,
                  duration: 0.05,
                  ease: 'none',
                })
                .to(counterRef.current, {
                  x: 2,
                  duration: 0.05,
                  ease: 'none',
                })
                .to(counterRef.current, {
                  x: 0,
                  duration: 0.05,
                  ease: 'none',
                });
            }
          },
        },
        0,
      );

      // Hold bref.
      tl.to({}, { duration: 0.3 }, '>');
      tl.addLabel('exit');

      // Nom slide + scale-down + fade vers le coin top-left (logo LSV).
      tl.to(
        nameRef.current,
        {
          y: -window.innerHeight * 0.42,
          x: -window.innerWidth * 0.42,
          scale: 0.25,
          opacity: 0,
          duration: 0.8,
          ease: 'expo.out',
          transformOrigin: 'center center',
        },
        'exit',
      );

      // Underline + counter : fade simple, plus rapide.
      tl.to(
        [underlineRef.current, counterRef.current],
        { opacity: 0, duration: 0.3, ease: 'power1.out' },
        'exit',
      );

      // Sprint boost : exit split au lieu de fade simple. Top layer slide
      // up -100%, bottom layer slide down +100% sur 700ms ease expo.out.
      // L'effet "rideau qui se sépare" révèle Hero + Header derrière.
      tl.to(
        splitTopRef.current,
        { y: '-100%', duration: 0.7, ease: 'expo.out' },
        'exit+=0.2',
      );
      tl.to(
        splitBottomRef.current,
        { y: '100%', duration: 0.7, ease: 'expo.out' },
        'exit+=0.2',
      );

      tlRef.current = tl;
    }, rootRef);

    return () => ctx.revert();
  }, [markDone]);

  const handleSkip = () => {
    if (skipped) return;
    setSkipped(true);
    const tl = tlRef.current;
    if (!tl) return;
    tl.timeScale(2);
    const exitTime = tl.labels['exit'];
    if (typeof exitTime === 'number' && tl.time() < exitTime) {
      tl.seek('exit');
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') handleSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipped]);

  return (
    <div
      ref={rootRef}
      onClick={handleSkip}
      role="button"
      tabIndex={0}
      aria-label={t('skipLabel')}
      className={cn(
        // z-[100] : au-dessus de header/burger/modals. Background appliqué
        // via les 2 split layers, pas sur le root (sinon ils ne pourraient
        // pas révéler ce qui est dessous au split exit).
        'fixed inset-0 z-[100] cursor-pointer select-none',
      )}
    >
      {/* Split layer haut : couvre la moitié supérieure, slide vers le haut
          au exit pour révéler Header/Hero. */}
      <div
        ref={splitTopRef}
        aria-hidden
        className="absolute inset-x-0 top-0 h-1/2 bg-bg-0"
      />
      {/* Split layer bas : couvre la moitié inférieure, slide vers le bas. */}
      <div
        ref={splitBottomRef}
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 bg-bg-0"
      />

      {/* Content (name + underline + counter) au-dessus des 2 layers via
          z-index. Le content fade au exit pendant que les layers slidaient. */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="flex flex-col items-center">
          <span
            ref={nameRef}
            className={cn(
              'font-display font-semibold text-text-0 leading-none',
              'text-display-l md:text-display-l',
            )}
          >
            {t('name')}
          </span>
          <span
            ref={underlineRef}
            aria-hidden
            className="mt-4 block h-[2px] w-full bg-accent"
          />
        </div>
      </div>

      <span
        ref={counterRef}
        aria-hidden
        className={cn(
          'absolute bottom-6 left-6 z-10 md:bottom-10 md:left-16',
          'font-mono text-caption text-text-1 tracking-[0.15em]',
        )}
      >
        00
      </span>
    </div>
  );
}
