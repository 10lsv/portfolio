import { ImageResponse } from 'next/og';
import { type NextRequest } from 'next/server';

import { PROJECTS, type ProjectIcon } from '@/content/projects';
import { LUCIDE_PATHS, type LucidePath } from '@/lib/lucide-paths';

// Runtime Edge explicite (exigence utilisateur). Permet le rendu instantané
// via ImageResponse sans cold start Node.
export const runtime = 'edge';

// Dimensions cover : 1600×1000 = ratio 8:5, cohérent avec le plane 3D
// (CARD_W/CARD_H) et l'aspect-[8/5] du ProjectCard 2D.
const COVER_W = 1600;
const COVER_H = 1000;

// Cache 1 an immutable (contrat avec la query `?v=N` : on bump v quand on
// change la composition, jamais sur la même URL).
const CACHE_HEADER = 'public, max-age=31536000, immutable, s-maxage=31536000';

// V8.1 — composition cover (tags techs retirés).
// - Top-left (sans logo) : icône Lucide filigrane subtle (signature)
// - Centre (avec logo) : logo PNG redimensionné (320×320 vs 400 avant)
// - Bottom : overlay gradient + titre + tagline (zone de lecture sombre)
//
// Pas de tag pills techs en haut-droite — retirés au sprint chirurgical
// urgent (encombraient la composition).

// Slugs avec logo PNG perso disponible dans /public/projects/<slug>-logo.png.
// Étendre cette liste quand un nouveau logo est ajouté côté assets.
const SLUGS_WITH_LOGO: ReadonlySet<string> = new Set([
  'supify',
  'nutriscan',
  'mkagain777',
  'photographer-site',
]);

// Fetch du TTF Clash Display Bold posé dans public/fonts/. ArrayBuffer passé
// à ImageResponse pour le rendu des titres en Clash.
async function loadClashBold(req: NextRequest): Promise<ArrayBuffer> {
  const fontUrl = new URL('/fonts/ClashDisplay-Bold.ttf', req.url);
  const res = await fetch(fontUrl);
  if (!res.ok) {
    throw new Error(`Failed to load Clash Display Bold TTF: ${res.status}`);
  }
  return res.arrayBuffer();
}

// Fetch JetBrains Mono depuis le repo officiel. Utilisé pour la tagline +
// les chips techs.
async function loadJetBrainsMono(): Promise<ArrayBuffer> {
  const res = await fetch(
    'https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/ttf/JetBrainsMono-Regular.ttf',
  );
  if (!res.ok) throw new Error(`JetBrains Mono: ${res.status}`);
  return res.arrayBuffer();
}

// Encode un ArrayBuffer en base64 pour data URL (Edge n'a pas Buffer).
// Découpage par chunks de 32KB pour éviter un stack overflow sur
// String.fromCharCode.apply avec de gros PNG.
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(
      null,
      chunk as unknown as number[],
    );
  }
  return btoa(binary);
}

// Fetch optionnel d'un logo perso (asset local public/projects/<slug>-logo.png).
async function loadProjectLogo(
  slug: string,
  req: NextRequest,
): Promise<string | null> {
  try {
    const url = new URL(`/projects/${slug}-logo.png`, req.url);
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return `data:image/png;base64,${arrayBufferToBase64(buf)}`;
  } catch {
    return null;
  }
}

// Rend les paths Lucide en JSX <svg>.
function renderLucideIcon(iconName: ProjectIcon, size: number, color: string) {
  const icon: LucidePath = LUCIDE_PATHS[iconName];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icon.paths.map((p, i) => {
        if (p.type === 'path') return <path key={i} d={p.d} />;
        if (p.type === 'circle')
          return <circle key={i} cx={p.cx} cy={p.cy} r={p.r} />;
        return <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />;
      })}
    </svg>
  );
}

// Cover 404 minimaliste — image plutôt qu'un HTTP 404 pour que crawlers ne
// voient pas de cascade d'erreurs si un slug est mal configuré.
function render404(clashBold: ArrayBuffer, jetbrainsMono: ArrayBuffer) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0A',
          color: '#F5F5F5',
          fontFamily: 'JetBrainsMono',
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: 4,
            color: '#B30000',
            marginBottom: 24,
          }}
        >
          404
        </div>
        <div
          style={{
            fontFamily: 'ClashDisplay',
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: -2,
            textAlign: 'center',
          }}
        >
          PROJECT NOT FOUND
        </div>
      </div>
    ),
    {
      width: COVER_W,
      height: COVER_H,
      fonts: [
        { name: 'ClashDisplay', data: clashBold, style: 'normal', weight: 700 },
        { name: 'JetBrainsMono', data: jetbrainsMono, style: 'normal', weight: 400 },
      ],
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    },
  );
}

