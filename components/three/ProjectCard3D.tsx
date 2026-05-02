'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { useCardTexture } from '@/lib/createCardTexture';
import { gsap } from '@/lib/animations';

// DEBUG : passe à true pour tracer le tween d'entrée par card.
const DEBUG = false;
const log = (id: string, ...args: unknown[]) => {
  if (DEBUG) console.log(`[INTRO3D ${id}]`, ...args);
};

// Dimensions card 3D base : plane 8:5 (2 × 1.25 unités world) — ratio natif
// des covers PNG (1600×1000) générées par /api/project-cover. Aligné avec la
// card 2D (aspect-[8/5]). Évite le squash vertical de la texture qui existait
// quand le plane était 4:3 (1.5 de haut) : le canvas drawn 8:5 dans 4:3
// stretchait le PNG.
const CARD_W = 2;
const CARD_H = 1.25;

// V8.2 — Bords arrondis 3D via approche canvas-clip (alternative
// shader-free).
//
// Pourquoi pas SDF onBeforeCompile : tentative précédente cassait la
// compilation du fragment shader ("Fragment shader is not compiled" /
// "VALIDATE_STATUS false") — `vUv` n'est pas garantie comme varying
// dans MeshBasicMaterial selon la version Three.js.
//
// Approche actuelle : le rounded clip est posé directement sur le
// canvas 2D qui sert de source à la CanvasTexture (cf. createCardTexture.ts).
// Les coins du canvas restent transparents → la texture appliquée sur
// le plane est rounded "from the inside". Avec `transparent: true` sur
// le material, les coins du mesh deviennent invisibles. Pas de shader
// custom, pas de risque de breakage.
//
// Le mesh garde sa planeGeometry rectangulaire (pointer events sur les
// coins invisibles → trade-off accepté, zone négligeable). Le wireframe
// rouge utilise une géométrie path rounded-rect via THREE.Shape (cf.
// edgesGeometry plus bas), pour matcher visuellement les coins de la
// texture.
//
// CORNER_RADIUS_WORLD : 0.08 world units = 4% de CARD_W (= 4% des 1600px
// canvas via le ratio identique 8:5). Match avec TEX_RADIUS=64px du
// canvas (proportions cohérentes).
const CORNER_RADIUS_WORLD = 0.08;

// Accent --accent (dark, brief §3.1). Hardcode car three materials ne lisent
// pas les CSS vars. Light mode utilise la galerie 2D par design.
const ACCENT = '#8b0000';

// Opacités edges : standard vs featured (brief Sprint 4 deltas : 0.55 pour le
// hero de spirale, 0.35 pour les autres). Hover boost 0.85 → 1.0 (sprint
// boost agressif, magnitude 1.5x). Intro start boost 1.2 (clamped à 1
// matériellement par THREE — sert de target visuel).
const EDGE_REST_STANDARD = 0.35;
const EDGE_REST_FEATURED = 0.55;
const EDGE_HOVER = 1.0;
const EDGE_INTRO_START = 1.2;

// Scale du group featured. Différenciation taille immédiate sans surcharge
// visuelle (2.4 × 1.5 unités world vs 2 × 1.25 standard).
const FEATURED_SCALE = 1.2;
// Boost scale au hover (Anim 3E) — addition au scale layout.
const HOVER_SCALE_BOOST = 1.08;

// Intro "fall" : la card part loin DANS la scène (Z très négatif, profond
// dans le frustum). Sprint boost agressif : profondeur 17 → 35, durée
// 1.4s → 2.2s, ease back.out(1.4) (overshoot léger), rotation Y de chute
// ±0.8 rad (≈45°) qui se résorbe vers rotationY layout, point light rouge
// par card qui suit la chute (intensité 2 → 0). Camera : voir CameraRig.
const FALL_FROM_Z_DEPTH = 35;
const FALL_OPACITY_RAMP = 0.3;
// Rotation Y additionnelle pendant la chute, sign basé sur layoutX pour
// que les cards "side gauche" tournent vers la droite et inversement.
const FALL_YAW_AMPLITUDE = 0.8;
// Point light rouge qui suit la card pendant sa chute. Intensité initiale
// élevée puis lerp à 0 sur le tween.
const FALL_LIGHT_INTENSITY = 2;
const FALL_LIGHT_DISTANCE = 5;

export type CardOrigin = { x: number; y: number };

export type ProjectCard3DProps = {
  id: string;
  title: string;
  coverSrc?: string;
  position: [number, number, number];
  rotationY: number;
  floatPhase: number;
  featured?: boolean;
  /** Si true, la card fait son entrée "fall from afar" au mount. */
  playIntro: boolean;
  /** Délai (sec) avant le start du tween d'entrée. Stagger côté parent. */
  enterDelay: number;
  /** Durée (sec) du tween d'entrée. */
  enterDuration: number;
  onOpen: (id: string, origin: CardOrigin) => void;
};

