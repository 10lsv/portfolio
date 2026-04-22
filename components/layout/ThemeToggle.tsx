'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/cn';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('theme');
  const [mounted, setMounted] = useState(false);

  // next-themes : on attend la résolution côté client pour éviter les
  // mismatches d'hydratation (l'attribut initial est injecté par le script).
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';
  // Avant hydration, `resolvedTheme` est undefined côté serveur. On rend
  // un label stable (toggleDark, aligné avec le defaultTheme="dark") et on
  // attend `mounted` pour basculer — sinon mismatch SSR vs client.
  const label = mounted ? (isDark ? t('toggleLight') : t('toggleDark')) : t('toggleDark');

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative inline-flex size-10 items-center justify-center rounded-md',
        'text-text-0 transition-colors duration-(--duration-normal) ease-(--ease-in-out)',
        'hover:bg-bg-2 hover:text-accent-hi',
      )}
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-5" strokeWidth={1.5} aria-hidden />
        ) : (
          <Moon className="size-5" strokeWidth={1.5} aria-hidden />
        )
      ) : (
        <span className="size-5" aria-hidden />
      )}
    </button>
  );
}
