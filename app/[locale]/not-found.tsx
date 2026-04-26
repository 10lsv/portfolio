import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

import { cn } from '@/lib/cn';

// Page 404 stylée (brief §6.10).
//  - Fullscreen bg-0
//  - "404" Clash 240px desktop / 120px mobile, fill gradient text-0 → accent
//  - Taglines FR/EN via next-intl (pas de duplication statique)
//  - Bouton retour accueil = next Link avec `/${locale}` pour préserver la
//    langue courante (pas un href="/" qui perdrait la locale)
//  - Fond : même CSS backdrop que le Hero + glitch effect sur "404" toutes
//    les 4s. Reduced-motion neutralise le glitch + retire le noise.
export default function NotFoundPage() {
  const t = useTranslations('notFound');
  const locale = useLocale();

  return (
    <main
      className={cn(
        'relative flex min-h-[100dvh] flex-col items-center justify-center',
        'overflow-hidden bg-bg-0 px-6 md:px-16',
      )}
    >
      {/* Même backdrop que le Hero (CSS-only). Pas de MediaQuery gate desktop
          ici : la 404 étant rare, on accepte le coût négligeable mobile. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 hero-backdrop-radial motion-safe:animate-hero-pulse" />
        <div className="absolute inset-0 hero-backdrop-noise" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 text-center">
        <h1
          className={cn(
            'notfound-title font-display font-semibold leading-none',
            'text-[120px] md:text-[240px]',
            'motion-safe:animate-glitch-404',
          )}
          aria-label="404"
        >
          404
        </h1>

        <p className="max-w-xl text-body-l text-text-1">{t('tagline')}</p>

        <Link
          href={`/${locale}`}
          className={cn(
            'inline-flex items-center gap-2 rounded-md border border-accent bg-accent px-6 py-3',
            'font-mono text-caption uppercase tracking-[0.15em] text-text-0',
            'transition-colors duration-(--duration-fast) ease-(--ease-in-out)',
            'hover:bg-accent-hi hover:border-accent-hi',
          )}
        >
          {t('cta')}
        </Link>
      </div>
    </main>
  );
}
