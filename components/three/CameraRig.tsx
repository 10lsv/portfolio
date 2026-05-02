'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { type RefObject, useEffect, useRef } from 'react';
import * as THREE from 'three';

import { ScrollTrigger, gsap } from '@/lib/animations';

type CameraRigProps = {
  scrollRef: RefObject<HTMLElement | null>;
  startZ: number;
  endZ: number;
  /** Quand `enabled` est false, scroll-driven désactivé. */
  enabled: boolean;
  /** Si true, joue le dolly-in pendant l'intro (camera start Z plus loin). */
  playIntro: boolean;
  /** Position Z de départ pendant l'intro (avant dolly-in vers `startZ`). */
  introCameraStartZ: number;
  /** Durée totale de l'intro en ms (sync avec la cascade des cards). */
  introDurationMs: number;
};

// Caméra scroll-driven (brief §6.7.1) + intro dolly-in (sprint boost).
//
// Pendant l'intro (playIntro=true, enabled=false) :
//  - Camera Z démarre à introCameraStartZ (par ex. 8, plus loin)
//  - Tween GSAP vers startZ (3) sur introDurationMs, ease expo.out
//  - Effet "dolly in" cinématique parallèle à la cascade des cards
//
// Après l'intro (enabled=true) :
//  - ScrollTrigger créé, lit le scroll et anime targetZRef
//  - useFrame lerp la camera vers targetZRef chaque frame
export function CameraRig({
  scrollRef,
  startZ,
  endZ,
  enabled,
  playIntro,
  introCameraStartZ,
  introDurationMs,
}: CameraRigProps) {
  const { camera, invalidate } = useThree();
  const targetZRef = useRef(startZ);

  // Position initiale + dolly-in pendant l'intro.
  useEffect(() => {
    if (playIntro) {
      camera.position.set(0, 0, introCameraStartZ);
      camera.lookAt(0, 0, endZ);
      invalidate();

      // Dolly-in : tween camera position.z de introCameraStartZ → startZ
      // sur la durée totale de l'intro. expo.out (rapide au début, doux à
      // la fin) pour matcher la sensation des cards.
      const tween = gsap.to(camera.position, {
        z: startZ,
        duration: introDurationMs / 1000,
        ease: 'expo.out',
        onUpdate: () => invalidate(),
      });

      return () => {
        tween.kill();
      };
    }

    // Pas d'intro : camera directement à startZ.
    camera.position.set(0, 0, startZ);
    camera.lookAt(0, 0, endZ);
    invalidate();
  }, [
    camera,
    startZ,
    endZ,
    invalidate,
    playIntro,
    introCameraStartZ,
    introDurationMs,
  ]);

  // ScrollTrigger gated sur `enabled` (= introDone). Avant flip, pas de
  // tracking → camera figée (ou en dolly-in via le useEffect ci-dessus).
  useEffect(() => {
    if (!enabled || !scrollRef.current) return;

    // Sync targetZ avec la position actuelle de la camera (post-dolly-in)
    // pour éviter un saut au flip.
    targetZRef.current = camera.position.z;

    const st = ScrollTrigger.create({
      trigger: scrollRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        targetZRef.current = startZ + (endZ - startZ) * self.progress;
        invalidate();
      },
    });

    return () => {
      st.kill();
    };
  }, [enabled, endZ, invalidate, scrollRef, startZ, camera]);

  useFrame(() => {
    const prevZ = camera.position.z;
    const nextZ = THREE.MathUtils.lerp(prevZ, targetZRef.current, 0.12);
    camera.position.z = nextZ;
    if (Math.abs(prevZ - targetZRef.current) > 0.001) invalidate();
  });

  return null;
}
