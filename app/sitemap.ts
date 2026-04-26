import type { MetadataRoute } from 'next';

import { defaultLocale, locales } from '@/i18n';

const BASE_URL = 'https://leosauvey.fr';

// Sitemap multi-locale (brief §6.10 SEO). next-intl ne génère pas de sitemap
// auto — on liste manuellement les routes top-level pour chaque locale, avec
// `alternates.languages` pour signaler les variantes hreflang à Google.
//
// Une seule route pour l'instant (homepage). Si on ajoute d'autres pages
// (ex. case studies), étendre ROUTES en gardant le même shape.
const ROUTES = [{ path: '', priority: 1.0, changeFrequency: 'monthly' as const }];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return ROUTES.flatMap((route) =>
    locales.map((locale) => {
      const url = `${BASE_URL}/${locale}${route.path}`;

      // hreflang : map des variantes pour Google. La locale par défaut (fr)
      // sert aussi de `x-default` (route /<defaultLocale> est la canonical).
      const languages: Record<string, string> = Object.fromEntries(
        locales.map((l) => [l, `${BASE_URL}/${l}${route.path}`]),
      );
      languages['x-default'] = `${BASE_URL}/${defaultLocale}${route.path}`;

      return {
        url,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages },
      };
    }),
  );
}
