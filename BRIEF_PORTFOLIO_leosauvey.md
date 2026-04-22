# Brief complet — Portfolio `leosauvey.fr`

**Document destiné à Claude Code.** Ce fichier est le seul brief à lire. Il contient toutes les décisions, tokens de design, structure, specs techniques, plan de dev et prompt d'ouverture. Suivre ce document à la lettre sauf contre-ordre explicite du propriétaire (Léo).

---

## 1. Contexte

- **Propriétaire** : Léo Sauvey, 21 ans, étudiant ingénieur 3e année à Supinfo (diplôme RNCP38114, 2028), basé Caen / Cherbourg, ouvert au remote.
- **Objectif du site** : portfolio freelance pour capter missions dev (sites, apps, logiciels sur mesure) et alimenter recherche alternance / stage.
- **Domaine** : `leosauvey.fr`
- **Email de contact** : `sauveyleo@gmail.com`
- **GitHub** : <https://github.com/10lsv>
- **LinkedIn** : <https://www.linkedin.com/in/léo-sauvey/>

**Positionnement** : développeur freelance polyvalent, pointilleux, compréhensif, investi. Capable de livrer des outils web / mobile / logiciels pour améliorer le quotidien ou le business d'un client.

**Tagline locked** (FR) :
> Développeur freelance. Je conçois et livre des sites, apps et outils sur mesure.

**Tagline locked** (EN) :
> Freelance developer. I design and deliver tailored websites, apps and software.

---

## 2. Direction artistique (verrouillée)

DA = fusion de trois références :

| Référence | Ce qu'on en prend |
|---|---|
| **Apple** | Storytelling hero produit, whitespace généreux, scroll-triggered reveals sobres mais léchés, typo display XXL |
| **Linear / Vercel** | Rythme UI, micro-interactions précises, dark mode premium, palette restreinte |
| **Robin Noguier** | Galerie projets 3D explorable (desktop), shared-element morph transitions |

**Ambiance** : épuré / luxe / froid, avec identité typographique marquée pour éviter le Linear-clone tiède.

**Mots-clés DA** : sobre, premium, tranchant, spacieux, rouge profond, noir profond, technique sans agressivité.

---

## 3. Design System (tokens verrouillés)

### 3.1 Palette

**Dark mode (défaut)**
```
--bg-0         #0A0A0A   // background page
--bg-1         #141414   // surfaces élevées (cards, modals)
--bg-2         #1F1F1F   // surfaces hover
--border       #262626   // bordures discrètes
--border-hi    #3A3A3A   // bordures accent
--text-0       #F5F5F5   // texte principal
--text-1       #A3A3A3   // texte secondaire
--text-2       #6B6B6B   // texte tertiaire, désactivé
--accent       #8B0000   // bordeaux signature
--accent-hi    #B30000   // accent hover / focus
--accent-glow  rgba(139,0,0,0.35) // halos, glows subtils
```

**Light mode**
```
--bg-0         #FAFAFA
--bg-1         #FFFFFF
--bg-2         #F5F5F5
--border       #E5E5E5
--border-hi    #CCCCCC
--text-0       #0A0A0A
--text-1       #525252
--text-2       #8A8A8A
--accent       #8B0000
--accent-hi    #6B0000
--accent-glow  rgba(139,0,0,0.15)
```

**Règles d'usage du rouge**
- Jamais comme couleur de fond large
- Réservé aux accents : CTA, chiffres de section (01/02/03), underline de liens actifs, halo 3D, glow sur hover
- 1 à 2 occurrences par viewport max

### 3.2 Typographie

**Display** : **Clash Display** (Fontshare, gratuit) — alternative crédible à Neue Machina, vibe techno/tranchante identique.
*Upgrade optionnel* : PP Neue Machina (Pangram Pangram, payant) si Léo veut payer la licence plus tard. Le code prévoit une variable CSS facile à swap.

**Body / UI** : **Inter** (Google Fonts, variable font)

**Mono (accents)** : **JetBrains Mono** (Google Fonts) — pour labels techniques, numéros, codes de section

**Échelle typographique**
```
display-xl    : 112px / line 1.0 / weight 600  // hero mobile 56px
display-l     : 80px  / line 1.05 / weight 600  // titres sections mobile 48px
display-m     : 56px  / line 1.1 / weight 600
h1            : 40px  / line 1.15 / weight 600
h2            : 32px  / line 1.2 / weight 600
h3            : 24px  / line 1.3 / weight 500
body-l        : 18px  / line 1.6 / weight 400
body          : 16px  / line 1.6 / weight 400
body-s        : 14px  / line 1.5 / weight 400
caption       : 12px  / line 1.4 / weight 500 / letter-spacing 0.05em / uppercase
mono          : 14px  / line 1.4 / weight 400 (JetBrains Mono)
```

