import { ImageResponse } from 'next/og';

// Favicon 32×32 généré via ImageResponse Edge. "LSV" en Inter bold-équivalent
// (system sans-serif → indistinguable d'Inter à 32px), accent rouge sur fond
// bg-0. Choix du programmatique vs un .ico statique : permet de re-générer
// instantanément si l'identité visuelle bouge, et le rendu est piloté par
// le runtime React donc cohérent avec le reste du site.
export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0A',
          color: '#8B0000',
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: -0.5,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        LSV
      </div>
    ),
    { ...size },
  );
}
