'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { BurgerMenu } from './BurgerMenu';
import { LocaleToggle } from './LocaleToggle';
import { cn } from '@/lib/cn';

// Header V6 — Minimal Apple light, transparent permanent (refonte
// sprint chirurgical).
//
// Layout :
//   - GAUCHE  : VIDE
//   - CENTRE  : VIDE
//   - DROITE  : LocaleToggle "FR · EN" + BurgerButton (ThemeToggle
//               supprimé du sprint chirurgical, light-only)
//
// Hauteur : 56px mobile, 64px desktop.
//
// Background : TRANSPARENT en permanence — plus de logique scrolled →
// backdrop-blur. Apple Vision Pro / Apple.com landings : le contenu
// scrollé passe sous le header sans frosted glass, le header reste
// pur transparent. Cohérent avec le bg-bg-0 (#FFFFFF) du body sur
// lequel le hero se fond.
//
// Aucune border-bottom : structurer visuellement le header n'apporte
// rien dans le contexte light pur (séparation déjà claire par le
// padding du contenu).
//
// scrolled state retiré (plus de scroll listener associé, économie
// minime mais cohérence "rien ne se passe au scroll").
export function Header() {
  const t = useTranslations('nav');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 flex w-full items-center justify-end',
          'h-14 md:h-16',
          'px-6 md:px-12',
          'bg-transparent',
        )}
      >
        <div className="flex items-center gap-4 md:gap-6">
          <LocaleToggle />
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
        'z-50 text-text-1 transition-opacity duration-(--duration-normal) ease-(--ease-expo-out)',
        'hover:opacity-60',
      )}
    >
      <span className="sr-only">{open ? labelClose : labelOpen}</span>
      {/* 3 traits hairline (h-px) — vibe Apple. Apple-ease sur la
          transition ouverte → fermée. */}
      <span aria-hidden className="relative block h-3.5 w-5">
        <span
          className={cn(
            'absolute left-0 block h-px w-full bg-current',
            'transition-transform duration-(--duration-normal) ease-(--ease-expo-out)',
            open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0',
          )}
        />
        <span
          className={cn(
            'absolute top-1/2 left-0 block h-px w-full -translate-y-1/2 bg-current',
            'transition-opacity duration-(--duration-fast)',
            open ? 'opacity-0' : 'opacity-100',
          )}
        />
        <span
          className={cn(
            'absolute left-0 block h-px w-full bg-current',
            'transition-transform duration-(--duration-normal) ease-(--ease-expo-out)',
            open ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-0',
          )}
        />
      </span>
    </button>
  );
}