**Règle** : Clash Display **uniquement** pour les tailles ≥ 40px. Inter pour tout le reste.

### 3.3 Spacing (base 4px — cohérent Tailwind)

```
4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256
```

**Sections verticales** : 128px desktop / 64px mobile entre sections.
**Padding container** : 64px desktop / 24px mobile.
**Max-width container** : 1440px avec marges fluides.

### 3.4 Grid

- Desktop : 12 colonnes, gutter 24px
- Tablet : 8 colonnes, gutter 16px
- Mobile : 4 colonnes, gutter 16px

### 3.5 Tokens d'animation

```
--ease-out-smooth  : cubic-bezier(0.22, 1, 0.36, 1)  // défaut reveals
--ease-in-out      : cubic-bezier(0.65, 0, 0.35, 1)  // défaut transitions
--ease-expo-out    : cubic-bezier(0.16, 1, 0.3, 1)   // hero, big reveals

--dur-fast   : 200ms  // hover, boutons
--dur-normal : 400ms  // UI standard
--dur-slow   : 800ms  // reveals scroll
--dur-xl     : 1200ms // hero, loader exit
```

**Règle globale** : toute animation respecte `prefers-reduced-motion`. Dans ce cas, durées divisées par 3 et transforms remplacés par fades simples.

### 3.6 Border radius

```
sm  : 4px    // inputs
md  : 8px    // buttons
lg  : 16px   // cards
xl  : 24px   // modals, hero elements
full: 9999px // pills, avatars
```

---

## 4. Stack technique (locked)

```
Framework      : Next.js 15 (App Router) + TypeScript strict
Style          : Tailwind CSS 4 + CSS variables pour tokens
Fonts          : next/font (Clash Display via @fontsource, Inter + JetBrains Mono via next/font/google)
Thème          : next-themes (dark/light toggle)
i18n           : next-intl (FR défaut, EN toggle)
Smooth scroll  : Lenis (@studio-freight/lenis)
Anims scroll   : GSAP 3 + ScrollTrigger + Flip plugin
Anims UI       : Framer Motion (layoutId, AnimatePresence)
3D             : @react-three/fiber + @react-three/drei
Shaders        : GLSL inline (scène 3D) + hover-effect lib pour images 2D
Icons          : Lucide React
Analytics      : Vercel Analytics (gratuit sur déploiement Vercel)
Déploiement    : Vercel
Linter         : ESLint + Prettier + typescript-eslint strict
```

**Packages à installer :**

```bash
pnpm add next@15 react@19 react-dom@19 typescript
pnpm add -D @types/node @types/react @types/react-dom
pnpm add tailwindcss@4 @tailwindcss/postcss
pnpm add next-themes next-intl
pnpm add gsap @studio-freight/lenis
pnpm add framer-motion
pnpm add three @react-three/fiber @react-three/drei
pnpm add @fontsource-variable/inter @fontsource-variable/jetbrains-mono
pnpm add lucide-react clsx tailwind-merge
pnpm add -D @types/three
```

**pnpm obligatoire** (pas npm / yarn) : plus rapide, moins de bloat.

---

## 5. Structure du projet

```
leosauvey/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx
│   │   ├── page.tsx              // one-pager principal
│   │   └── not-found.tsx         // 404 stylé
│   ├── api/
│   │   └── og/route.tsx          // OG image dynamique
│   ├── globals.css
│   ├── manifest.ts
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── layout/
│   │   ├── Header.tsx            // logo + toggles + burger
│   │   ├── BurgerMenu.tsx        // overlay fullscreen
│   │   ├── ThemeToggle.tsx
│   │   └── LocaleToggle.tsx
│   ├── sections/
│   │   ├── Loader.tsx
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── TechStack.tsx
│   │   ├── Gallery.tsx           // switch desktop/mobile via viewport
│   │   ├── GalleryDesktop3D.tsx  // scène R3F
│   │   ├── GalleryMobile.tsx     // galerie 2D
│   │   ├── Contact.tsx
│   │   └── Footer.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectModal.tsx
│   │   └── ProjectCard3D.tsx     // card dans scène R3F
│   ├── three/
│   │   ├── Scene.tsx             // Canvas + Suspense
│   │   ├── CameraRig.tsx         // scroll-driven camera
│   │   ├── Lights.tsx
│   │   └── shaders/
│   │       └── hoverGlow.glsl
│   └── ui/
│       ├── Button.tsx
│       ├── CopyEmailButton.tsx
│       ├── ScrollIndicator.tsx
│       └── MagneticLink.tsx
├── content/
│   └── projects.ts               // data projets (source de vérité)
├── lib/
│   ├── animations.ts             // wrappers GSAP
│   ├── useLenis.ts
│   ├── useReducedMotion.ts
│   └── cn.ts                     // utility Tailwind merge
├── messages/
│   ├── fr.json
│   └── en.json
├── public/
│   ├── projects/                 // screenshots projets (à fournir par Léo)
│   ├── fonts/
│   │   └── ClashDisplay-Variable.woff2
│   ├── favicon/
│   └── og-default.png
├── i18n.ts
├── middleware.ts                 // next-intl routing
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
├── package.json
└── README.md
```

