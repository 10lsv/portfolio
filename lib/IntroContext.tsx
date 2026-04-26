'use client';

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useReducedMotion } from '@/lib/useReducedMotion';

// Session-scoped flag : le loader ne joue qu'une fois par session, pas aux
// navigations internes ni aux reload dans la même session (brief §6.1).
// Namespace pour éviter collisions futures si d'autres données session.
const INTRO_SS_KEY = 'leosauvey-intro-played';

type IntroContextValue = {
  /** true quand le hero peut démarrer son animation d'entrée. */
  introDone: boolean;
  /** Appelé par le Loader à la fin de son timeline (ou skip). */
  markDone: () => void;
};

const IntroContext = createContext<IntroContextValue | null>(null);

type IntroProviderProps = {
  children: ReactNode;
};

// Provider racine. Décide au mount si le loader doit jouer :
//  - déjà joué cette session (sessionStorage) → introDone true immédiat
//  - prefers-reduced-motion → introDone true immédiat + marque la session
//    comme jouée pour que l'utilisateur ne voie pas le loader en navigation
//  - sinon → introDone false, laisse le Loader jouer et appeler markDone()
export function IntroProvider({ children }: IntroProviderProps) {
  const [introDone, setIntroDone] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let alreadyPlayed = false;
    try {
      alreadyPlayed = sessionStorage.getItem(INTRO_SS_KEY) === '1';
    } catch {
      // Cookies/storage désactivés → on force le loader pour cohérence UX.
    }

    if (alreadyPlayed) {
      setIntroDone(true);
      return;
    }

    if (reducedMotion) {
      try {
        sessionStorage.setItem(INTRO_SS_KEY, '1');
      } catch {
        /* noop */
      }
      setIntroDone(true);
    }
  }, [reducedMotion]);

  const markDone = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_SS_KEY, '1');
    } catch {
      /* noop */
    }
    setIntroDone(true);
  }, []);

  return (
    <IntroContext.Provider value={{ introDone, markDone }}>
      {children}
    </IntroContext.Provider>
  );
}

export function useIntro(): IntroContextValue {
  const ctx = useContext(IntroContext);
  if (!ctx) {
    throw new Error('useIntro must be used within <IntroProvider>');
  }
  return ctx;
}
