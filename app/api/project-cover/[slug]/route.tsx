import { ImageResponse } from 'next/og';
import { type NextRequest } from 'next/server';

import { PROJECTS, type Project, type ProjectIcon } from '@/content/projects';
import { LUCIDE_PATHS, type LucidePath } from '@/lib/lucide-paths';

// Runtime Edge explicite (exigence utilisateur). Permet le rendu instantané
// via ImageResponse sans cold start Node.
export const runtime = 'edge';

// Dimensions cover. 1600×1000 = ratio 8:5, cohérent avec le plane 3D 4:3
// stretch et l'aspect-[4/3] du ProjectCard 2D (les deux croppent proprement).
const COVER_W = 1600;
const COVER_H = 1000;

// Cache 1 an immutable (contrat avec la query `?v=N` : on bump v quand on
// change un accent/icône, jamais sur la même URL).
const CACHE_HEADER = 'public, max-age=31536000, immutable, s-maxage=31536000';

// Map des couleurs de badge statut (brief §6.7.2 + StatusBadge component).
const STATUS_COLOR: Record<Project['status'], string> = {
  live: '#3f9960', // --success
  wip: '#B30000', // --accent-hi (plus lisible sur bg dégradé que --accent)
  offline: '#6B6B6B', // --text-2
};

const STATUS_LABEL_FR: Record<Project['status'], string> = {
  live: 'EN LIGNE',
  wip: 'EN COURS',
  offline: 'PROJET TERMINÉ',
};

// Slugs pour lesquels un logo PNG perso est disponible dans /public/projects/.
// Le nom de fichier suit la convention <slug>-logo.png. Étendre cette liste
// quand un nouveau projet a un logo dispo (le helper loadProjectLogo gère le
// fallback silencieux si le PNG est absent).
const SLUGS_WITH_LOGO: ReadonlySet<string> = new Set(['supify', 'nutriscan']);

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

// Fetch JetBrains Mono depuis le repo officiel (raw TTF stable). Le cover
// n'utilise pas Inter en visible (tous les textes sont en Clash ou JB Mono),
// donc on évite cette dep. Le repo rsms/inter a changé de structure et les
// URLs `docs/font-files/*` renvoient 404 → option instable, écartée.
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

// Fetch optionnel d'un logo perso pour un slug donné (asset local
// public/projects/<slug>-logo.png). Renvoie null si absent — le rendu retombe
// alors sur l'icône Lucide en filigrane (rendu typographique pur).
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

// Rend les paths Lucide en JSX <svg>. Les paths sont extraits dans
// lib/lucide-paths.ts, cohérent avec la signature brief.
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

// Rendu cover minimaliste 404 — on renvoie une image plutôt qu'un HTTP 404
// pour que crawlers/bots ne voient pas une cascade d'erreurs si le slug est
// mal configuré (consigne utilisateur). Tout en JB Mono pour garder un seul
// fetch de font en cas d'erreur.
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
        // 404 cache court pour qu'une correction de slug soit visible rapidement.
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

  // Load fonts en parallèle — pas d'await bloquant intermédiaire.
  // Logo perso chargé seulement si le slug est dans SLUGS_WITH_LOGO, sinon
  // ignoré (un fetch raté ne casse pas le rendu, mais inutile de payer le
  // round-trip pour les projets sans logo perso).
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

  const { accent, icon, title, status } = project;
  // Si le PNG est absent (pas encore committé / 404), fallback silencieux
  // sur le rendu typographique avec icône Lucide en filigrane.
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
        {/* Icône filigrane bottom-right — sert de texture visuelle, pas d'info.
            Translate partiel hors cadre pour un effet de "débord" discret.
            Supprimée quand un logo perso est chargé (sinon doublon visuel
            logo + icône Lucide). */}
        {!isWithLogo && (
          <div
            style={{
              position: 'absolute',
              right: -40,
              bottom: -60,
              display: 'flex',
              opacity: 1,
              color: 'rgba(255,255,255,0.15)',
            }}
          >
            {renderLucideIcon(icon, 520, 'rgba(255,255,255,0.15)')}
          </div>
        )}

        {/* Logo perso (Supify, Nutriscan, …) — uniquement quand le PNG est dispo.
            400×400, padding-left 96, top:300 (centre vertical = 500). */}
        {isWithLogo && (
          <div
            style={{
              position: 'absolute',
              left: 96,
              top: 300,
              width: 400,
              height: 400,
              display: 'flex',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo as string}
              width={400}
              height={400}
              alt=""
            />
          </div>
        )}

        {/* Badge statut top-right */}
        <div
          style={{
            position: 'absolute',
            top: 56,
            right: 96,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: 'JetBrainsMono',
            fontSize: 16,
            letterSpacing: 2,
            color: STATUS_COLOR[status],
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: STATUS_COLOR[status],
            }}
          />
          {STATUS_LABEL_FR[status]}
        </div>

        {/* Titre top-left — Clash Display Bold 160px, tracking serré.
            Pour les covers avec logo : on shifte à left = 96 + 400 + 64 = 560
            pour ne pas overlap le logo, et on aligne verticalement le bloc
            (titre 160 + gap 28 + tagline ~36 ≈ 224) sur le centre du logo
            (Y=500) → top ≈ 390. Pour les covers sans logo : top:96 conservé,
            ancrage haut comme les 4 autres covers. */}
        <div
          style={{
            position: 'absolute',
            top: isWithLogo ? 390 : 96,
            left: isWithLogo ? 560 : 96,
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            maxWidth: COVER_W - (isWithLogo ? 656 : 192),
          }}
        >
          <div
            style={{
              fontFamily: 'ClashDisplay',
              fontWeight: 700,
              // Fit-to-line : 160px par défaut, 128px au-delà de 12 chars.
              // Satori gère mal le flex-column gap après un titre multi-lignes
              // (la tagline passe sous la 2e ligne et chevauche), donc on
              // force un rendu monoligne en scalant le font-size.
              fontSize: title.length > 12 ? 128 : 160,
              lineHeight: 0.95,
              letterSpacing: -3,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: 'JetBrainsMono',
              fontSize: 28,
              lineHeight: 1.4,
              color: 'rgba(255,255,255,0.75)',
              maxWidth: 1000,
            }}
          >
            {/* Tagline figée ici pour éviter un round-trip i18n en Edge.
                On prend la version FR du brief §7 — l'OG / cover reste
                dans la langue de dépôt, cohérent Vercel/Linear. */}
            {TAGLINES_FR[slug] ?? ''}
          </div>
        </div>

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

// Taglines figées au cover generator. Sources = brief §7 (FR officielles).
// On ne passe PAS par next-intl côté Edge pour deux raisons :
//  1. Pas de dépendance i18n runtime sur une route asset (simplicité + perf)
//  2. Une OG/cover reste conventionnellement dans la langue du domaine
const TAGLINES_FR: Record<string, string> = {
  supify: 'Réseau social dédié à la musique, avec mini-jeux intégrés.',
  libreo: 'Application web de découverte littéraire au design éditorial & luxe.',
  'lsv-prono': "Application web de suivi d'évolution pour les paris sportifs.",
  'photographer-site': 'Site galerie pour un photographe.',
  mkagain777: 'Site e-commerce pour un beatmaker.',
  nutriscan:
    'Application mobile : photographie ton plat, obtiens toutes les infos nutritionnelles pour suivre ton régime.',
};
