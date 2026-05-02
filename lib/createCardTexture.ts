'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

// Dimensions de la texture (8:5, aligné avec le PNG natif 1600×1000 servi
// par /api/project-cover). Drawn sans stretch.
const TEX_W = 1600;
const TEX_H = 1000;

// Rayon du clip rounded-rect appliqué à la texture (canvas pixels). 64px
// sur 1600px de large = 4% — visible mais pas trop arrondi. Match (en
// proportion) le CORNER_RADIUS_WORLD du wireframe 3D dans ProjectCard3D.tsx
// (0.08 world / 2.0 width = 4%).
const TEX_RADIUS = 64;

// Couleurs placeholder (hardcode — three.js materials ne lisent pas les CSS vars).
// Valeurs adaptées au mode light du site V6+ : surface très claire, texte
// gris foncé pour rester lisible avant le swap sur le PNG cover.
const PLACEHOLDER_BG = '#f5f5f5';
const PLACEHOLDER_FG = '#666666';
const PLACEHOLDER_FONT_PX = 160;
const PLACEHOLDER_FONT_FAMILY = '"Clash Display", system-ui, sans-serif';

// Trace un rounded-rect dans le current path du context (ne fill pas, laisse
// le caller décider entre fill / clip / stroke).
function tracePath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Wipe + clip rounded → laisse les coins du canvas transparents. Tous les
// draws qui suivent sont confinés à la zone rounded-rect.
function setupRoundedClip(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, TEX_W, TEX_H);
  tracePath(ctx, 0, 0, TEX_W, TEX_H, TEX_RADIUS);
  ctx.clip();
}

function drawPlaceholder(
  ctx: CanvasRenderingContext2D,
  title: string,
): void {
  ctx.save();
  setupRoundedClip(ctx);

  ctx.fillStyle = PLACEHOLDER_BG;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  ctx.fillStyle = PLACEHOLDER_FG;
  ctx.font = `600 ${PLACEHOLDER_FONT_PX}px ${PLACEHOLDER_FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '-2px';
  ctx.fillText(title.toUpperCase(), TEX_W / 2, TEX_H / 2);

  ctx.restore();
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
          // Wipe + clip rounded à chaque draw : sans clearRect on garderait
          // les pixels du placeholder dans les coins (la clip exclut les
          // coins mais ne wipe pas l'historique). Avec clearRect d'abord,
          // les coins repartent transparents — propre.
          ctx.save();
          setupRoundedClip(ctx);
          // Drawn 1:1 : le PNG /api/project-cover est nativement 1600×1000,
          // identique à TEX_W × TEX_H. Pas de stretch, pas de crop.
          ctx.drawImage(img, 0, 0, TEX_W, TEX_H);
          ctx.restore();
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