// Card 3D individuelle (brief §6.7.1).
//  - Plane avec CanvasTexture (placeholder Clash + swap auto sur PNG)
//  - Edges rouges émissifs (opacité rest dépend de `featured`, hover boost)
//  - Flottement sin(time) sur Y, phase décalée par card
//  - Hover : lerp Z +0.5 vers caméra + edge boost + cursor pointer
//  - Click : projette center world → screen pixels, transmet origin au modal
//  - Intro fall : start z=baseZ+17 + opacity 0, settle vers position finale.
export function ProjectCard3D({
  id,
  title,
  coverSrc,
  position,
  rotationY,
  floatPhase,
  featured,
  playIntro,
  enterDelay,
  enterDuration,
  onOpen,
}: ProjectCard3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const edgeMaterialRef = useRef<THREE.LineBasicMaterial>(null);
  const meshMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  // Point light rouge qui suit la card pendant la chute (Anim 1C). Intensité
  // animée dans useFrame pendant l'intro, retombe à 0 à la fin.
  const introLightRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);
  const { camera, gl, invalidate } = useThree();

  const texture = useCardTexture(title, coverSrc);

  // Progrès du tween d'entrée — 0 = card loin/invisible, 1 = card en place.
  // Ref (pas state) : on met à jour à chaque frame du tween sans déclencher
  // de re-render React.
  const introProgressRef = useRef({ v: playIntro ? 0 : 1 });

  // Sign de la rotation Y de chute basé sur layout X : cards "right side"
  // (X positif) tournent négativement vers la gauche pendant la chute, et
  // inversement. Donne un effet de "swirl" cohérent avec la spirale.
  const yawSign = position[0] >= 0 ? -1 : 1;

  // Edge wireframe rounded-rect — THREE.Shape trace 4 lignes droites + 4
  // arcs (24 segments par arc, 96 au total). LineLoop ferme automatiquement
  // la boucle. Match exact avec le clip du canvas via CORNER_RADIUS_WORLD.
  const edgesGeometry = useMemo(() => {
    const w2 = CARD_W / 2;
    const h2 = CARD_H / 2;
    const r = CORNER_RADIUS_WORLD;
    const shape = new THREE.Shape();
    shape.moveTo(-w2 + r, -h2);
    shape.lineTo(w2 - r, -h2);
    shape.absarc(w2 - r, -h2 + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(w2, h2 - r);
    shape.absarc(w2 - r, h2 - r, r, 0, Math.PI / 2, false);
    shape.lineTo(-w2 + r, h2);
    shape.absarc(-w2 + r, h2 - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-w2, -h2 + r);
    shape.absarc(-w2 + r, -h2 + r, r, Math.PI, 1.5 * Math.PI, false);
    const points = shape
      .getPoints(24)
      .map((p) => new THREE.Vector3(p.x, p.y, 0));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  // Dispose edgesGeometry à l'unmount.
  useEffect(() => {
    return () => edgesGeometry.dispose();
  }, [edgesGeometry]);

  const edgeRestOpacity = featured ? EDGE_REST_FEATURED : EDGE_REST_STANDARD;
  const groupScale = featured ? FEATURED_SCALE : 1;

  const baseY = position[1];
  const baseZ = position[2];

  // Tween GSAP vers progress=1. Demande invalidate() à chaque tick pour
  // que useFrame s'exécute (frameloop="demand").
  useEffect(() => {
    if (!playIntro) {
      log(id, 'playIntro=false, snap to v=1');
      introProgressRef.current.v = 1;
      return;
    }
    log(id, `playIntro=true, schedule tween delay=${enterDelay}s`);
    introProgressRef.current.v = 0;
    invalidate();

    const tween = gsap.to(introProgressRef.current, {
      v: 1,
      duration: enterDuration,
      delay: enterDelay,
      // back.out(1.4) : overshoot léger en fin de tween → effet "rebond"
      // discret à l'arrivée des cards. Plus expressif qu'expo.out.
      ease: 'back.out(1.4)',
      onStart: () => log(id, 'tween onStart'),
      onUpdate: () => invalidate(),
      onComplete: () => log(id, 'tween onComplete'),
    });

    return () => {
      tween.kill();
    };
  }, [playIntro, enterDelay, enterDuration, invalidate, id]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const v = introProgressRef.current.v;

    if (v < 1) {
      // Phase intro : override position Y/Z, rotation Y de chute, opacities,
      // point light intensity. Float et hover désactivés pendant la chute.
      groupRef.current.position.x = position[0];
      groupRef.current.position.y = baseY;
      groupRef.current.position.z = baseZ - (1 - v) * FALL_FROM_Z_DEPTH;

      // Rotation Y additionnelle pendant la chute, se résorbe vers
      // rotationY final layout. (1 - v) * yawSign * 0.8.
      groupRef.current.rotation.y =
        rotationY + (1 - v) * yawSign * FALL_YAW_AMPLITUDE;

      if (meshMaterialRef.current) {
        meshMaterialRef.current.opacity = Math.min(1, v / FALL_OPACITY_RAMP);
      }

      if (edgeMaterialRef.current) {
        // Edge opacity start boost (1.2 → rest). Magnitude 1.5x vs v1.
        edgeMaterialRef.current.opacity = THREE.MathUtils.lerp(
          EDGE_INTRO_START,
          edgeRestOpacity,
          v,
        );
      }

      if (introLightRef.current) {
        // Intensité point light : démarre FALL_LIGHT_INTENSITY → 0 sur le
        // tween. Light positionné sur la card → la suit via le group ref.
        introLightRef.current.intensity = FALL_LIGHT_INTENSITY * (1 - v);
      }
      return;
    }

    // Post-intro : assure point light éteinte (idempotent au cas où).
    if (introLightRef.current && introLightRef.current.intensity > 0) {
      introLightRef.current.intensity = 0;
    }

    // Post-intro : flux normal (float multi-axe + yaw infinite + hover lerp).
    // Float boost (Léo "cards vivantes") : 4 oscillations désynchronisées
    // sur Y / X / rot Z / rot Y (yaw F) avec phases différentes pour
    // qu'aucune card ne flotte en sync avec une autre.
    const t = state.clock.elapsedTime;
    const phaseY = floatPhase;
    const phaseX = floatPhase + 1.7;
    const phaseRotZ = floatPhase + 3.3;
    const phaseYaw = floatPhase + 5.1;

    // Sprint boost agressif : amplitudes ~1.7x + speed 0.4 → 0.6.
    const floatY = Math.sin(t * 0.6 + phaseY) * 0.2;
    const floatX = Math.sin(t * 0.6 + phaseX) * 0.1;
    const floatRotZ = Math.sin(t * 0.6 + phaseRotZ) * 0.06;
    // Anim F boost : yaw infinite ±0.15 rad (1.9x) sur 8s.
    const yawIdle =
      rotationY +
      Math.sin(t * ((2 * Math.PI) / 8) + phaseYaw) * 0.15;

    groupRef.current.position.y = baseY + floatY;
    groupRef.current.position.x = position[0] + floatX;
    groupRef.current.rotation.z = floatRotZ;

    // Anim H boost : hover yaw "tilt vers viewer" + lerp factor 0.25 → 0.35
    // (réponse plus rapide). Leave : retour yaw idle, lerp 0.12 (doux).
    const targetYaw = hovered ? 0 : yawIdle;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetYaw,
      hovered ? 0.35 : 0.12,
    );

    // Hover : lerp Z vers baseZ + 0.5 (avance vers caméra).
    const targetZ = hovered ? baseZ + 0.5 : baseZ;
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      targetZ,
      0.15,
    );

    // Anim 3E : scale boost au hover (1.08 multiplicatif sur le scale
    // layout). Plus de présence visuelle.
    const baseScale = featured ? FEATURED_SCALE : 1;
    const targetScale = hovered ? baseScale * HOVER_SCALE_BOOST : baseScale;
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.2),
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
      // scale initial appliqué via useFrame (gère hover boost + featured).
      // Init à groupScale pour éviter un flash au premier render avant que
      // useFrame ait tourné.
      scale={groupScale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Point light rouge per-card (Anim 1C) — suit la card via le group
          parent. Intensity 0 par défaut, animée à FALL_LIGHT_INTENSITY → 0
          dans useFrame pendant l'intro. Position légèrement avant la card
          (z=+0.3) pour éclairer ses bords vers la caméra. */}
      <pointLight
        ref={introLightRef}
        position={[0, 0, 0.3]}
        intensity={playIntro ? FALL_LIGHT_INTENSITY : 0}
        distance={FALL_LIGHT_DISTANCE}
        decay={1.6}
        color="#8b0000"
      />
      {/* Plane avec CanvasTexture (placeholder Clash OU cover PNG swapped).
          meshBasicMaterial : la texture est rendue brute, indépendamment des
          lumières — les covers s'affichent franches comme dans /api/project-
          cover/<slug>, sans désaturation par directional cool / ambient bas.
          La signature rouge reste assurée par les lineSegments edges.
          `transparent: true` pour pouvoir animer .opacity pendant l'intro. */}
      <mesh>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshBasicMaterial
          ref={meshMaterialRef}
          map={texture}
          toneMapped={false}
          transparent
          opacity={playIntro ? 0 : 1}
        />
      </mesh>

      {/* Edges rouges (brief §6.7.1) — lineLoop sur le path rounded-rect,
          ferme automatiquement la boucle. Opacité dépend de featured au
          rest, boost au hover, et boost initial pendant l'intro. */}
      <lineLoop geometry={edgesGeometry}>
        <lineBasicMaterial
          ref={edgeMaterialRef}
          color={ACCENT}
          transparent
          opacity={playIntro ? EDGE_HOVER : edgeRestOpacity}
          linewidth={1}
        />
      </lineLoop>
    </group>
  );
}