---

## 6. Spécification section par section

### 6.1 Loader (intro)

- **Déclenchement** : au premier chargement seulement (sessionStorage flag pour skip aux navigations internes)
- **Durée** : 1500ms total, skippable au clic n'importe où sur l'écran
- **Contenu** :
  - Fond `--bg-0`
  - Au centre : `LÉO SAUVEY` en Clash Display taille display-l, couleur `--text-0`
  - Underline animé en rouge `--accent` qui se trace de gauche à droite sous le nom (800ms, ease-out-smooth)
  - Compteur `00 → 100` en JetBrains Mono en bas à gauche
- **Sortie** : le nom slide vers le haut et devient le logo du header, le fond devient transparent, le hero apparaît en fade + léger translate-up

### 6.2 Header (persistant)

- **Position** : fixed top, z-index 50
- **Hauteur** : 72px desktop, 56px mobile
- **Fond** : transparent par défaut, `backdrop-filter: blur(16px)` + `bg-[--bg-0]/70` quand scrolled (> 40px)
- **Contenu gauche** : logo `LSV` en Clash Display 20px, rouge `--accent`
- **Contenu droite** :
  - `FR / EN` toggle en mono 14px (l'actif en `--text-0`, l'inactif en `--text-2`)
  - Theme toggle (icône soleil/lune, taille 20px, transition 400ms)
  - Burger icon (3 traits, animation en croix au open)
- **Animation au scroll** : le header se rétracte légèrement (padding réduit) passé 100px

### 6.3 Burger menu (overlay fullscreen)

- **Ouverture** : slide depuis la droite (clip-path circle expand depuis le coin top-right), 600ms ease-expo-out
- **Fond** : `--bg-0`
- **Contenu** : liens en Clash Display 80px desktop / 48px mobile, espacement 24px
  - Accueil / Home
  - Projets / Projects
  - À propos / About
  - Contact / Contact
- **Comportement** : clic sur un lien → fermeture + smooth scroll vers la section (Lenis)
- **Hover** : le lien se décale de 24px vers la droite + barre rouge apparaît à gauche (animation 200ms)
- **Close** : clic sur burger (qui est en croix) ou touche Escape

### 6.4 Hero

- **Hauteur** : 100vh
- **Layout** : vertical center
- **Contenu principal** :
  - Eyebrow (caption, JetBrains Mono) : `// PORTFOLIO 2026` en rouge
  - Titre H1 : `LÉO SAUVEY` en Clash Display display-xl (112px desktop, 56px mobile)
  - Sous-titre (body-l) : la tagline locked
  - Stats row en bas en mono : `01 / 3E ANNÉE SUPINFO` — `02 / CAEN & CHERBOURG` — `03 / REMOTE FRIENDLY`
- **Background** : subtle shader GLSL fullscreen — noise animé très lent avec touche rouge radiale depuis le coin bas-droit (opacity max 0.15). Doit rester très discret, pas Lusion, plutôt Vercel. Désactivé si `prefers-reduced-motion`.
- **Animation d'entrée** (après loader) :
  - Eyebrow fade + slide-up, delay 0ms
  - H1 reveal par mot (GSAP SplitText ou alternative native) : chaque mot slide-up depuis y=100%, stagger 80ms, delay 100ms
  - Sous-titre fade + translate-up, delay 600ms
  - Stats row fade stagger, delay 900ms
- **Scroll indicator** : en bas, mini flèche qui bounce verticalement (2s loop infini). Disparaît au premier scroll.

### 6.5 Section "À propos" (About)

