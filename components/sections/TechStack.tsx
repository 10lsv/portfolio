'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { SectionNumber } from '@/components/ui/SectionNumber';
import { REVEAL_SCROLL_TRIGGER, gsap } from '@/lib/animations';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/useReducedMotion';

// Liste figée par le brief §6.6. Séparateurs " / " respectés pour la
// dernière ligne back (Git / Docker / Figma).
const FRONT_ITEMS = ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'] as const;
const BACK_ITEMS = ['Node.js', 'Python', 'PostgreSQL', 'Git / Docker / Figma'] as const;

type StackItemProps = { label: string };

function StackItem({ label }: StackItemProps) {
  return (
    <li
      data-stack-item
      className={cn(
        'group relative inline-flex w-fit font-display font-semibold',
        'text-h3 md:text-h2', // 24px mobile → 32px desktop
        'text-text-0',
      )}
    >
      <span className="relative">
        {label}
        {/* Underline rouge qui se trace gauche → droite au hover (300ms) */}
        <span
          aria-hidden
          className={cn(
            'absolute -bottom-1 left-0 h-[2px] w-0 bg-accent',
            'transition-[width] duration-300 ease-(--ease-out-smooth)',
            'group-hover:w-full',
          )}
        />
      </span>
    </li>
  );
}

export function TechStack() {
  const t = useTranslations('stack');
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set('[data-stack-reveal]', { opacity: 1, y: 0 });
        gsap.set('[data-stack-item]', { opacity: 1, y: 0 });
        return;
      }

      gsap.from('[data-stack-reveal]', {
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

      gsap.from('[data-stack-item]', {
        opacity: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.06,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: '[data-stack-grid]',
          ...REVEAL_SCROLL_TRIGGER,
        },
      });
    }, rootRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={rootRef}
      id="stack"
      className="px-6 py-16 md:px-16 md:py-32"
      aria-labelledby="stack-title"
    >
      <div className="mx-auto w-full max-w-(--container-max)">
        <SectionNumber number={t('number')} className="mb-12 md:mb-16" />

        <div className="mb-12 flex max-w-3xl flex-col gap-4 md:mb-20">
          <p data-stack-reveal className="caption text-accent">
            {t('eyebrow')}
          </p>
          <h2
            id="stack-title"
            data-stack-reveal
            className={cn(
              'font-display font-semibold leading-[1.15]',
              'text-h1 md:text-display-m',
            )}
          >
            {t('title')}
          </h2>
          <p data-stack-reveal className="text-body-l text-text-1">
            {t('subtitle')}
          </p>
        </div>

        <div
          data-stack-grid
          className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16"
        >
          <div>
            <h3 className="caption text-accent mb-6 md:mb-8">
              {t('frontHeader')}
            </h3>
            <ul className="flex flex-col gap-3 md:gap-4">
              {FRONT_ITEMS.map((item) => (
                <StackItem key={item} label={item} />
              ))}
            </ul>
          </div>

          <div>
            <h3 className="caption text-accent mb-6 md:mb-8">
              {t('backHeader')}
            </h3>
            <ul className="flex flex-col gap-3 md:gap-4">
              {BACK_ITEMS.map((item) => (
                <StackItem key={item} label={item} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
