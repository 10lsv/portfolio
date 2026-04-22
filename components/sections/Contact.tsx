'use client';

import { Github, Linkedin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { CopyEmailButton } from '@/components/ui/CopyEmailButton';
import { SectionNumber } from '@/components/ui/SectionNumber';
import { REVEAL_SCROLL_TRIGGER, gsap } from '@/lib/animations';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/useReducedMotion';

// URLs figées par le brief §1.
const GITHUB_URL = 'https://github.com/10lsv';
const LINKEDIN_URL = 'https://www.linkedin.com/in/léo-sauvey/';

export function Contact() {
  const t = useTranslations('contact');
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);

  const email = t('email');
  const mailto = `mailto:${email}?subject=${encodeURIComponent(t('mailtoSubject'))}`;

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set('[data-contact-reveal]', { opacity: 1, y: 0 });
        return;
      }

      gsap.from('[data-contact-reveal]', {
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
      id="contact"
      className="relative flex min-h-[100dvh] items-center px-6 py-24 md:px-16 md:py-32"
      aria-labelledby="contact-title"
    >
      <div className="mx-auto w-full max-w-(--container-max)">
        <SectionNumber number={t('number')} className="mb-12 md:mb-16" />

        <div className="flex flex-col items-start gap-8 md:gap-10">
          <p data-contact-reveal className="caption text-accent">
            {t('eyebrow')}
          </p>

          <h2
            id="contact-title"
            data-contact-reveal
            className={cn(
              'font-display font-semibold leading-[1.1]',
              'text-display-m md:text-display-l',
            )}
          >
            {t('title')}
          </h2>

          <p data-contact-reveal className="text-body-l text-text-1 max-w-2xl">
            {t('subtitle')}
          </p>

          <a
            data-contact-reveal
            href={mailto}
            className={cn(
              'group relative inline-block font-display font-semibold',
              'text-h3 md:text-h1', // 24px mobile / 40px desktop (brief §6.8)
              'text-text-0 transition-colors duration-(--duration-normal) ease-(--ease-in-out)',
              'hover:text-accent',
            )}
          >
            <span>{email}</span>
            {/* Underline rouge qui se trace au hover */}
            <span
              aria-hidden
              className={cn(
                'absolute -bottom-1 left-0 h-[2px] w-0 bg-accent',
                'transition-[width] duration-300 ease-(--ease-out-smooth)',
                'group-hover:w-full',
              )}
            />
          </a>

          <div data-contact-reveal>
            <CopyEmailButton
              email={email}
              label={t('copy')}
              copiedLabel={t('copied')}
            />
          </div>

          <div
            data-contact-reveal
            className="mt-4 flex items-center gap-6"
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('socialGithub')}
              className={cn(
                'text-text-1 transition-colors duration-(--duration-fast) ease-(--ease-in-out)',
                'hover:text-accent',
              )}
            >
              <Github className="size-6" strokeWidth={1.5} aria-hidden />
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('socialLinkedin')}
              className={cn(
                'text-text-1 transition-colors duration-(--duration-fast) ease-(--ease-in-out)',
                'hover:text-accent',
              )}
            >
              <Linkedin className="size-6" strokeWidth={1.5} aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
