import { ScrollTrigger, gsap } from '@/lib/animations';

// DEBUG : passe à true pour tracer dans la console l'exécution des helpers
// (combien d'éléments matchés, quels tweens créés). Off en prod.
const DEBUG = false;

const log = (...args: unknown[]) => {
  if (DEBUG) console.log('[REVEALS]', ...args);
};

// Helpers reveals scroll v2 — patterns appliqués par section selon le type
// d'élément. 3 fonctions :
//  - revealMask  : titres H2 (rise from below behind overflow-hidden mask)
//  - revealWords : paragraphes (split par mot, fade + translate-up stagger)
//  - revealBlock : cards / formulaires (fade + scale 0.96 → 1)
//
// IMPORTANT — scope :
// Tous les helpers acceptent un `root: Element | null` et scopent leur
// querySelectorAll à ce root. Sans ça, deux sections qui partagent les
// mêmes markers `[data-reveal-mask]` produisent des tweens en double sur
// les mêmes éléments (chaque section cible TOUS les markers du document).
//
// Pragma sur revealMask : la spec "ligne par ligne" demanderait un splitter
// DOM (SplitText GSAP est payant). On fait un single-segment mask : si l'H2
// wrap (mobile narrow), tout le bloc rise en bloc. Effet identique sur
// desktop one-liner, dégradé propre sur mobile.
//
// Tous les helpers gate sur `reducedMotion` : fallback fade simple 200ms.

// V5 refonte Minimal Apple : easing Apple ease (0.16, 1, 0.3, 1) — la
// même que --ease-expo-out de globals.css. Démarre lentement, accélère
// au milieu, freine doux à la fin. Vibe Apple.com / Apple Vision Pro.
//
// Durées allongées (1.0s → 1.4s sur masks, 0.7s → 1.2s sur words, 0.9s
// → 1.4s sur blocks) — Apple aime laisser respirer les transitions,
// pas de mouvements rapides.
//
// Approche minimaliste : pas de blur, pas de scale brutal, pas de
// rotationX. Juste opacity + translate doux. Le mouvement vient de
// l'amplitude (yPercent 130, y 24-32) et du timing, pas du nombre
// d'axes animés.
const EASE_APPLE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const REDUCED_FADE_DURATION = 0.2;

type RevealOptions = {
  reducedMotion: boolean;
  /** Sélecteur ou tableau d'éléments à animer. Si string, query scopé à `root`. */
  target: string | Element | Element[];
  /** Root pour scoper le querySelectorAll quand target est un sélecteur. */
  root: Element | null;
  /** Trigger scroll-anchor (défaut adapté au type de reveal). */
  trigger?: Element | null;
  /** start ScrollTrigger override. */
  start?: string;
};

/**
 * Mask reveal vertical pour titres H2.
 * Le wrapper devient `overflow-hidden`, l'inner translate de y=100% vers
 * y=0%. L'effet "le texte rise from below behind a mask".
 * Durée 0.9s, ease expo.out, trigger top 85% (déclenche tôt pour éviter que
 * l'anim joue déjà avant que l'utilisateur voit la section).
 *
 * `immediateRender: true` forcé sur le fromTo : sans ça, GSAP peut différer
 * l'application du FROM state si l'élément est invisible au moment de la
 * création — d'où des cas où le titre apparaît directement à sa position
 * finale (yPercent:0) sans transition visible.
 */
export function revealMask({
  reducedMotion,
  target,
  root,
  trigger,
  start = 'top 85%',
}: RevealOptions) {
  const wrappers = resolveTargets(target, root);
  log(`revealMask: ${wrappers.length} wrapper(s) matched`, wrappers);

  for (const wrapper of wrappers) {
    const inner = wrapper.firstElementChild as HTMLElement | null;
    if (!inner) {
      log('revealMask: wrapper has no firstElementChild, skipped', wrapper);
      continue;
    }

    // Force overflow-hidden au runtime pour clipper l'inner translate.
    (wrapper as HTMLElement).style.overflow = 'hidden';

    if (reducedMotion) {
      gsap.fromTo(
        inner,
        { opacity: 0 },
        {
          opacity: 1,
          duration: REDUCED_FADE_DURATION,
          immediateRender: true,
          scrollTrigger: {
            trigger: trigger ?? wrapper,
            start,
            toggleActions: 'play none none none',
            onEnter: () => log('revealMask onEnter (reduced)', inner),
          },
        },
      );
      continue;
    }

    // V5 Minimal Apple : durée 1.0s → 1.4s, blur retiré (Apple = no
    // motion blur cinéma, juste mouvement net mais lent). yPercent
    // 130 conservé pour préserver le mask reveal sensiblement visible.
    gsap.fromTo(
      inner,
      { yPercent: 130 },
      {
        yPercent: 0,
        duration: 1.4,
        ease: EASE_APPLE,
        immediateRender: true,
        scrollTrigger: {
          trigger: trigger ?? wrapper,
          start,
          toggleActions: 'play none none none',
          onEnter: (st) =>
            log(`revealMask onEnter @ scroll=${Math.round(st.scroll())}`, inner),
        },
      },
    );
  }
}

