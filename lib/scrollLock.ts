'use client';

import type Lenis from '@studio-freight/lenis';

// Store module-scope de l'instance Lenis. Posé par useLenis() au mount,
// consommé par les composants qui ont besoin de freezer le scroll (modal
// projet, etc.). Lenis pilote via transform sur <html>, donc un simple
// overflow:hidden sur body ne suffit pas à le stopper.
let lenisInstance: Lenis | null = null;

export function setLenisInstance(instance: Lenis | null) {
  lenisInstance = instance;
}

export function lockScroll() {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = 'hidden';
  lenisInstance?.stop();
}

export function unlockScroll() {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = '';
  lenisInstance?.start();
}
