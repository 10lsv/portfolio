'use client';

import { Canvas } from '@react-three/fiber';
import { type RefObject, Suspense, useEffect, useState } from 'react';

import { CameraRig } from '@/components/three/CameraRig';
import { Lights } from '@/components/three/Lights';
import {
  type CardOrigin,
  ProjectCard3D,
} from '@/components/three/ProjectCard3D';
import type { Project } from '@/content/projects';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/useReducedMotion';

// Cards alignées sur Y=0 (centre vertical du viewport quand le canvas est
// sticky h-screen). Décision design Léo : chaque card doit être centrée
// verticalement pendant tout son temps de visibilité — la "spirale
// descendante" du brief §6.7.1 plaquait les cards de plus en plus bas et
// faisait apparaître Supify (y=0.35) en haut de cadre. Écart assumé.
//
// L'effet "spirale" est conservé via :
//  - Lateral X alterné (1.6, -1.55, 1.4) → flyby gauche/droite.
//  - rotationY alterné → tilt subtil cohérent.
//  - Pas de Z=3 conservé entre cards (lisibilité prouvée).
//
// V8.3 : 4 projets (lsv-prono + libreo retirés). Spirale réduite à 4
// positions (la dernière à z=-9). CAMERA_END_Z passe de -17 à -11 pour
// matcher la profondeur de la dernière card (z=-9) avec ~2 unités de
// dolly past pour arrêter la caméra juste après photographer-site.
const SPIRAL: ReadonlyArray<{
  position: [number, number, number];
  rotationY: number;
  floatPhase: number;
}> = [
  { position: [0, 0, 0], rotationY: 0, floatPhase: 0 },
  { position: [1.6, 0, -3], rotationY: -0.18, floatPhase: 1.2 },
  { position: [-1.55, 0, -6], rotationY: 0.2, floatPhase: 2.1 },
  { position: [1.4, 0, -9], rotationY: -0.14, floatPhase: 3.0 },
];

const CAMERA_START_Z = 3;
const CAMERA_END_Z = -11;

// Intro "fall" de la galerie — sprint boost agressif :
//  - profondeur Z 17 → 35 (cards démarrent 2× plus loin)
//  - durée 1.4s → 2.2s par card (plus de temps pour voir la chute)
//  - stagger 0.12s → 0.18s (cascade plus étalée)
//  - ease back.out(1.4) au lieu d'expo.out (overshoot léger à l'arrivée)
//  - rotation Y de chute ±0.8 rad qui se résorbe (cf. ProjectCard3D)
//  - point light rouge per-card (cf. ProjectCard3D)
//  - camera dolly-in : start z=8 → z=3 sur la durée totale (cinématique)
//  - pré-révélation : overlay rgba(0,0,0,0.15) qui disparaît juste avant
//    le premier tween (200ms) → effet "rideau qui se lève"
const INTRO_STAGGER = 0.18;
const INTRO_DURATION = 2.2;
const INTRO_TOTAL_MS = (SPIRAL.length * INTRO_STAGGER + INTRO_DURATION) * 1000;
const INTRO_PREREVEAL_MS = 200;
// Camera Z initial pendant l'intro (au lieu de CAMERA_START_Z = 3).
const INTRO_CAMERA_START_Z = 8;

// DEBUG : passe à true pour tracer le cycle de vie de l'intro 3D dans la
// console (introDone init, schedule, flip).
const DEBUG = false;
const log = (...args: unknown[]) => {
  if (DEBUG) console.log('[INTRO3D]', ...args);
};

type GallerySceneProps = {
  projects: readonly Project[];
  scrollRef: RefObject<HTMLElement | null>;
  onOpen: (id: string, origin: CardOrigin) => void;
};

// Scène 3D desktop (brief §6.7.1).
// frameloop="always" pour le float continu (Y/X/rotZ multi-phase).
// V8.6 : galerie 3D désactivée sur mobile (revert sprint Option C) →
// le mobile utilise une colonne verticale scroll-driven
// (ProjectGalleryMobile.tsx, Framer Motion useScroll). Ce composant
// reste DESKTOP UNIQUEMENT — props mobile / onCascadeComplete retirés.
export function GalleryScene({
  projects,
  scrollRef,
  onOpen,
}: GallerySceneProps) {
  const reducedMotion = useReducedMotion();

  // Init local au mount : reducedMotion skip, sinon intro à jouer.
  // Pas de persistance — re-mount = re-intro (cf. commentaire constant).
  const [introDone, setIntroDone] = useState(() => {
    if (reducedMotion) {
      log('init: reducedMotion=true → introDone=true (skip intro)');
      return true;
    }
    log('init: introDone=false → intro will play');
    return false;
  });

  // Confirme le mount du Canvas R3F (utile pour vérifier que use3D=true).
  useEffect(() => {
    log(`GalleryScene mounted, ${SPIRAL.length} cards, reducedMotion=${reducedMotion}`);
  }, [reducedMotion]);

  // Schedule le flip introDone après la durée totale. Au flip on enable la
  // camera scroll-driven. Pas de sessionStorage persist.
  useEffect(() => {
    if (introDone) {
      log('useEffect: introDone already true, no schedule');
      return;
    }
    log(`useEffect: scheduling flip in ${INTRO_TOTAL_MS + 50}ms`);

    const t = window.setTimeout(() => {
      log('timeout fired: setIntroDone(true)');
      setIntroDone(true);
    }, INTRO_TOTAL_MS + 50);

    return () => window.clearTimeout(t);
  }, [introDone]);

  const playIntro = !introDone;

  // Pré-révélation overlay (Anim 1D) — flag flippe true au mount, false
  // après INTRO_PREREVEAL_MS. V6 light : overlay rgba(255,255,255,0.15)
  // (auparavant noir 0.15 pour le dark theme). Sur fond blanc, le voile
  // blanc atténue subtilement les cards pendant le pré-reveal.
  // Skipped si reducedMotion / introDone déjà true.
  const [showPreReveal, setShowPreReveal] = useState(playIntro);
  useEffect(() => {
    if (!playIntro) {
      setShowPreReveal(false);
      return;
    }
    setShowPreReveal(true);
    const t = window.setTimeout(
      () => setShowPreReveal(false),
      INTRO_PREREVEAL_MS,
    );
    return () => window.clearTimeout(t);
  }, [playIntro]);

  return (
    <div className="relative size-full">
      <Canvas
        frameloop="always"
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        camera={{
          position: [0, 0, playIntro ? INTRO_CAMERA_START_Z : CAMERA_START_Z],
          fov: 45,
          near: 0.1,
          far: 80,
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Lights />
          <CameraRig
            scrollRef={scrollRef}
            startZ={CAMERA_START_Z}
            endZ={CAMERA_END_Z}
            enabled={introDone}
            playIntro={playIntro}
            introCameraStartZ={INTRO_CAMERA_START_Z}
            introDurationMs={INTRO_TOTAL_MS}
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
                playIntro={playIntro}
                enterDelay={i * INTRO_STAGGER}
                enterDuration={INTRO_DURATION}
                onOpen={onOpen}
              />
            );
          })}
        </Suspense>
      </Canvas>

      {/* Pré-révélation overlay (Anim 1D) — fade out 200ms. pointer-events
          none pour ne pas bloquer les hover/click sur le canvas dessous. */}
      {playIntro && (
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 bg-white/15',
            'transition-opacity duration-200 ease-out',
            showPreReveal ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
    </div>
  );
}
