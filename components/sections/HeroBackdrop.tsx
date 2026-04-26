'use client';

import { useMediaQuery } from '@/lib/useMediaQuery';
import { useReducedMotion } from '@/lib/useReducedMotion';

// Backdrop Hero CSS-only (brief §6.4 — ambiance Vercel pas Lusion).
//  - Radial rouge --accent depuis le coin bas-droit, opacity max 0.15
//  - Noise SVG statique (public/noise.svg) en mix-blend-mode overlay, opacity 0.06
//  - Pulse CSS très lent (24s) sur la radial pour un mouvement presque imperceptible
//
// Gates :
//  - <1024px : backdrop retiré entièrement pour préserver perf mobile
//  - prefers-reduced-motion : pas de pulse CSS, noise retiré (élément statique
//    OK mais animation interdite)
//
// Zéro WebGL → pas de Canvas concurrent avec la galerie 3D, bundle inchangé.
export function HeroBackdrop() {
  const reducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (!isDesktop) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Radial rouge coin bas-droit. Opacity pulse via keyframe hero-pulse
          (défini dans globals.css), désactivé en reduced-motion. */}
      <div
        className={
          reducedMotion
            ? 'absolute inset-0 hero-backdrop-radial opacity-100'
            : 'absolute inset-0 hero-backdrop-radial motion-safe:animate-hero-pulse'
        }
      />
      {!reducedMotion && (
        // Noise statique via filter SVG externe (public/noise.svg). mix-blend-mode
        // overlay pour se fondre dans la radial sans ajouter de luminosité.
        <div className="absolute inset-0 hero-backdrop-noise" />
      )}
    </div>
  );
}
