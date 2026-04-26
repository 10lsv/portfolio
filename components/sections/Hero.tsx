'use client';

import gsap from 'gsap';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { HeroBackdrop } from '@/components/sections/HeroBackdrop';
import { cn } from '@/lib/cn';
import { useIntro } from '@/lib/IntroContext';
import { useReducedMotion } from '@/lib/useReducedMotion';

const HIDDEN_SELECTORS = [
  '[data-hero-eyebrow]',
  '[data-hero-tagline]',
  '[data-hero-stat]',
] as const;

// Logs diagnostics. Flip à true pour re-debug l'anim sans toucher au corps
// de l'effet (l'ensemble des appels `log()` reste instrumenté).
const DEBUG_HERO = false;
const log = (...args: unknown[]) => {
  if (DEBUG_HERO && typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[Hero]', ...args);
  }
};

export function Hero() {
  const t = useTranslations('hero');
  const reducedMotion = useReducedMotion();
  const { introDone } = useIntro();
  const rootRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Entrée Hero (brief §6.4). Deux gates :
  //  - reducedMotion : snap direct sur l'état final, pas de timeline.
  //  - introDone : on applique l'état initial (invisible) dès le mount pour
  //    éviter un FOUC, mais on ne lance le timeline qu'une fois le loader parti.
  //    Sinon l'anim se jouerait sous le fond bg-0 du Loader et serait perdue.
  useEffect(() => {
    log('effect run, reducedMotion=', reducedMotion, 'introDone=', introDone);
    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>('[data-hero-word]');
      const hides = gsap.utils.toArray<HTMLElement>(HIDDEN_SELECTORS.join(', '));
      log('found words:', words.length, '| hides:', hides.length);

      if (reducedMotion) {
        log('reduced-motion → skip anim, snap to final');
        gsap.set(hides, { opacity: 1, y: 0, clearProps: 'transform' });
        gsap.set(words, { yPercent: 0, clearProps: 'transform' });
        return;
      }

      // État initial appliqué tout de suite (avant introDone). Les mots sont
      // forcés yPercent 100 pour que pendant le Loader + avant la timeline,
      // ils ne soient pas visibles statiquement en yPercent 0.
      gsap.set(hides, { opacity: 0, y: 16 });
      gsap.set(words, { yPercent: 100 });

      if (!introDone) {
        log('intro not done yet → state set, timeline delayed');
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        onStart: () => log('timeline START'),
        onComplete: () => log('timeline COMPLETE'),
      });

      tl.to('[data-hero-eyebrow]', { opacity: 1, y: 0, duration: 0.8 }, 0);

      tl.to(
        '[data-hero-word]',
        {
          yPercent: 0,
          duration: 1,
          stagger: 0.08,
          onStart: () => log('words START (yPercent 100 → 0)'),
          onComplete: () => log('words COMPLETE'),
        },
        0.1,
      );

      tl.to('[data-hero-tagline]', { opacity: 1, y: 0, duration: 0.8 }, 0.6);
      tl.to(
        '[data-hero-stat]',
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
        0.9,
      );
    }, rootRef);

    return () => {
      log('cleanup → ctx.revert()');
      ctx.revert();
    };
  }, [reducedMotion, introDone]);

  // Scroll indicator disparaît au premier scroll (brief §6.4).
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 20) setScrolled(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const titleWords = t('title').split(' ');

  return (
    <section
      ref={rootRef}
      id="home"
      className="relative flex min-h-[100dvh] items-center px-6 pt-24 md:px-16 md:pt-32"
      aria-labelledby="hero-title"
    >
      <HeroBackdrop />
      <div className="mx-auto w-full max-w-(--container-max)">
        <p
          data-hero-eyebrow
          data-hero-hide
          className="caption text-accent mb-6"
        >
          {t('eyebrow')}
        </p>

        <h1
          id="hero-title"
          className={cn(
            'font-display font-semibold leading-none',
            // display-xl = 112px desktop / 56px mobile (brief §3.2 + §6.4).
            'text-display-m md:text-display-xl',
          )}
        >
          {titleWords.map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="mr-[0.18em] inline-block overflow-hidden align-bottom leading-none"
            >
              <span
                data-hero-word
                className="inline-block pb-[0.1em] will-change-transform"
              >
                {word}
              </span>
            </span>
          ))}
        </h1>

        <p
          data-hero-tagline
          data-hero-hide
          className="text-body-l text-text-1 mt-8 max-w-2xl"
        >
          {t('tagline')}
        </p>

        <ul
          className={cn(
            'mt-16 flex flex-col gap-3 md:mt-24 md:flex-row md:gap-12',
            'font-mono text-text-2',
            'text-[11px] tracking-[0.12em] md:text-[12px]',
            'uppercase',
          )}
        >
          <li data-hero-stat data-hero-hide>{t('stat1')}</li>
          <li data-hero-stat data-hero-hide>{t('stat2')}</li>
          <li data-hero-stat data-hero-hide>{t('stat3')}</li>
        </ul>
      </div>

      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2',
          'text-text-2 transition-opacity duration-(--duration-normal) ease-(--ease-in-out)',
          scrolled ? 'opacity-0' : 'opacity-100',
        )}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
          {t('scroll')}
        </span>
        <ChevronDown
          className="size-4 motion-safe:animate-bounce"
          strokeWidth={1.5}
        />
      </div>
    </section>
  );
}