- **Ancre** : `#about`
- **Numéro de section** : `01` en rouge, Clash Display 24px, position top-left avec ligne verticale rouge qui descend
- **Layout** : 2 colonnes desktop (5/7), stack mobile
- **Colonne gauche** : H2 `À propos` + caption mono `// À propos`
- **Colonne droite** : 2-3 paragraphes en body-l, ton factuel professionnel :
  - Paragraphe 1 : qui il est (nom, âge, école, localisation, posture remote)
  - Paragraphe 2 : ce qu'il fait / propose (sites, apps, logiciels sur mesure)
  - Paragraphe 3 : ses qualités (pointilleux, compréhensif, investi) + mention sport/bon vivant pour l'humaniser
- **Reveal** : en scroll, chaque paragraphe apparaît en fade + translate-up 32px, stagger 120ms, trigger 20% visible

### 6.6 Section "Stack"

- **Ancre** : `#stack`
- **Numéro de section** : `02` (même pattern que About)
- **Layout** :
  - Titre H2 `Stack principale` + caption mono
  - Sous-titre courte phrase : *"Les technos que j'utilise au quotidien. Je touche à d'autres, mais celles-là je les maîtrise."*
  - Grille 2 colonnes desktop / 1 colonne mobile, catégorisée :

```
FRONT          BACK & OUTILS
React          Node.js
Next.js        Python
TypeScript     PostgreSQL
Tailwind CSS   Git / Docker / Figma
```

- **Style** : chaque item en Clash Display 32px desktop / 24px mobile, en `--text-0`
- **Hover desktop** : underline rouge qui se trace de gauche à droite en 300ms
- **Headers de catégorie** en caption mono rouge

### 6.7 Galerie projets (section principale)

- **Ancre** : `#projects`
- **Numéro de section** : `03`
- **Titre** : H2 `Projets sélectionnés`
- **Deux modes basés sur viewport** :

#### 6.7.1 Desktop (≥ 1024px) — Scène 3D R3F

- **Concept** : scène minimaliste, fond `--bg-0`, 5 cards "flottantes" dans l'espace 3D représentant les projets
- **Layout 3D** : cards disposées en spirale descendante légère sur l'axe Z (scroll = avance caméra sur Z)
- **Card 3D** :
  - Plane 3:4 ou 16:9 selon le visuel
  - Texture = screenshot du projet
  - Bord émissif subtil en rouge `--accent` (opacité 0.3)
  - Flotte avec un sin(time) léger sur Y (amplitude 5px, lent)
- **Caméra** : scroll-driven via ScrollTrigger + useFrame, lerp vers position cible
- **Éclairage** : ambient 0.3 + 1 directional froid top-left + 1 point light rouge en back pour halo signature
- **Interaction hover** : la card survolée s'avance vers la caméra (z +0.5), glow rouge s'intensifie, curseur devient pointer
- **Interaction click** : ouvre `ProjectModal` en overlay 2D classique (morph de la texture 3D vers l'image 2D du modal via Framer Motion layoutId pas nécessaire — plutôt crossfade + scale du modal depuis la position projetée de la card sur l'écran)
- **Perf** : `dpr={[1, 1.5]}`, `frameloop="demand"` réactivé sur scroll, Suspense avec fallback = version 2D tant que le canvas pas ready
- **Fallback WebGL** : si pas de support ou `prefers-reduced-motion`, affiche la version mobile/2D

#### 6.7.2 Mobile + tablet (< 1024px) — Galerie 2D

- **Layout** : liste verticale de cards pleine largeur, gap 32px
- **Card** :
  - Image screenshot en haut (ratio 16:9), border-radius lg
  - Overlay noir 30% au repos, disparaît au tap
  - Texte en dessous : numéro + nom projet en Clash Display 32px, stack en mono 12px, statut (badge "EN COURS" rouge si WIP)
- **Effet au scroll** : displacement shader léger via hover-effect lib OU simple parallax translate-y sur l'image
- **Tap** : ouvre modal projet

#### 6.7.3 Modal projet (commun aux 2 modes)

