'use client';

import gsap from 'gsap';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { useIntro } from '@/lib/IntroContext';
import { useReducedMotion } from '@/lib/useReducedMotion';

const DEBUG_HERO = false;
const log = (...args: unknown[]) => {
  if (DEBUG_HERO && typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[Hero]', ...args);
  }
};

// Hero V3 (épuré) — statement bold outline rouge bordeaux, basé sur la
// bannière LinkedIn de Léo (LSV outline sur noir). Flash néon retiré.
//   - H1 LÉO SAUVEY en Archivo Black, color transparent + stroke 2px
//     --accent (#8B0000) — classes .hero-title-outline + .font-archivo-black
//   - breathe permanent (oscillation letter-spacing 2s) — seule anim sur le H1
//   - sous-titre statement (Inter, --text-2, mask reveal au mount)
//   - HeroBackdrop discret + scroll indicator
//
// Animation d'entrée GSAP gated sur introDone (inchangée du sprint v2) :
//   t=0   : mots H1 yPercent 100 → 0, stagger 0.08, expo.out 1s
//   t=0.4 : statement yPercent 100 → 0 + opacity 0 → 1, expo.out 0.9s
export function Hero() {
  const t = useTranslations('hero');
  const reducedMotion = useReducedMotion();
  const { introDone } = useIntro();
  const rootRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    log('effect run, reducedMotion=', reducedMotion, 'introDone=', introDone);
    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>('[data-hero-word]');
      const statements = gsap.utils.toArray<HTMLElement>(
        '[data-hero-statement]',
      );
      log('found words:', words.length, '| statements:', statements.length);

      if (reducedMotion) {
        log('reduced-motion → snap final');
        gsap.set(words, { yPercent: 0, clearProps: 'transform' });
        gsap.set(statements, {
          yPercent: 0,
          opacity: 1,
          clearProps: 'transform',
        });
        return;
      }

      // État initial appliqué tout de suite (avant introDone) pour éviter
      // un FOUC pendant le Loader.
      gsap.set(words, { yPercent: 100 });
      gsap.set(statements, { yPercent: 100, opacity: 0 });

      if (!introDone) {
        log('intro not done yet → state set, timeline delayed');
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: 'expo.out' },
        onStart: () => log('timeline START'),
        onComplete: () => log('timeline COMPLETE'),
      });

      tl.to(
        '[data-hero-word]',
        {
          yPercent: 0,
          duration: 1,
          stagger: 0.08,
        },
        0,
      );

      tl.to(
        '[data-hero-statement]',
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
        },
        0.4,
      );
    }, rootRef);

    return () => {
      log('cleanup → ctx.revert()');
      ctx.revert();
    };
  }, [reducedMotion, introDone]);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 20) setScrolled(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const titleWords = t('title').split(' ');

  return (
    <section
      ref={rootRef}
      id="home"
      // Sprint mobile v2 :
      //  - 100svh au lieu de 100dvh : svh = "small viewport height", la
      //    valeur quand la barre URL mobile est étendue. Garantit que le
      //    centrage flex se fait dans l'espace effectivement visible
      //    (sinon dvh qui change au scroll créait un offset dynamique).
      //  - pt-20 mobile retiré : le centrage flex naturel place déjà le
      //    H1 (réduit + tagline cachée mobile) bien en-dessous du header
      //    h-14, sans besoin de padding-top compensateur. Le retrait
      //    centre vraiment le contenu dans le viewport (vs offset 80px
      //    qui le poussait visuellement bas).
      // Desktop INCHANGÉ : px-16, pas de pt, justify-center identique.
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-6 text-center md:px-16"
      aria-labelledby="hero-title"
    >
      {/* V6 sprint chirurgical : HeroParticles retiré aussi — fond
          blanc pur uni hérité du body (--bg-0 #FFFFFF). Plus aucune
          micro-anim atmosphérique, vibe "page statique propre". */}

      <div className="relative z-10 mx-auto w-full max-w-(--container-max)">
        <h1
          id="hero-title"
          className={cn(
            // Archivo Black : large geometric heavy sans-serif, vibe
            // statement bold qui matche la bannière LinkedIn de Léo (LSV
            // outline rouge bordeaux sur noir).
            'font-archivo-black font-normal uppercase',
            // leading 1.1 (vs leading-none avant) : laisse respirer les
            // diacritiques au-dessus de la cap-height. Avec leading-none
            // l'accent du É de "LÉO" sortait du line-box et se faisait
            // clipper par overflow:hidden des wrappers per-word.
            'leading-[1.1]',
            // Outline rouge bordeaux : color transparent + -webkit-text-stroke
            // 2px --accent (#8b0000). Mobile rétrograde à 1.5px (cf.
            // globals.css @media max-width 767).
            'hero-title-outline',
            // Sizes mobile v3 : clamp(3.5rem, 14vw, 4.5rem) = 56-72px
            // (vs 64-88 précédent). Sur iPhone 14 Pro 393px : 56px →
            // SAUVEY ≈ 213px → marge >65px de chaque côté (cible >24px
            // largement dépassée). Sur tablets juste avant md (~768px)
            // : 72px. md:text-[120px] lg:text-[160px] INCHANGÉS.
            'text-[clamp(3.5rem,14vw,4.5rem)] md:text-[120px] lg:text-[160px]',
            // Letter-spacing 0 baseline, breathe oscille jusqu'à +0.04em
            // (cf. globals.css).
            'tracking-normal',
            // Animation breathe seule (sprint chirurgical : flash + stroke-
            // react retirés).
            'animate-hero-letter-breathe',
          )}
        >
          {titleWords.map((word, i) => (
            <span
              key={`${word}-${i}`}
              /* overflow-hidden = mask reveal pour le slide GSAP (yPercent
                 100 → 0). pt-[0.15em] donne du headroom au-dessus de la
                 cap-height pour que l'accent du É ne soit pas clipped au
                 top du wrapper. Pas de leading-none ici : on hérite du
                 leading-[1.1] du H1 pour préserver la même room.
                 mr-[0.18em] uniquement entre les mots (skip last) :
                 un trailing margin sur le dernier mot décalerait le
                 strip inline et casserait le centrage text-align: center
                 (LÉO et SAUVEY ne seraient plus équidistants du centre).
                 0.18em (vs 0.12em avant) donne plus d'air entre les mots
                 pour Archivo Black qui est plus large qu'Anton. */
              className={cn(
                // Sprint mobile v2 : block sur mobile force LEO et
                // SAUVEY sur des lignes séparées (vibe statement bold,
                // chaque mot a sa ligne). Desktop garde inline-block →
                // mots côte à côte avec mr-[0.18em] — INCHANGÉ.
                'block overflow-hidden pt-[0.15em] align-bottom md:inline-block',
                i < titleWords.length - 1 && 'mr-[0.18em]',
              )}
            >
              <span
                data-hero-word
                className="inline-block pb-[0.08em] will-change-transform"
              >
                {word}
              </span>
            </span>
          ))}
        </h1>

        {/* Statement éditorial — Inter regular, --text-2, centré sous le H1.
            Spacing inchangé (mt-4 md:mt-6) — cohérent avec le H1 V3 en
            Archivo Black outline. */}
        {/* Tagline cachée mobile (hidden md:block) — sur mobile le hero
            se concentre sur LEO + SAUVEY, plus aéré, focus pur sur le
            statement bold. Desktop INCHANGÉ : tagline visible en
            text-body-l Inter regular. */}
        <div className="mx-auto mt-4 hidden max-w-2xl overflow-hidden md:mt-6 md:block">
          <p
            data-hero-statement
            className="font-sans text-body-l font-normal text-text-2 will-change-transform"
          >
            {t('statement')}
          </p>
        </div>
      </div>

      {/* Scroll indicator V5 Apple : minimal — juste un chevron fin
          discret en gris, pas de label monospace, pas de tracking
          marketing. Bounce conservé (motion-safe gated). Apple = "le
          geste est clair, pas besoin de l'expliciter". */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-10 flex justify-center',
          'text-text-3 transition-opacity duration-(--duration-slow) ease-(--ease-expo-out)',
          scrolled ? 'opacity-0' : 'opacity-100',
        )}
      >
        <ChevronDown
          className="size-5 motion-safe:animate-bounce"
          strokeWidth={1.25}
        />
      </div>
    </section>
  );
}