type Params = { slug: string };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.id === slug);

  // V8.7 : query `clean=1` skip le titre + overlay gradient de la PNG.
  // Utilisé par ProjectModal qui affiche déjà le titre dans son panneau
  // droit (évite duplication "her Site" cropped sur la cover modal).
  // La galerie 3D + cards 2D fallback continuent de fetch la PNG sans
  // le param → titre baké conservé pour la signature visuelle gallery.
  const url = new URL(req.url);
  const isClean = url.searchParams.get('clean') === '1';

  const [clashBold, jetbrainsMono, logo] = await Promise.all([
    loadClashBold(req),
    loadJetBrainsMono(),
    SLUGS_WITH_LOGO.has(slug)
      ? loadProjectLogo(slug, req)
      : Promise.resolve(null),
  ]);

  if (!project) {
    return render404(clashBold, jetbrainsMono);
  }

  const { accent, icon, title } = project;
  const isWithLogo = SLUGS_WITH_LOGO.has(slug) && logo !== null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
          fontFamily: 'JetBrainsMono',
          overflow: 'hidden',
        }}
      >
        {/* Filigrane icône Lucide top-left — projets sans logo PNG.
            Position (96, 96), taille 280, opacity 0.12. Donne une
            signature visuelle subtile sans concurrencer le titre. */}
        {!isWithLogo && (
          <div
            style={{
              position: 'absolute',
              left: 96,
              top: 96,
              display: 'flex',
              opacity: 1,
              color: 'rgba(255,255,255,0.12)',
            }}
          >
            {renderLucideIcon(icon, 280, 'rgba(255,255,255,0.12)')}
          </div>
        )}

        {/* Logo perso — V8.5 : centrage parfait au milieu de la cover
            (top = (1000 - 480) / 2 = 260). La cover est croppée portrait
            par object-cover dans le modal (zone visible verticale), donc
            le logo doit être au centre du PNG pour rester centré dans le
            modal aussi. */}
        {isWithLogo && (
          <div
            style={{
              position: 'absolute',
              left: (COVER_W - 480) / 2,
              top: (COVER_H - 480) / 2,
              width: 480,
              height: 480,
              display: 'flex',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo as string} width={480} height={480} alt="" />
          </div>
        )}

        {/* Overlay gradient bas (skip si clean=1 — pas de titre à
            assombrir). Hauteur 500px = 50% de la cover, transparent →
            noir 0.45 pour lisibilité du titre blanc sur fonds clairs. */}
        {!isClean && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 500,
              display: 'flex',
              background:
                'linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 100%)',
            }}
          />
        )}

        {/* Titre bottom-left (skip si clean=1). Clash Display Bold 80px
            (64px si > 14 chars pour rester monoligne), text-shadow pour
            lisibilité même sans gradient parfait. Le modal demande
            ?clean=1 → cette zone reste vide → le titre n'apparait que
            dans le panneau droit du modal. Galerie 3D + cards 2D
            (sans clean) gardent le titre baké comme signature visuelle. */}
        {!isClean && (
          <div
            style={{
              position: 'absolute',
              left: 96,
              bottom: 96,
              display: 'flex',
              maxWidth: COVER_W - 192,
            }}
          >
            <div
              style={{
                fontFamily: 'ClashDisplay',
                fontWeight: 700,
                fontSize: title.length > 14 ? 64 : 80,
                lineHeight: 1,
                letterSpacing: -2,
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                textShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              {title}
            </div>
          </div>
        )}
      </div>
    ),
    {
      width: COVER_W,
      height: COVER_H,
      fonts: [
        { name: 'ClashDisplay', data: clashBold, style: 'normal', weight: 700 },
        {
          name: 'JetBrainsMono',
          data: jetbrainsMono,
          style: 'normal',
          weight: 400,
        },
      ],
      headers: {
        'Cache-Control': CACHE_HEADER,
      },
    },
  );
}

// V8.5 : TAGLINES_FR retiré — la tagline ne figure plus dans le PNG cover
// (duplication avec le panneau droit du modal qui l'affiche déjà en Inter).
// Le PNG ne contient plus que titre + logo (ou icône Lucide pour les
// projets sans logo).

