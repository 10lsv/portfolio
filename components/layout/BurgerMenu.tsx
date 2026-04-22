'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { href: '#home', key: 'home' },
  { href: '#projects', key: 'projects' },
  { href: '#about', key: 'about' },
  { href: '#contact', key: 'contact' },
] as const;

type BurgerMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function BurgerMenu({ open, onClose }: BurgerMenuProps) {
  const t = useTranslations('nav');

  // Escape ferme le menu (brief §6.3).
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Verrouille le scroll body quand le menu est ouvert.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div
      id="burger-menu"
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      aria-label="Main menu"
      // Clip-path circle qui s'étend depuis le coin top-right (brief §6.3).
      // 600ms ease-expo-out. Inactif au repos (pointer-events none) pour ne
      // pas intercepter les clics.
      className={cn(
        'fixed inset-0 z-40 bg-bg-0',
        'transition-[clip-path,opacity] duration-(--duration-slow) ease-(--ease-expo-out)',
        open
          ? 'pointer-events-auto opacity-100 [clip-path:circle(150%_at_100%_0%)]'
          : 'pointer-events-none opacity-0 [clip-path:circle(0%_at_100%_0%)]',
      )}
    >
      <nav
        className="flex h-full w-full items-center justify-start px-6 md:px-16"
        aria-label="Primary"
      >
        <ul className="flex flex-col gap-6">
          {NAV_ITEMS.map((item) => (
            <li key={item.key}>
              <a
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group relative inline-flex items-center font-display font-semibold',
                  'text-[48px] leading-none md:text-[80px]',
                  'text-text-0 transition-[transform,color] duration-(--duration-fast) ease-(--ease-out-smooth)',
                  'hover:translate-x-6 hover:text-text-0',
                )}
              >
                {/* Barre rouge à gauche au hover (brief §6.3) */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute -left-6 top-1/2 h-[2px] w-4 -translate-y-1/2 bg-accent',
                    'origin-left scale-x-0 transition-transform duration-(--duration-fast) ease-(--ease-out-smooth)',
                    'group-hover:scale-x-100',
                  )}
                />
                {t(item.key)}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
