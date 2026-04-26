'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

// Dimensions de la texture placeholder. Ratio 4:3 (matche le planeGeometry 2×1.5).
// 1600×1200 = bon compromis netteté vs VRAM (1 seule mipmap complète ≈ 7.6 Mo).
const TEX_W = 1600;
const TEX_H = 1200;

// Couleurs placeholder (hardcode — three.js materials ne lisent pas les CSS vars).
// Valeurs synchrones avec les tokens dark brief §3.1 : bg-2 fond, text-1 titre.
const PLACEHOLDER_BG = '#1f1f1f';
const PLACEHOLDER_FG = '#a3a3a3';
const PLACEHOLDER_FONT_PX = 160;
const PLACEHOLDER_FONT_FAMILY = '"Clash Display", system-ui, sans-serif';

function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  title: string,
): void {
  ctx.fillStyle = PLACEHOLDER_BG;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  ctx.fillStyle = PLACEHOLDER_FG;
  ctx.font = `600 ${PLACEHOLDER_FONT_PX}px ${PLACEHOLDER_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Tracking serré + uppercase pour matcher le placeholder 2D DOM.
  ctx.letterSpacing = '-2px';
  ctx.fillText(title.toUpperCase(), TEX_W / 2, TEX_H / 2);
}

/**
 * Hook qui retourne une THREE.Texture pour une card projet.
 *
 * - Sans `coverSrc` : placeholder CanvasTexture (bg-bg-2 + nom en Clash),
 *   dessiné après `document.fonts.ready` pour éviter la fallback Inter.
 * - Avec `coverSrc` : placeholder d'abord, puis l'image loadée est drawn sur
 *   le même canvas, un seul `needsUpdate = true` swap le visuel. Pas de
 *   re-création de Texture → pas de flash, pas de leak.
 *
 * Dispose à l'unmount.
 */
export function useCardTexture(
  title: string,
  coverSrc?: string,
): THREE.Texture {
  const { texture, canvas } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = TEX_W;
    c.height = TEX_H;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    return { texture: t, canvas: c };
  }, []);

  // Draw placeholder une fois Clash prête + swap auto sur cover PNG si fourni.
  useEffect(() => {
    let cancelled = false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawAndMark = () => {
      if (cancelled) return;
      drawPlaceholder(ctx, title);
      texture.needsUpdate = true;
    };

    // Étape 1 : placeholder dès que Clash est prête. Sans fonts.ready on
    // risque la première frame en Inter (le fallback système).
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(drawAndMark);
    } else {
      drawAndMark();
    }

    // Étape 2 : si cover fourni, on charge le PNG et on le drawn sur le canvas.
    // Un seul objet Texture pour toute la durée de vie → pas de flash au swap.
    if (coverSrc) {
      const loader = new THREE.ImageLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(
        coverSrc,
        (img) => {
          if (cancelled) return;
          // Fit cover : on stretch au rectangle de la texture (les PNG sont
          // supposés respecter ~4:3 par convention, brief §7). Si ratio autre,
          // le plane renderra l'image un peu déformée — à corriger plus tard.
          ctx.drawImage(img, 0, 0, TEX_W, TEX_H);
          texture.needsUpdate = true;
        },
        undefined,
        () => {
          // En cas d'erreur de load, on garde le placeholder. Silence volontaire.
        },
      );
    }

    return () => {
      cancelled = true;
    };
  }, [canvas, coverSrc, texture, title]);

  // Libère la GPU memory à l'unmount.
  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return texture;
}
