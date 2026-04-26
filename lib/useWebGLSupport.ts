'use client';

import { useEffect, useState } from 'react';

// Détection WebGL pour fallback galerie 3D → 2D (brief §6.7.1).
// SSR-safe : toujours false avant hydratation, testé au mount.
export function useWebGLSupport(): boolean {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl');
      setSupported(!!gl);
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
}
