'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { locales } from '@/i18n';
import { cn } from '@/lib/cn';

// LocaleToggle V5 Minimal Apple — "FR · EN" (point médian au lieu de "/")
// en text-sm, sans monospace, sans uppercase — vibe Apple sobriety.
// Active state = text-text-1 (blanc), inactive = text-text-3 (gris).
// Hover Apple : opacity 0.6 sur l'élément inactif.
export function LocaleToggle() {
  const locale = useLocale();
  const t = useTranslations('locale');
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchTo = (target: (typeof locales)[number]) => {
    if (target === locale) return;
    const segments = pathname.split('/');
    segments[1] = target;
    const nextPath = segments.join('/') || `/${target}`;
    startTransition(() => {
      router.replace(nextPath);
    });
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm font-normal',
        isPending && 'opacity-60',
      )}
      role="group"
      aria-label="Language"
    >
      {locales.map((loc, i) => {
        const active = loc === locale;
        return (
          <div key={loc} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => switchTo(loc)}
              aria-label={loc === 'fr' ? t('switchToFr') : t('switchToEn')}
              aria-pressed={active}
              className={cn(
                'uppercase transition-opacity duration-(--duration-normal) ease-(--ease-expo-out)',
                active ? 'text-text-1 opacity-100' : 'text-text-3 hover:opacity-60',
              )}
            >
              {loc}
            </button>
            {i === 0 && (
              <span className="text-text-3 select-none" aria-hidden>
                ·
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
