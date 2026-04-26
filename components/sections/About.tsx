'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { SectionNumber } from '@/components/ui/SectionNumber';
import { REVEAL_SCROLL_TRIGGER, gsap } from '@/lib/animations';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/useReducedMotion';

export function About() {
  const t = useTranslations('about');
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);

  // Reveal scroll (brief §6.5) : chaque paragraphe fade + translate-up 32px,
  // stagger 120ms, trigger 20% visible.
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set('[data-about-reveal]', { opacity: 1, y: 0 });
        return;
      }

      gsap.from('[data-about-reveal]', {
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
    }, rootRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={rootRef}
      id="about"
      className="px-6 py-16 md:px-16 md:py-32"
      aria-labelledby="about-title"
    >
      <div className="mx-auto w-full max-w-(--container-max)">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:gap-16">
          <SectionNumber number={t('number')} className="md:shrink-0" />

          <div className="flex-1 grid gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <p
                data-about-reveal
                className="caption text-accent mb-4"
              >
                {t('eyebrow')}
              </p>
              <h2
                id="about-title"
                data-about-reveal
                className={cn(
                  'font-display font-semibold leading-[1.15]',
                  'text-h1 md:text-display-m',
                )}
              >
                {t('title')}
              </h2>
            </div>

            <div className="flex flex-col gap-6 md:col-span-7">
              <p data-about-reveal className="text-body-l text-text-1">
                {t('p1')}
              </p>
              <p data-about-reveal className="text-body-l text-text-1">
                {t('p2')}
              </p>
              <p data-about-reveal className="text-body-l text-text-1">
                {t('p3')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
