import { ImageResponse } from 'next/og';
import { type NextRequest } from 'next/server';

export const runtime = 'edge';

// OG image dimensions standard 1.91:1 (1200×630). Recommandé Twitter/Facebook,
// support universel — pas de scaling forcé selon réseau.
const OG_W = 1200;
const OG_H = 630;

const CACHE_HEADER = 'public, max-age=31536000, immutable, s-maxage=31536000';

// Mêmes assets que /api/project-cover : Clash Display Bold posé localement,
// JetBrains Mono fetché upstream lucide. Le repo des fonts ne change pas →
// pas de divergence à craindre.
async function loadClashBold(req: NextRequest): Promise<ArrayBuffer> {
  const fontUrl = new URL('/fonts/ClashDisplay-Bold.ttf', req.url);
  const res = await fetch(fontUrl);
  if (!res.ok) throw new Error(`Clash Display Bold: ${res.status}`);
  return res.arrayBuffer();
}

async function loadJetBrainsMono(): Promise<ArrayBuffer> {
  const res = await fetch(
    'https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/ttf/JetBrainsMono-Regular.ttf',
  );
  if (!res.ok) throw new Error(`JetBrains Mono: ${res.status}`);
  return res.arrayBuffer();
}

type Locale = 'fr' | 'en';

// Tagline courte figée par locale — pas d'appel i18n côté Edge (cohérent
// avec /api/project-cover, brief §6.10 OG). Ces strings doivent rester
// alignées avec messages/{fr,en}.json `hero.tagline` (version courte ici).
const TAGLINE: Record<Locale, string> = {
  fr: 'Développeur freelance',
  en: 'Freelance developer',
};

const EYEBROW = '// PORTFOLIO 2026';

// Tokens dark figés (cohérent avec les covers projets — l'OG suit l'identité
// visuelle du site, pas son thème runtime).
const BG_0 = '#0A0A0A';
const TEXT_0 = '#F5F5F5';
const TEXT_1 = '#A3A3A3';
const ACCENT = '#B30000';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const localeParam = searchParams.get('locale');
  const locale: Locale = localeParam === 'en' ? 'en' : 'fr';

  const [clashBold, jetbrainsMono] = await Promise.all([
    loadClashBold(req),
    loadJetBrainsMono(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: BG_0,
          fontFamily: 'JetBrainsMono',
          padding: '80px 96px',
          position: 'relative',
        }}
      >
        {/* Halo radial discret bas-droit — accent --accent-glow. Reproduit
            l'ambiance Hero (brief §6.4) sans la complexité animation/noise. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 100% 100%, rgba(139,0,0,0.35) 0%, rgba(139,0,0,0.08) 30%, transparent 60%)',
            display: 'flex',
          }}
        />

        {/* Eyebrow mono accent */}
        <div
          style={{
            display: 'flex',
            fontFamily: 'JetBrainsMono',
            fontSize: 24,
            letterSpacing: 3,
            color: ACCENT,
            textTransform: 'uppercase',
            marginBottom: 32,
          }}
        >
          {EYEBROW}
        </div>

        {/* Titre Clash Display XXL */}
        <div
          style={{
            display: 'flex',
            fontFamily: 'ClashDisplay',
            fontWeight: 700,
            fontSize: 140,
            lineHeight: 0.95,
            letterSpacing: -4,
            color: TEXT_0,
            marginBottom: 40,
          }}
        >
          LÉO SAUVEY
        </div>

        {/* Tagline courte mono */}
        <div
          style={{
            display: 'flex',
            fontFamily: 'JetBrainsMono',
            fontSize: 32,
            color: TEXT_1,
          }}
        >
          {TAGLINE[locale]}
        </div>

        {/* Footer URL bottom-right — sobriété, pas de logo */}
        <div
          style={{
            position: 'absolute',
            right: 96,
            bottom: 56,
            display: 'flex',
            fontFamily: 'JetBrainsMono',
            fontSize: 18,
            letterSpacing: 2,
            color: TEXT_1,
          }}
        >
          leosauvey.fr
        </div>
      </div>
    ),
    {
      width: OG_W,
      height: OG_H,
      fonts: [
        { name: 'ClashDisplay', data: clashBold, style: 'normal', weight: 700 },
        {
          name: 'JetBrainsMono',
          data: jetbrainsMono,
          style: 'normal',
          weight: 400,
        },
      ],
      headers: { 'Cache-Control': CACHE_HEADER },
    },
  );
}
