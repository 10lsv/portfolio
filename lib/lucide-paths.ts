// SVG paths extraits depuis lucide/lucide (v0.462.x, ISC license).
// Source : https://github.com/lucide/lucide/tree/main/icons
// Rendus via <svg viewBox="0 0 24 24" stroke="currentColor" fill="none"
// strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">.
//
// Les icônes sont inlinées ici pour être consommables en Edge runtime
// (route /api/project-cover) sans import de lucide-react qui dépend du DOM.
//
// Pour ajouter une icône : copier les enfants (<path>, <circle>, etc.) du
// fichier SVG lucide et les coller en string dans la map ci-dessous.
import type { ProjectIcon } from '@/content/projects';

export type LucidePath = {
  paths: ReadonlyArray<
    | { type: 'path'; d: string }
    | { type: 'circle'; cx: string; cy: string; r: string }
    | { type: 'line'; x1: string; y1: string; x2: string; y2: string }
  >;
};

export const LUCIDE_PATHS: Record<ProjectIcon, LucidePath> = {
  // music.svg
  Music: {
    paths: [
      { type: 'path', d: 'M9 18V5l12-2v13' },
      { type: 'circle', cx: '6', cy: '18', r: '3' },
      { type: 'circle', cx: '18', cy: '16', r: '3' },
    ],
  },
  // leaf.svg
  Leaf: {
    paths: [
      {
        type: 'path',
        d: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z',
      },
      { type: 'path', d: 'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12' },
    ],
  },
  // book-open.svg
  BookOpen: {
    paths: [
      { type: 'path', d: 'M12 7v14' },
      {
        type: 'path',
        d: 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
      },
    ],
  },
  // trending-up.svg
  TrendingUp: {
    paths: [
      { type: 'path', d: 'M16 7h6v6' },
      { type: 'path', d: 'm22 7-8.5 8.5-5-5L2 17' },
    ],
  },
  // camera.svg
  Camera: {
    paths: [
      {
        type: 'path',
        d: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z',
      },
      { type: 'circle', cx: '12', cy: '13', r: '3' },
    ],
  },
  // disc-3.svg
  Disc3: {
    paths: [
      { type: 'circle', cx: '12', cy: '12', r: '10' },
      { type: 'path', d: 'M6 12c0-1.7.7-3.2 1.8-4.2' },
      { type: 'circle', cx: '12', cy: '12', r: '2' },
      { type: 'path', d: 'M18 12c0 1.7-.7 3.2-1.8 4.2' },
    ],
  },
};