/**
 * Word-by-word reveal pour paragraphes.
 * Splitte le textContent en mots, wrap chaque mot dans un span
 * inline-block, fade + translate-up y=12px stagger 0.025s/mot.
 *
 * Idempotent via dataset.revealWordsApplied.
 */
export function revealWords({
  reducedMotion,
  target,
  root,
  trigger,
  start = 'top 90%',
}: RevealOptions) {
  const els = resolveTargets(target, root);
  log(`revealWords: ${els.length} element(s) matched`, els);

  for (const el of els) {
    const html = el as HTMLElement;
    if (html.dataset.revealWordsApplied !== 'true') {
      const text = html.textContent ?? '';
      const tokens = text.split(/(\s+)/);
      html.innerHTML = tokens
        .map((tok) =>
          /^\s+$/.test(tok)
            ? tok
            : `<span class="inline-block will-change-transform" data-reveal-word>${escapeHtml(
                tok,
              )}</span>`,
        )
        .join('');
      html.dataset.revealWordsApplied = 'true';
    }

    const words = Array.from(
      html.querySelectorAll<HTMLElement>('[data-reveal-word]'),
    );
    if (words.length === 0) continue;

    if (reducedMotion) {
      gsap.fromTo(
        words,
        { opacity: 0 },
        {
          opacity: 1,
          duration: REDUCED_FADE_DURATION,
          immediateRender: true,
          scrollTrigger: {
            trigger: trigger ?? html,
            start,
            toggleActions: 'play none none none',
            onEnter: () => log('revealWords onEnter (reduced)', html),
          },
        },
      );
      continue;
    }

    // V5 Minimal Apple : durée 0.7s → 1.2s, stagger 0.04 → 0.05 (un
    // chouïa plus aéré). Pas de rotationX/perspective.
    gsap.fromTo(
      words,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: EASE_APPLE,
        stagger: 0.05,
        immediateRender: true,
        scrollTrigger: {
          trigger: trigger ?? html,
          start,
          toggleActions: 'play none none none',
          onEnter: (st) =>
            log(`revealWords onEnter @ scroll=${Math.round(st.scroll())}`, html),
        },
      },
    );
  }
}

/**
 * Block reveal pour cards / formulaires.
 * Fade + scale 0.96 → 1, durée 0.7s, stagger 0.1s, trigger top 70%.
 */
export function revealBlock({
  reducedMotion,
  target,
  root,
  trigger,
  start = 'top 85%',
}: RevealOptions) {
  const els = resolveTargets(target, root);
  log(`revealBlock: ${els.length} block(s) matched`, els);

  if (els.length === 0) return;

  if (reducedMotion) {
    gsap.fromTo(
      els,
      { opacity: 0 },
      {
        opacity: 1,
        duration: REDUCED_FADE_DURATION,
        immediateRender: true,
        scrollTrigger: {
          trigger: trigger ?? els[0],
          start,
          toggleActions: 'play none none none',
          onEnter: () => log('revealBlock onEnter (reduced)', els),
        },
      },
    );
    return;
  }

  // V5 Minimal Apple : durée 0.9s → 1.4s, scale retiré (le scale 0.95
  // ajoutait peu et brouillait le rendu — Apple privilégie translate
  // pur). y 24 → 32 pour amplitude lisible, stagger 0.12 → 0.18 pour
  // séparer clairement les blocks dans le temps.
  gsap.fromTo(
    els,
    { opacity: 0, y: 32 },
    {
      opacity: 1,
      y: 0,
      duration: 1.4,
      ease: EASE_APPLE,
      stagger: 0.18,
      immediateRender: true,
      scrollTrigger: {
        trigger: trigger ?? els[0],
        start,
        toggleActions: 'play none none none',
        onEnter: (st) =>
          log(`revealBlock onEnter @ scroll=${Math.round(st.scroll())}`, els),
      },
    },
  );
}

function resolveTargets(
  target: RevealOptions['target'],
  root: Element | null,
): Element[] {
  if (typeof target === 'string') {
    // Scopage explicite : si root fourni, query inside root. Sinon document
    // (fallback safety, mais signale via log).
    if (!root) {
      log('resolveTargets: no root provided, falling back to document scope');
      return Array.from(document.querySelectorAll(target));
    }
    return Array.from(root.querySelectorAll(target));
  }
  if (Array.isArray(target)) return target;
  return [target];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export { ScrollTrigger };
