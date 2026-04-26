'use client';

import { Canvas } from '@react-three/fiber';
import { type RefObject, Suspense } from 'react';

import { CameraRig } from '@/components/three/CameraRig';
import { Lights } from '@/components/three/Lights';
import {
  type CardOrigin,
  ProjectCard3D,
} from '@/components/three/ProjectCard3D';
import type { Project } from '@/content/projects';

// Spirale descendante légère sur l'axe Z (brief §6.7.1). Cards alternées
// gauche/droite pour un effet "flyby" plutôt qu'une traversée frontale.
// Index 0 = featured (Supify) : placé au centre pour le hero d'entrée.
//
// Écart brief §6.7.1 : la spirale était calibrée pour 5 cards. L'ajout d'un
// 6e projet (nutriscan) impose une étape supplémentaire — on conserve le pas
// Z=3 entre cards (lisibilité préservée, identique aux 5 premiers slots) et
// on bumpe CAMERA_END_Z de -14 à -17 pour absorber la profondeur ajoutée.
const SPIRAL: ReadonlyArray<{
  position: [number, number, number];
  rotationY: number;
  floatPhase: number;
}> = [
  { position: [0, 0.35, 0], rotationY: 0, floatPhase: 0 },
  { position: [1.6, 0.05, -3], rotationY: -0.18, floatPhase: 1.2 },
  { position: [-1.55, -0.2, -6], rotationY: 0.2, floatPhase: 2.1 },
  { position: [1.4, -0.45, -9], rotationY: -0.14, floatPhase: 3.0 },
  { position: [-1.3, -0.7, -12], rotationY: 0.16, floatPhase: 4.1 },
  { position: [1.2, -0.95, -15], rotationY: -0.12, floatPhase: 5.0 },
];

const CAMERA_START_Z = 3;
const CAMERA_END_Z = -17;

type GallerySceneProps = {
  projects: readonly Project[];
  scrollRef: RefObject<HTMLElement | null>;
  onOpen: (id: string, origin: CardOrigin) => void;
};

// Scène 3D desktop (brief §6.7.1).
// frameloop="demand" : pas de rendu en idle, ScrollTrigger et les handlers
// pointer appellent invalidate(). Le float sin(time) n'anime donc que
// pendant interaction — comportement attendu par le brief §6.7.1 perf.
export function GalleryScene({
  projects,
  scrollRef,
  onOpen,
}: GallerySceneProps) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, CAMERA_START_Z], fov: 45, near: 0.1, far: 50 }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <Lights />
        <CameraRig
          scrollRef={scrollRef}
          startZ={CAMERA_START_Z}
          endZ={CAMERA_END_Z}
        />
        {projects.slice(0, SPIRAL.length).map((project, i) => {
          const layout = SPIRAL[i];
          if (!layout) return null;
          return (
            <ProjectCard3D
              key={project.id}
              id={project.id}
              title={project.title}
              coverSrc={project.coverSrc}
              position={layout.position}
              rotationY={layout.rotationY}
              floatPhase={layout.floatPhase}
              featured={project.featured}
              onOpen={onOpen}
            />
          );
        })}
      </Suspense>
    </Canvas>
  );
}
