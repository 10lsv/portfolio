'use client';

// Éclairage scène 3D (brief §6.7.1) : ambient 0.3 + directional froid top-left
// + point light rouge en back pour le halo signature.
export function Lights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[-6, 6, 6]}
        intensity={0.9}
        color="#dce5ef"
      />
      <pointLight
        position={[0, -1, -10]}
        intensity={8}
        distance={18}
        decay={1.6}
        color="#8b0000"
      />
    </>
  );
}
