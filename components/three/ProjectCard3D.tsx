'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { useCardTexture } from '@/lib/createCardTexture';

// Dimensions card 3D base (brief §6.7.1 : plane 4:3). 2 × 1.5 unités world.
const CARD_W = 2;
const CARD_H = 1.5;

// Accent --accent (dark, brief §3.1). Hardcode car three materials ne lisent
// pas les CSS vars. Light mode utilise la galerie 2D par design.
const ACCENT = '#8b0000';

// Opacités edges : standard vs featured (brief Sprint 4 deltas : 0.55 pour le
// hero de spirale, 0.35 pour les autres). Hover boost à 0.85 dans les 2 cas.
const EDGE_REST_STANDARD = 0.35;
const EDGE_REST_FEATURED = 0.55;
const EDGE_HOVER = 0.85;

// Scale du group featured. Différenciation taille immédiate sans surcharge
// visuelle (2.4 × 1.8 unités world vs 2 × 1.5 standard).
const FEATURED_SCALE = 1.2;

export type CardOrigin = { x: number; y: number };

export type ProjectCard3DProps = {
  id: string;
  title: string;
  coverSrc?: string;
  position: [number, number, number];
  rotationY: number;
  floatPhase: number;
  featured?: boolean;
  onOpen: (id: string, origin: CardOrigin) => void;
};

// Card 3D individuelle (brief §6.7.1).
//  - Plane avec CanvasTexture (placeholder Clash + swap auto sur PNG)
//  - Edges rouges émissifs (opacité rest dépend de `featured`, hover boost)
//  - Flottement sin(time) sur Y, phase décalée par card
//  - Hover : lerp Z +0.5 vers caméra + edge boost + cursor pointer
//  - Click : projette center world → screen pixels, transmet origin au modal
export function ProjectCard3D({
  id,
  title,
  coverSrc,
  position,
  rotationY,
  floatPhase,
  featured,
  onOpen,
}: ProjectCard3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const edgeMaterialRef = useRef<THREE.LineBasicMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const { camera, gl, invalidate } = useThree();

  const texture = useCardTexture(title, coverSrc);

  // EdgesGeometry mémoïsée : sinon on recrée un buffer à chaque render, leak
  // GPU. La `planeGeometry` source est mémoïsée aussi pour le même motif.
  const edgesGeometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(CARD_W, CARD_H);
    const edges = new THREE.EdgesGeometry(plane);
    plane.dispose();
    return edges;
  }, []);

  const edgeRestOpacity = featured ? EDGE_REST_FEATURED : EDGE_REST_STANDARD;
  const groupScale = featured ? FEATURED_SCALE : 1;

  const baseY = position[1];
  const baseZ = position[2];

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;

    // Float sin(time) (brief §6.7.1) — amplitude modeste, très lent.
    const floatY = Math.sin(t * 0.6 + floatPhase) * 0.05;
    groupRef.current.position.y = baseY + floatY;

    // Hover : lerp Z vers baseZ + 0.5 (avance vers caméra).
    const targetZ = hovered ? baseZ + 0.5 : baseZ;
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      targetZ,
      0.15,
    );

    // Edge opacity lerp : rest (0.35 standard, 0.55 featured) → 0.85 hover.
    if (edgeMaterialRef.current) {
      const target = hovered ? EDGE_HOVER : edgeRestOpacity;
      edgeMaterialRef.current.opacity = THREE.MathUtils.lerp(
        edgeMaterialRef.current.opacity,
        target,
        0.12,
      );
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (!groupRef.current) return;

    // Projection screen-space du centre de la card → origin modal (brief
    // §6.7.1 : "crossfade + scale depuis la position projetée").
    const worldPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(worldPos);
    worldPos.project(camera);

    const rect = gl.domElement.getBoundingClientRect();
    const screenX = rect.left + (worldPos.x * 0.5 + 0.5) * rect.width;
    const screenY = rect.top + (worldPos.y * -0.5 + 0.5) * rect.height;

    onOpen(id, { x: screenX, y: screenY });
  };

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHovered(true);
    gl.domElement.style.cursor = 'pointer';
    invalidate();
  };

  const handlePointerOut = () => {
    setHovered(false);
    gl.domElement.style.cursor = '';
    invalidate();
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={groupScale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Plane avec CanvasTexture (placeholder Clash OU cover PNG swapped).
          meshBasicMaterial : la texture est rendue brute, indépendamment des
          lumières — les covers s'affichent franches comme dans /api/project-
          cover/<slug>, sans désaturation par directional cool / ambient bas.
          La signature rouge reste assurée par les lineSegments edges. */}
      <mesh>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>

      {/* Edges rouges (brief §6.7.1 : bord émissif ~0.3). Opacité dépend de
          featured au rest, boost au hover. */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial
          ref={edgeMaterialRef}
          color={ACCENT}
          transparent
          opacity={edgeRestOpacity}
          linewidth={1}
        />
      </lineSegments>
    </group>
  );
}
