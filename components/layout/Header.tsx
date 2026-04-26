'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { BurgerMenu } from './BurgerMenu';
import { LocaleToggle } from './LocaleToggle';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/cn';
import { useIntro } from '@/lib/IntroContext';

export function Header() {
  const t = useTranslations('nav');
  const { introDone } = useIntro();
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // brief §6.2 : backdrop blur + bg/70 au-delà de 40px, padding compacté
  // au-delà de 100px.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setCompact(y > 100);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 flex w-full items-center justify-between',
          'px-6 md:px-16',
          'transition-[background-color,backdrop-filter,height,padding] duration-(--duration-normal) ease-(--ease-in-out)',
          compact ? 'h-[56px] md:h-[64px]' : 'h-[56px] md:h-[72px]',
          scrolled
            ? 'bg-bg-0/70 backdrop-blur-md supports-[backdrop-filter]:bg-bg-0/60'
            : 'bg-transparent',
        )}
      >
        <a
          href="#home"
          className={cn(
            'font-display text-accent font-semibold uppercase tracking-wider',
            'text-[20px] leading-none',
            'transition-[color,opacity] duration-(--duration-normal) hover:text-accent-hi',
            // Logo fade-in simultané à l'exit du loader (brief §6.1 "devient
            // le logo du header"). Crossfade avec la sortie de "LÉO SAUVEY"
            // qui translate vers le coin top-left côté Loader.
            introDone ? 'opacity-100' : 'opacity-0',
          )}
          // accessible name doit inclure le texte visible (Lighthouse
          // label-content-name-mismatch). On commence par "LSV" pour respecter
          // la règle WCAG 2.5.3 (label-in-name) tout en clarifiant la cible
          // pour les screen readers.
          aria-label="LSV — Léo Sauvey, retour à l'accueil"
        >
          LSV
        </a>

        <div className="flex items-center gap-2 md:gap-4">
          <LocaleToggle />
          <ThemeToggle />
          <BurgerButton
            open={menuOpen}
            onToggle={() => setMenuOpen((v) => !v)}
            labelOpen={t('menuOpen')}
            labelClose={t('menuClose')}
          />
        </div>
      </header>

      <BurgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

type BurgerButtonProps = {
  open: boolean;
  onToggle: () => void;
  labelOpen: string;
  labelClose: string;
};

function BurgerButton({ open, onToggle, labelOpen, labelClose }: BurgerButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={open ? labelClose : labelOpen}
      aria-expanded={open}
      aria-controls="burger-menu"
      className={cn(
        'relative inline-flex size-10 items-center justify-center rounded-md',
        // Au-dessus du menu pour rester cliquable quand il est ouvert.
        'z-50 text-text-0 transition-colors duration-(--duration-normal)',
        'hover:bg-bg-2 hover:text-accent-hi',
      )}
    >
      <span className="sr-only">{open ? labelClose : labelOpen}</span>
      {/* Icône 3 traits qui s'animent en croix (brief §6.2) */}
      <span aria-hidden className="relative block h-4 w-6">
        <span
          className={cn(
            'absolute left-0 block h-[2px] w-full bg-current',
            'transition-transform duration-(--duration-normal) ease-(--ease-in-out)',
            open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0',
          )}
        />
        <span
          className={cn(
            'absolute top-1/2 left-0 block h-[2px] w-full -translate-y-1/2 bg-current',
            'transition-opacity duration-(--duration-fast)',
            open ? 'opacity-0' : 'opacity-100',
          )}
        />
        <span
          className={cn(
            'absolute left-0 block h-[2px] w-full bg-current',
            'transition-transform duration-(--duration-normal) ease-(--ease-in-out)',
            open ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-0',
          )}
        />
      </span>
    </button>
  );
}
