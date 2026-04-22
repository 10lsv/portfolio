'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { locales } from '@/i18n';
import { cn } from '@/lib/cn';

export function LocaleToggle() {
  const locale = useLocale();
  const t = useTranslations('locale');
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchTo = (target: (typeof locales)[number]) => {
    if (target === locale) return;
    // Remplace le préfixe de locale courant dans le path (ex: /fr/... → /en/...).
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
        'flex items-center gap-1 font-mono text-sm',
        isPending && 'opacity-60',
      )}
      role="group"
      aria-label="Language"
    >
      {locales.map((loc, i) => {
        const active = loc === locale;
        return (
          <div key={loc} className="flex items-center">
            <button
              type="button"
              onClick={() => switchTo(loc)}
              aria-label={loc === 'fr' ? t('switchToFr') : t('switchToEn')}
              aria-pressed={active}
              className={cn(
                'px-1 uppercase transition-colors duration-(--duration-normal)',
                active
                  ? 'text-text-0'
                  : 'text-text-2 hover:text-text-1',
              )}
            >
              {loc}
            </button>
            {i === 0 && <span className="text-text-2" aria-hidden>/</span>}
          </div>
        );
      })}
    </div>
  );
}
