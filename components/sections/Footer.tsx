import { useTranslations } from 'next-intl';

import { cn } from '@/lib/cn';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer
      className={cn(
        // Desktop : row 96px avec space-between. Mobile : stack centré.
        'flex flex-col items-center justify-center gap-2 px-6 py-8',
        'md:h-24 md:flex-row md:justify-between md:gap-0 md:px-16 md:py-0',
        'font-mono text-text-2 text-caption',
        'border-t border-border',
      )}
    >
      <span>{t('rights')}</span>
      <span>{t('mention')}</span>
    </footer>
  );
}
