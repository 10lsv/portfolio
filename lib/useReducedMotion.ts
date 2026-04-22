'use client';

import { useEffect, useState } from 'react';

// Hook centralisé pour tous les gardes d'anims (brief §3.5 + §10.2).
// SSR-safe : la valeur démarre à false puis se synchronise côté client.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
