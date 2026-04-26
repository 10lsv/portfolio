'use client';

import { useEffect, useState } from 'react';

// SSR-safe media query. Valeur initiale à false côté serveur + premier render
// client, synchronisée au mount via matchMedia. Évite les mismatches d'hydratation.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
