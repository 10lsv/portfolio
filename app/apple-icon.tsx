import { ImageResponse } from 'next/og';

// Apple touch icon 180×180 — affiché quand un user "Add to Home Screen"
// depuis Safari iOS. iOS ignore les méta favicons standards et lit ce slug
// précis (app/apple-icon.tsx → /apple-icon.png).
export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: -2,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        LSV
      </div>
    ),
    { ...size },
  );
}
