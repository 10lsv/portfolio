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
  // matcher : tout sauf assets internes, API, favicons App Router (icon +
  // apple-icon servis sans extension par app/icon.tsx + app/apple-icon.tsx,
  // ils tombaient sinon dans le rewrite locale → 307 vers /fr/icon → 404).
  // Les routes avec extension (sitemap.xml, robots.txt, .png, .ico, etc.)
  // matchent déjà `.*\\..*`.
  matcher: ['/((?!api|_next|_vercel|icon|apple-icon|.*\\..*).*)'],
};
