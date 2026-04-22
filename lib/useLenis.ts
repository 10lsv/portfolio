'use client';

import Lenis from '@studio-freight/lenis';
import { useEffect, useRef } from 'react';

import { ScrollTrigger, gsap } from '@/lib/animations';

type UseLenisOptions = {
  enabled: boolean;
};

// Single-instance Lenis tied to the component lifecycle.
// Intégration canonique avec GSAP : gsap.ticker pilote lenis.raf (une seule
// horloge pour tout le runtime anim), et ScrollTrigger.update est appelé
// sur chaque `scroll` Lenis (sinon les triggers dérivent de la position
// réelle du scroll hijacké).
export function useLenis({ enabled }: UseLenisOptions) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      duration: 1.2,
      // easeOutExpo — matche notre ease-expo-out.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1,
    });
    lenisRef.current = lenis;

    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);

    const tick = (time: number) => {
      // gsap.ticker passe le temps en secondes, lenis attend des ms.
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Force un recalcul des triggers une fois Lenis monté, au cas où
    // des ST aient été créés avant.
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(tick);
      lenis.off('scroll', onScroll);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled]);

  return lenisRef;
}
