'use client';

import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/useReducedMotion';

// Détection touch device au mount. On ne peut pas se fier à `window.matchMedia('(min-width)')`
// car iPad Pro dépasse 1024px en "touch only". `(any-pointer: coarse)` matche dès
// qu'au moins un pointer touch existe → plus fiable que viewport width.
function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(any-pointer: coarse)');
    setIsTouch(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isTouch;
}

type MagneticLinkProps = {
  children: ReactNode;
  /** Intensité du magnétisme (fraction du delta cursor→center). Défaut 0.25. */
  strength?: number;
  /** Zone de détection au-delà de la bounding box (px). Défaut 0 = bbox stricte. */
  radius?: number;
  className?: string;
};

// Wrapper magnétique (brief §5 + polish §5).
// Throttle via requestAnimationFrame : un seul write DOM par frame même si le
// mousemove fire 200Hz sur certaines souris gaming. Cursor → centre → translate
// proportionnel. Reset smooth au pointerleave.
//
// Gates : touch device OFF (rien à "aimanter" au doigt), reduced-motion OFF.
// Dans ces cas on rend les children en wrapper neutre — aucune différence DOM
// pour la cible, préserve l'accessibilité et les autres effets CSS (underline hover).
export function MagneticLink({
  children,
  strength = 0.25,
  radius = 0,
  className,
}: MagneticLinkProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const reducedMotion = useReducedMotion();
  const isTouch = useIsTouchDevice();

  const enabled = !reducedMotion && !isTouch;

  const applyTransform = useCallback(() => {
    if (!wrapperRef.current) return;
    const { x, y } = targetRef.current;
    wrapperRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const scheduleFrame = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      applyTransform();
    });
  }, [applyTransform]);

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLSpanElement>) => {
      if (!enabled || !wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      // Zone d'effet : bbox + radius. Hors zone, on n'applique pas.
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      if (radius > 0) {
        const d = Math.hypot(dx, dy);
        const max = Math.max(rect.width, rect.height) / 2 + radius;
        if (d > max) return;
      }
      targetRef.current = { x: dx * strength, y: dy * strength };
      scheduleFrame();
    },
    [enabled, radius, scheduleFrame, strength],
  );

  const handlePointerLeave = useCallback(() => {
    if (!enabled) return;
    targetRef.current = { x: 0, y: 0 };
    scheduleFrame();
  }, [enabled, scheduleFrame]);

  // Cleanup RAF au démontage pour éviter write sur node détaché.
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  if (!enabled) {
    // Fallback neutre : span inline-block sans listener, le children hérite de
    // son comportement natif (focus, hover, underline, etc.).
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      ref={wrapperRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn(
        'inline-block will-change-transform',
        'transition-transform duration-(--duration-normal) ease-(--ease-out-smooth)',
        className,
      )}
    >
      {children}
    </span>
  );
}
