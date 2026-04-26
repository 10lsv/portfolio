'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { type RefObject, useEffect, useRef } from 'react';
import * as THREE from 'three';

import { ScrollTrigger } from '@/lib/animations';

type CameraRigProps = {
  scrollRef: RefObject<HTMLElement | null>;
  startZ: number;
  endZ: number;
};

// Caméra scroll-driven (brief §6.7.1). ScrollTrigger avec scrub lit la
// progression de scroll sur le conteneur donné ; on stocke la cible dans un
// ref et useFrame lerp la position caméra vers elle — ce pattern garde un
// mouvement fluide même quand le scroll Lenis est saccadé.
export function CameraRig({ scrollRef, startZ, endZ }: CameraRigProps) {
  const { camera, invalidate } = useThree();
  const targetZRef = useRef(startZ);

  useEffect(() => {
    if (!scrollRef.current) return;

    // Position de départ : on force la caméra au startZ au montage.
    camera.position.set(0, 0, startZ);
    camera.lookAt(0, 0, endZ);

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
  }, [camera, endZ, invalidate, scrollRef, startZ]);

  useFrame(() => {
    const prevZ = camera.position.z;
    const nextZ = THREE.MathUtils.lerp(prevZ, targetZRef.current, 0.12);
    camera.position.z = nextZ;
    // Si l'écart reste significatif, on demande une frame de plus pour finir
    // l'interpolation (frameloop="demand").
    if (Math.abs(prevZ - targetZRef.current) > 0.001) invalidate();
  });

  return null;
}
