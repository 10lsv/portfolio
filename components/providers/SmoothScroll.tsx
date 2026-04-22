'use client';

import { useEffect } from 'react';

import { useLenis } from '@/lib/useLenis';
import { useReducedMotion } from '@/lib/useReducedMotion';

// Header desktop = 72px (brief §6.2). On offset les ancres pour éviter de
// passer sous le header fixed.
const ANCHOR_OFFSET = -72;

export function SmoothScroll() {
  const reducedMotion = useReducedMotion();
  const lenisRef = useLenis({ enabled: !reducedMotion });

  // Intercepte les liens internes `<a href="#...">` pour router via Lenis
  // (sinon le scroll natif entre en conflit avec le hijack Lenis).
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const el = document.querySelector(href);
      if (!el) return;

      e.preventDefault();

      const lenis = lenisRef.current;
      if (lenis) {
        lenis.scrollTo(el as HTMLElement, { offset: ANCHOR_OFFSET });
      } else {
        // Fallback (reduced-motion ou Lenis pas encore prêt) : scroll natif.
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
      }

      // Hash dans l'URL sans déclencher un scroll natif.
      history.replaceState(null, '', href);
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [lenisRef]);

  return null;
}
