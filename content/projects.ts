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
// Écart brief §7 : 6 projets (le brief verrouille 5 cards calibrées pour la
// spirale 3D Sprint 4). Spirale étendue à 6 positions dans GalleryScene.tsx,
// CAMERA_END_Z bumped en conséquence.
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
    coverSrc: '/api/project-cover/supify?v=4',
    accent: { from: '#A855F7', to: '#EC4899' },
    icon: 'Music',
  },
  // Repo privé volontairement → ni `url` ni `github`.
  {
    id: 'nutriscan',
    title: 'Nutriscan',
    year: '2025',
    stack: ['React Native', 'Node.js'],
    status: 'offline',
    coverSrc: '/api/project-cover/nutriscan?v=2',
    accent: { from: '#22C55E', to: '#16A34A' },
    icon: 'Leaf',
  },
  {
    id: 'mkagain777',
    title: 'MKAgain777',
    year: '2026',
    stack: ['Next.js', 'TypeScript', 'React', 'Tailwind'],
    status: 'wip',
    github: 'https://github.com/10lsv',
    coverSrc: '/api/project-cover/mkagain777?v=2',
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
    coverSrc: '/api/project-cover/photographer-site?v=2',
    accent: { from: '#27272A', to: '#0A0A0A' },
    icon: 'Camera',
  },
  {
    id: 'lsv-prono',
    title: 'LSV Prono',
    year: '2025',
    stack: ['TypeScript', 'React', 'Next.js'],
    status: 'live',
    github: 'https://github.com/10lsv/LSV-PRONO',
    coverSrc: '/api/project-cover/lsv-prono?v=2',
    accent: { from: '#10B981', to: '#3B82F6' },
    icon: 'TrendingUp',
  },
  {
    id: 'libreo',
    title: 'Libreo',
    year: '2025',
    stack: ['TypeScript', 'React', 'Next.js', 'Tailwind'],
    status: 'live',
    github: 'https://github.com/10lsv/LIBREO',
    coverSrc: '/api/project-cover/libreo?v=2',
    accent: { from: '#F59E0B', to: '#EAB308' },
    icon: 'BookOpen',
  },
];
