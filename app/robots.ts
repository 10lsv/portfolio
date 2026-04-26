import type { MetadataRoute } from 'next';

const BASE_URL = 'https://leosauvey.fr';

// robots.txt généré par Next (brief §6.10). Allow all : pas de page sensible,
// la route /api/* est bloquée par défaut côté Vercel pour les bots qui
// respectent les directives, mais on n'a aucune raison de la cacher non plus
// (les routes /api/og + /api/project-cover servent des assets PNG public).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
