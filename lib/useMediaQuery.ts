'use client';

import { useEffect, useState } from 'react';

// DEBUG : trace verbose pour Sprint 3 fix isDesktop. Off en prod.
const DEBUG = false;
const log = (...args: unknown[]) => {
  if (DEBUG) console.log('[useMediaQuery]', ...args);
};

// Brute-force MQL hook (Sprint 3 fix).
// Le pattern précédent (useState seul puis useSyncExternalStore) restait
// bloqué à `false` dans certains contextes navigateur — on ne fait pas la
// chasse au pourquoi exact, on combine 3 sources qui convergent vers le
// même setState (idempotent) :
//   1. window.matchMedia(...).matches  → standard
//   2. window.innerWidth >= threshold  → backup parsing du query (cas où
//      matchMedia ne firerait pas pour une raison X)
//   3. resize listener                 → changements dynamiques + 2e source
//
// useState (et NON useRef) pour déclencher un re-render à chaque update.
// useEffect côté client uniquement (return early si window undefined).
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Parse min-width: Npx du query → seuil pour le fallback innerWidth.
    // Pour les queries non-min-width (max-width, prefers-*), threshold reste
    // null et on s'appuie uniquement sur matchMedia.
    const minWidthMatch = query.match(/min-width:\s*(\d+)px/);
    const minWidthStr = minWidthMatch?.[1];
    const threshold = minWidthStr ? Number.parseInt(minWidthStr, 10) : null;

    const compute = (origin: string) => {
      const mqMatches = window.matchMedia(query).matches;
      const innerWidthMatches =
        threshold !== null ? window.innerWidth >= threshold : false;
      const result = mqMatches || innerWidthMatches;
      log(
        `${origin}: query="${query}" mqMatches=${mqMatches} innerWidth=${window.innerWidth} (>=${threshold}? ${innerWidthMatches}) → ${result}`,
      );
      return result;
    };

    setMatches(compute('mount'));

    const mq = window.matchMedia(query);
    const onMqChange = () => setMatches(compute('mq-change'));
    mq.addEventListener('change', onMqChange);

    let onResize: (() => void) | null = null;
    if (threshold !== null) {
      onResize = () => setMatches(compute('resize'));
      window.addEventListener('resize', onResize);
    }

    return () => {
      mq.removeEventListener('change', onMqChange);
      if (onResize) window.removeEventListener('resize', onResize);
    };
  }, [query]);

  return matches;
}
