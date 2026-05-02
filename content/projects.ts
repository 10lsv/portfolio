// Données projets (brief §7). La partie traduisible (tagline, description,
// role) vit dans messages/*.json sous `projects.items.<id>`. Ici on garde
// uniquement ce qui est language-agnostic : id, titre, année, stack, statut,
// liens, et les signatures visuelles (accent dégradé + icône) consommées par
// la route `/api/project-cover/[slug]` qui génère les covers à la volée.
//
// `coverSrc` pointe vers cette route. Query `v` : version du cover — à bump
// manuellement si on change l'accent ou l'icône d'un projet (le Cache-Control
// immutable 1 an côté Edge/CDN/client nécessite une nouvelle URL pour bust).
export type ProjectStatus = 'live' | 'wip' | 'offline';

export type ProjectIcon =
  | 'Music'
  | 'BookOpen'
  | 'TrendingUp'
  | 'Camera'
  | 'Disc3'
  | 'Leaf';

export type Project = {
  id: string;
  title: string;
  year: string;
  stack: readonly string[];
  status: ProjectStatus;
  url?: string;
  github?: string;
  coverSrc?: string;
  featured?: boolean;
  /** Dégradé 135° du cover (from top-left → to bottom-right). */
  accent: { from: string; to: string };
  /** Icône Lucide affichée en filigrane bottom-right du cover. */
  icon: ProjectIcon;
};

// Ordre du tableau = ordre d'affichage galerie 2D + ordre de placement sur la
// spirale 3D (index 0 = position avant / featured, index N = la plus profonde).
// V8.3 : 4 projets (lsv-prono + libreo retirés). Spirale 3D ajustée à 4
// positions dans GalleryScene.tsx, CAMERA_END_Z réduit en conséquence.
export const PROJECTS: readonly Project[] = [
  {
    id: 'supify',
    title: 'Supify',
    year: '2026',
    stack: ['Next.js', 'TypeScript', 'React', 'TailwindCSS'],
    status: 'wip',
    url: 'https://supify.fr',
    github: 'https://github.com/10lsv',
    featured: true,
    coverSrc: '/api/project-cover/supify?v=11',
    accent: { from: '#A855F7', to: '#EC4899' },
    icon: 'Music',
  },
  // V8.5 : github fallback vers le profil général (le repo Nutriscan reste
  // privé mais le bouton "Code source" du modal pointe vers la liste
  // publique des repos de Léo — UX cohérente sur les 4 projets).
  {
    id: 'nutriscan',
    title: 'Nutriscan',
    year: '2025',
    stack: ['React Native', 'Node.js'],
    status: 'offline',
    github: 'https://github.com/10lsv',
    coverSrc: '/api/project-cover/nutriscan?v=9',
    accent: { from: '#22C55E', to: '#16A34A' },
    icon: 'Leaf',
  },
  {
    id: 'mkagain777',
    title: 'MKAgain777',
    year: '2026',
    stack: ['Next.js', 'TypeScript', 'React', 'Tailwind'],
    status: 'wip',
    url: 'https://mkagain-777.vercel.app/',
    github: 'https://github.com/10lsv',
    coverSrc: '/api/project-cover/mkagain777?v=10',
    accent: { from: '#8B0000', to: '#0A0A0A' },
    icon: 'Disc3',
  },
  {
    id: 'photographer-site',
    title: 'Photographer Site',
    year: '2025',
    stack: ['TypeScript', 'React', 'Next.js', 'Tailwind'],
    status: 'live',
    url: 'https://v0-photographe-website-three.vercel.app',
    github: 'https://github.com/10lsv/PHOTOGRAPHER-SITE',
    coverSrc: '/api/project-cover/photographer-site?v=10',
    accent: { from: '#27272A', to: '#0A0A0A' },
    icon: 'Camera',
  },
];
