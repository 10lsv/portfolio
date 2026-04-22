import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registers GSAP plugins once, côté client uniquement (ScrollTrigger accède
// à `window`). Importé par tous les composants qui utilisent ScrollTrigger.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

/**
 * Config par défaut des reveals scroll (brief §6.5 : trigger 20% visible).
 * `toggleActions: 'play none none none'` = joue à l'entrée, pas de replay
 * au sortie, pas de reset — l'animation ne se rejoue pas si on remonte.
 */
export const REVEAL_SCROLL_TRIGGER = {
  start: 'top 80%',
  toggleActions: 'play none none none',
} as const;
