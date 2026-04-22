import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from './i18n';

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  // brief §8 : détection auto désactivée, FR forcé par défaut.
  localeDetection: false,
  localePrefix: 'always',
});

export const config = {
  // matcher : tout sauf assets internes et API
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
