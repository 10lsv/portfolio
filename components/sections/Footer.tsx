import { useTranslations } from 'next-intl';

import { cn } from '@/lib/cn';

// Footer V6 — ultra minimal (refonte sprint chirurgical).
// Une seule ligne : le copyright. Centré horizontalement, py-8
// resserré, gris discret (text-text-3), pas de border-top, pas de
// liens sociaux, pas de tagline. Vibe "fin de page Apple".
export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer
      className={cn(
        // V8.4 sprint chirurgical : pt-2 (8px) au lieu de py-8 (32px) pour
        // rapprocher la ligne copyright des socials Contact ci-dessus. pb-8
        // conservé pour respiration en bas de page.
        'flex justify-center pt-2 pb-8 px-6 text-center bg-bg-0',
      )}
    >
      <span className="text-xs text-text-3">{t('copyright')}</span>
    </footer>
  );
}