- **Trigger** : click sur une card
- **Animation ouverture** : scale depuis position card + fade background blur 16px, 500ms ease-expo-out
- **Fond** : `--bg-1` + blur du fond
- **Contenu** :
  - Top bar : numéro projet + statut (WIP ou DÉPLOYÉ ou OFFLINE) + close (Escape également)
  - Hero image (ou carousel d'images si plusieurs)
  - Titre projet Clash Display 56px
  - Description courte body-l
  - Stack : chips en mono 12px, `--bg-2` background
  - Liens : GitHub (icône Lucide + label) + Live URL si dispo
  - Description longue body optionnelle (si fournie dans `content/projects.ts`)
- **Close** : bouton, Escape, clic en dehors

### 6.8 Contact

- **Ancre** : `#contact`
- **Numéro de section** : `04`
- **Layout** : centered, full viewport height
- **Contenu** :
  - Caption mono rouge `// CONTACT`
  - H2 *"On travaille ensemble ?"*
  - Sous-titre body-l : *"Un projet, une idée, une question. L'email, c'est le plus simple."*
  - Gros bouton CTA primary : `sauveyleo@gmail.com` en Clash Display 40px desktop / 24px mobile
    - Click → `mailto:sauveyleo@gmail.com?subject=Projet%20—%20via%20leosauvey.fr`
    - Hover : underline rouge animé + le texte devient rouge
  - Bouton secondaire : `Copier l'email`
    - Click → copie dans clipboard + toast "Copié ✓" (rouge accent) qui fade après 2s
    - Icône Lucide `Copy` qui devient `Check` pendant 2s
  - Ligne sociale en dessous : icônes GitHub + LinkedIn, size 24px, hover rouge

### 6.9 Footer

- **Hauteur** : compacte, 96px
- **Contenu** : `© 2026 Léo Sauvey — Tous droits réservés.` en mono 12px, centré
- **Mini-mention droite** : `Conçu et développé avec soin.`
- Pas de lien, pas de menu, volontairement sobre

### 6.10 Page 404 (stylée, obligatoire)

- **Fullscreen**, fond `--bg-0`
- **Contenu centré** :
  - Gros `404` en Clash Display 240px desktop / 120px mobile, fill gradient du `--text-0` au `--accent`
  - Tagline FR : *"Cette page s'est perdue dans le code. Retour au début ?"*
  - Tagline EN : *"This page got lost in the code. Back to start?"*
  - Bouton CTA → retour accueil
- **Background** : petit shader discret identique au hero, mais avec glitch effect léger toutes les 4s (distortion 200ms)
- **Easter-egg rejeté par le brief**, donc pas d'interaction cachée

---

## 7. Data projets (source de vérité)

Fichier `content/projects.ts` :

```typescript
export type ProjectStatus = 'live' | 'wip' | 'offline';

export interface Project {
  slug: string;
  name: string;
  status: ProjectStatus;
  year: number;
  tagline: { fr: string; en: string };
  description: { fr: string; en: string };
  stack: string[];
  cover: string;          // chemin public/projects/
  images?: string[];      // screenshots additionnels
  links: {
    live?: string;
    github?: string;
  };
  featured?: boolean;     // true = hero du projet phare
}

export const projects: Project[] = [
  {
    slug: 'supify',
    name: 'Supify',
    status: 'wip',
    year: 2026,
    featured: true,
    tagline: {
      fr: 'Réseau social dédié à la musique, avec mini-jeux intégrés.',
      en: 'Music-focused social network with integrated mini-games.'
    },
    description: {
      fr: 'Supify est un réseau social centré sur la musique. Les utilisateurs partagent leurs découvertes, interagissent autour de morceaux, et accèdent à des mini-jeux musicaux en temps réel. Projet phare actuellement en développement.',
      en: 'Supify is a music-centric social network. Users share discoveries, engage around tracks, and play integrated real-time music mini-games. Main ongoing project.'
    },
    stack: ['Next.js', 'TypeScript', 'React', 'TailwindCSS'],
    cover: '/projects/supify-cover.png',
    links: {
      live: 'https://supify.fr',
      github: 'https://github.com/10lsv'  // à compléter si repo public
    }
  },
  {
    slug: 'libreo',
    name: 'Libreo',
    status: 'live', // à valider avec Léo si déployé
    year: 2025,
    tagline: {
      fr: 'Application web de découverte littéraire au design éditorial & luxe.',
      en: 'Literary discovery web app with an editorial, premium design.'
    },
    description: {
      fr: 'Libreo aide à explorer et découvrir des livres via une interface soignée, inspirée des magazines littéraires haut de gamme. Navigation typographique, mise en scène éditoriale.',
      en: 'Libreo helps users explore and discover books through a polished, premium-magazine-inspired interface. Typography-driven navigation, editorial layout.'
    },
    stack: ['TypeScript', 'React', 'Next.js', 'Tailwind'],
    cover: '/projects/libreo-cover.png',
    links: {
      github: 'https://github.com/10lsv/LIBREO'
    }
  },
  {
    slug: 'lsv-prono',
    name: 'LSV Prono',
    status: 'live', // à valider
    year: 2025,
    tagline: {
      fr: 'Application web de suivi d\'évolution pour les paris sportifs.',
      en: 'Web app to track your betting evolution and performance.'
    },
    description: {
      fr: 'LSV Prono permet de journaliser ses paris sportifs, visualiser son évolution dans le temps et analyser ses performances avec des graphiques dédiés.',
      en: 'LSV Prono logs your sports bets, visualizes your evolution over time, and analyzes performance through dedicated charts.'
    },
    stack: ['TypeScript', 'React', 'Next.js'],
    cover: '/projects/lsv-prono-cover.png',
    links: {
      github: 'https://github.com/10lsv/LSV-PRONO'
    }
  },
  {
    slug: 'photographer-site',
    name: 'Photographer Site',
    status: 'live',
    year: 2025,
    tagline: {
      fr: 'Site galerie pour un photographe.',
      en: 'Gallery website for a photographer.'
    },
    description: {
      fr: 'Site vitrine avec galerie photo soignée et navigation fluide, conçu pour mettre en valeur le travail d\'un photographe.',
      en: 'Showcase website with polished photo gallery and smooth navigation, designed to highlight a photographer\'s work.'
    },
    stack: ['TypeScript', 'React', 'Next.js', 'Tailwind'],
    cover: '/projects/photographer-cover.png',
    links: {
      live: 'https://v0-photographe-website-three.vercel.app',
      github: 'https://github.com/10lsv/PHOTOGRAPHER-SITE'
    }
  },
  {
    slug: 'mkagain777',
    name: 'MKAgain777',
    status: 'wip',
    year: 2026,
    tagline: {
      fr: 'Site e-commerce pour un beatmaker vendant ses productions aux rappeurs.',
      en: 'E-commerce site for a beatmaker selling productions to rappers.'
    },
    description: {
      fr: 'Plateforme permettant à un beatmaker de vendre ses instrumentales : catalogue, licences, paiements, gestion de commande. Projet en cours de développement.',
      en: 'Platform enabling a beatmaker to sell instrumentals: catalog, licensing, payments, order management. Work in progress.'
    },
    stack: ['Next.js', 'TypeScript', 'React', 'Tailwind'],
    cover: '/projects/mkagain777-cover.png',
    links: {
      github: 'https://github.com/10lsv'  // à compléter
    }
  }
];
```

**À charge de Léo** :
- Fournir les 5 images `/projects/*.png` (screenshots représentatifs, 1600x1000 recommandé)
- Valider les `status` (live / wip / offline) de LSV-PRONO et LIBREO
- Compléter les URLs GitHub exactes de chaque repo

---

## 8. Internationalisation (FR/EN)

- **Routing** : `/fr/...` et `/en/...` via `next-intl` middleware
- **Défaut** : FR
- **Détection** : désactivée — on force FR par défaut pour éviter les surprises sur leosauvey.fr
- **Toggle** : stocke le choix en cookie `NEXT_LOCALE`
- **Fichiers de traduction** : `messages/fr.json` et `messages/en.json`, structurés par section :

```json
{
  "hero": { "eyebrow": "...", "title": "...", "tagline": "..." },
  "about": { "title": "...", "p1": "...", "p2": "...", "p3": "..." },
  "stack": { "title": "...", "subtitle": "...", "front": "...", "back": "..." },
  "projects": { "title": "...", "statusLive": "En ligne", "statusWip": "En cours", ... },
  "contact": { "title": "...", "cta": "...", "copy": "Copier l'email", "copied": "Copié ✓" },
  "nav": { "home": "Accueil", "projects": "Projets", "about": "À propos", "contact": "Contact" },
  "404": { "title": "...", "cta": "Retour à l'accueil" }
}
```

---

## 9. SEO et métadonnées

### 9.1 `<head>` global

- `<title>` : `Léo Sauvey — Développeur Freelance | Sites, Apps, Logiciels sur mesure`
- `<meta description>` : `Développeur freelance basé à Caen. Je conçois et livre des sites, applications et logiciels sur mesure. Disponible en remote.`
- `<meta keywords>` : *(optionnel, peu impactant)*
- Open Graph : titre, description, type website, image 1200x630, url
- Twitter card : summary_large_image
- `<html lang>` : dynamique selon locale
- Favicon : set complet (16, 32, 180 apple-touch, 192 android, 512 android)

### 9.2 OG image dynamique

Route `/api/og` via `next/og` ImageResponse :
- Fond `--bg-0`
- Nom `LÉO SAUVEY` en Clash Display XXL
- Tagline en Inter
- Accent rouge bordeaux

### 9.3 Structured data (JSON-LD)

Embed dans `<head>` un schema `Person` :

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Léo Sauvey",
  "jobTitle": "Freelance Developer",
  "url": "https://leosauvey.fr",
  "sameAs": [
    "https://github.com/10lsv",
    "https://www.linkedin.com/in/léo-sauvey/"
  ],
  "alumniOf": { "@type": "EducationalOrganization", "name": "Supinfo" },
  "address": { "@type": "PostalAddress", "addressLocality": "Caen", "addressCountry": "FR" }
}
```

### 9.4 Sitemap + robots

- `app/sitemap.ts` : génère sitemap avec pages /fr et /en
- `app/robots.ts` : allow all, sitemap reference

### 9.5 Mots-clés ciblés

Trouvable pour : `Léo Sauvey`, `développeur freelance Caen`, `développeur Next.js France`, `développeur web Cherbourg`, `portfolio Léo Sauvey`.

---

## 10. Performance et accessibilité

### 10.1 Budgets perf

| Métrique | Cible desktop | Cible mobile |
|---|---|---|
| Lighthouse Performance | ≥ 85 | ≥ 70 |
| LCP | < 2.0s | < 2.5s |
| CLS | < 0.05 | < 0.1 |
| FID / INP | < 100ms | < 200ms |
| Total JS transferred | < 300 KB | < 200 KB (hors 3D) |

**Règles** :
- Scène 3D chargée en lazy via dynamic import, seulement si viewport ≥ 1024px
- Images : next/image systématique, formats AVIF puis WebP, sizes définis
- Fonts : `display: swap`, subsetting Latin
- Pas de libraires non-tree-shakeable importées entièrement

### 10.2 Accessibilité (non-négo)

- Contraste WCAG AA minimum partout
- Nav clavier complète : focus visible custom (ring rouge 2px), tab order logique
- Skip-to-content link en haut
- `aria-label` sur tous les boutons icon-only
- `prefers-reduced-motion` : désactive GSAP ScrollTrigger lourd, désactive WebGL background, simplifie transitions
- Lang attribute correct par locale
- Alt text sur toutes les images (fourni dans data projet)
- Modals : focus trap + Escape + `aria-modal`

---

## 11. Analytics et domaine

- **Analytics** : Vercel Analytics activé dans le dashboard Vercel (zéro config code) + Vercel Speed Insights
- **Plausible en alternative** si Léo préfère privacy-first strict — à installer via `<Script>` dans le root layout
- **Domaine** : `leosauvey.fr` configuré sur Vercel + redirection `www.leosauvey.fr` → `leosauvey.fr`
- **Email pro** (optionnel, plus tard) : possibilité de configurer `contact@leosauvey.fr` via OVH ou Zoho Mail. Pour le MVP, on reste sur `sauveyleo@gmail.com`.

---

## 12. Plan de développement (6 sprints)

### Sprint 1 — Fondations (semaine 1)
- Init Next.js 15 + TypeScript strict + Tailwind 4 + ESLint/Prettier
- Installation tout le stack packages
- Mise en place des design tokens (CSS variables dans `globals.css`)
- Polices : Clash Display + Inter + JetBrains Mono
- `next-themes` (dark défaut) + ThemeToggle
- `next-intl` FR/EN + LocaleToggle + middleware
- Header fixed + structure layout + BurgerMenu (animation d'ouverture)
- Hero section statique (sans shader)
- Smooth scroll Lenis + hook `useLenis`

**Livrable** : structure navigable, toggles fonctionnels, hero visible.

### Sprint 2 — Sections statiques (semaine 2)
- About section (contenu + reveal GSAP ScrollTrigger)
- TechStack section
- Contact section + CopyEmailButton (avec toast)
- Footer
- Messages FR + EN complets pour toutes ces sections
- Responsive mobile/tablet

**Livrable** : site complet navigable sauf galerie projets.

### Sprint 3 — Galerie projets 2D + modals (semaine 3)
- `content/projects.ts` peuplé
- GalleryMobile component
- ProjectModal avec animations ouverture/fermeture
- Focus trap + Escape
- Images projets intégrées (placeholders si Léo pas encore fourni)

**Livrable** : galerie fonctionnelle mobile, site 100% utilisable sans desktop 3D.

### Sprint 4 — Scène 3D desktop (semaine 4)
- Setup R3F + Scene + CameraRig
- ProjectCard3D avec texture dynamique
- Éclairage + shader halo rouge
- Interactions hover + click
- Scroll-driven camera (ScrollTrigger + useFrame)
- Fallback gracieux si pas de WebGL ou `prefers-reduced-motion`

**Livrable** : galerie 3D desktop fonctionnelle, versions desktop et mobile cohérentes.

### Sprint 5 — Polish et finitions (semaine 5)
- Loader d'intro avec animation de sortie
- Page 404 stylée avec glitch shader
- Micro-interactions : magnetic links sur les CTA principaux, underline animés, stagger reveals sur toutes les sections
- Optimisation perf : dynamic imports, bundle analyzer, images AVIF
- Test `prefers-reduced-motion`
- Test navigation clavier complète
- Test mobile réel (iPhone + Android bas de gamme)

**Livrable** : site ready to ship.

### Sprint 6 — SEO + déploiement (semaine 6)
- Métadonnées complètes + OG image dynamique
- JSON-LD Person schema
- Sitemap + robots.txt
- Favicons complets
- Déploiement Vercel + branchement domaine leosauvey.fr
- Vercel Analytics activé
- Audit Lighthouse final + fixes

**Livrable** : site en prod sur leosauvey.fr.

---

## 13. Ce qui reste à la charge de Léo

1. **Acheter le domaine `leosauvey.fr`** (OVH ou équivalent)
2. **Créer un compte Vercel** lié à son GitHub
3. **Fournir les 5 screenshots de projets** (1600x1000 recommandé, PNG) → à mettre dans `/public/projects/`
4. **Valider le statut live/wip/offline** de chaque projet (LSV-PRONO, LIBREO, MKAgain777 notamment)
5. **Compléter les URLs GitHub exactes** de chaque repo dans `content/projects.ts` si certains sont privés ou renommés
6. **Décider d'ajouter une photo de lui plus tard** → le About est conçu pour vivre sans photo, mais si photo ajoutée un jour, emplacement prévu en colonne gauche du About
7. **Valider le contenu About FR/EN** — un premier jet sera proposé par Claude Code, Léo ajuste
8. **Configurer un email pro `contact@leosauvey.fr`** plus tard (optionnel, pas bloquant)

---

## 14. Non-négo / règles absolues

- **Toujours TypeScript strict** (`"strict": true` + `"noUncheckedIndexedAccess": true`)
- **Tous les textes affichés** passent par `next-intl` (jamais de hardcode)
- **Jamais de couleur en dur** dans le JSX → toujours via Tailwind + CSS variables
- **Pas d'installation de lib non listée** dans la stack sans justification écrite en commentaire
- **Chaque composant avec state complexe a un hook custom dans `/lib`**
- **Pas de `any` en TS** sauf commenté avec raison
- **Pas de lib lourde importée pour 2 icônes** — Lucide seulement
- **Pas de Google Fonts imports multiples** — uniquement Inter et JetBrains Mono via `next/font/google`
- **Toute anim lourde (3D, shader) est wrappée dans `useReducedMotion` check**
- **Commit conventionnels** : `feat:`, `fix:`, `chore:`, `refactor:`, `perf:`, `a11y:`

---

## 15. Prompt d'ouverture pour Claude Code

Copier-coller tel quel dans Claude Code après avoir initialisé un dossier `leosauvey` vide :

---

> Tu vas construire mon portfolio `leosauvey.fr`. Tout est spécifié dans le fichier `BRIEF_PORTFOLIO_leosauvey.md` que je te joins. Lis-le intégralement avant d'écrire la moindre ligne de code.
>
> **Contrat de travail :**
> 1. Tu suis le brief à la lettre — structure, tokens, stack, specs, plan de dev par sprints. Pas d'écart sans justification écrite en commentaire ou message.
> 2. On avance **un sprint à la fois**, dans l'ordre défini dans la section 12. Tu ne démarres pas le sprint N+1 avant que je valide le sprint N.
> 3. À la fin de chaque sprint : tu me fais un récap de ce qui est livré, tu listes ce qui reste à faire côté Léo (visuels, validations), et tu proposes les tests à faire.
> 4. TypeScript strict obligatoire. Tailwind + CSS variables pour tout le style. Tous les textes passent par `next-intl`.
> 5. Si un choix technique n'est pas dans le brief, tu me demandes avant de décider.
> 6. Respecte les règles non-négo de la section 14.
>
> **Démarrage :** commence par le Sprint 1 — Fondations. Montre-moi la structure du projet créée, les fichiers de config (tsconfig, tailwind, eslint), les tokens CSS, et le Header + BurgerMenu en markup statique. On validera ensemble avant de passer au Hero.

---

**Fin du brief.**
