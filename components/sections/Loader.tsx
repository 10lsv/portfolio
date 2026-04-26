'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { gsap } from '@/lib/animations';
import { cn } from '@/lib/cn';
import { useIntro } from '@/lib/IntroContext';

// Loader d'intro (brief §6.1). Timeline GSAP :
//  - 0..800ms    : underline rouge se trace G→D + compteur 00→100 en parallèle
//  - 800..1100ms : hold bref, laisse le texte respirer
//  - 1100..1500ms: exit — nom slide+scale+fade vers le coin top-left (= position
//    du logo LSV header), bg fade to transparent
//  - onComplete  : markDone() → Hero démarre son entrée
//
// Skip au clic / Escape / Enter : accélère le timeline (timeScale 2) et seek
// à la phase d'exit. Compressed exit ≈ 400ms vs 800ms normal, pas de coupure
// brutale (exigence utilisateur).
//
// reduced-motion : court-circuit complet, introDone passe true immédiatement
// via IntroProvider (le Loader n'est même pas rendu).
//
// z-index doc : **z-[100]** — couvre toute la z-stack actuelle (header z-50,
// burger z-40, modal projet z-50). Si un toast / overlay futur doit coexister
// avec le loader, coordonner ici avec priorité claire.
export function Loader() {
  const t = useTranslations('loader');
  const { markDone } = useIntro();
  const rootRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // États initiaux — parser GSAP en direct, pas de CSS anti-FOUC (le
      // Loader n'existe que le temps de son jeu).
      gsap.set(underlineRef.current, { scaleX: 0, transformOrigin: 'left center' });
      gsap.set(nameRef.current, { opacity: 1, y: 0, scale: 1 });
      gsap.set(rootRef.current, { opacity: 1 });

      const counter = { value: 0 };

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: markDone,
      });

      // Trace underline (800ms, ease-out-smooth — brief token. GSAP n'accepte
      // pas les strings cubic-bezier sans CustomEase plugin ; `power4.out` est
      // l'équivalent nommé le plus proche de cubic-bezier(0.22,1,0.36,1)).
      tl.to(
        underlineRef.current,
        { scaleX: 1, duration: 0.8, ease: 'power4.out' },
        0,
      );

      // Compteur 00 → 100 en parallèle, même durée.
      tl.to(
        counter,
        {
          value: 100,
          duration: 0.8,
          ease: 'power1.out',
          onUpdate: () => {
            if (counterRef.current) {
              counterRef.current.textContent = String(Math.round(counter.value)).padStart(2, '0');
            }
          },
        },
        0,
      );

      // Hold bref.
      tl.to({}, { duration: 0.3 }, '>');

      // Exit label pour le skip : timeScale 2 → seek('exit') compresse à 400ms.
      tl.addLabel('exit');

      // Nom slide + scale-down + fade vers le coin top-left (approx. logo LSV).
      // `expo.out` = équivalent GSAP de cubic-bezier(0.16,1,0.3,1) — brief
      // token ease-expo-out.
      tl.to(
        nameRef.current,
        {
          y: -window.innerHeight * 0.42,
          x: -window.innerWidth * 0.42,
          scale: 0.25,
          opacity: 0,
          duration: 0.8,
          ease: 'expo.out',
          transformOrigin: 'center center',
        },
        'exit',
      );

      // Underline + counter : fade simple, plus rapide.
      tl.to(
        [underlineRef.current, counterRef.current],
        { opacity: 0, duration: 0.3, ease: 'power1.out' },
        'exit',
      );

      // Fond fade to transparent, révèle le header + hero en dessous.
      tl.to(
        rootRef.current,
        { opacity: 0, duration: 0.6, ease: 'power2.inOut' },
        'exit+=0.2',
      );

      tlRef.current = tl;
    }, rootRef);

    return () => ctx.revert();
  }, [markDone]);

  // Skip : accélère le timeline et saute à la phase exit. Si déjà skippé,
  // no-op (évite double call markDone via re-clicks rapides).
  const handleSkip = () => {
    if (skipped) return;
    setSkipped(true);
    const tl = tlRef.current;
    if (!tl) return;
    tl.timeScale(2);
    // Si on est avant 'exit', seek direct. Sinon laisse finir naturellement
    // (déjà dans la phase exit, on ne peut qu'accélérer).
    const exitTime = tl.labels['exit'];
    if (typeof exitTime === 'number' && tl.time() < exitTime) {
      tl.seek('exit');
    }
  };

  // Skip clavier (Escape + Enter) pour l'accessibilité.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') handleSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipped]);

  return (
    <div
      ref={rootRef}
      onClick={handleSkip}
      role="button"
      tabIndex={0}
      aria-label={t('skipLabel')}
      className={cn(
        // z-[100] : au-dessus de header/burger/modals. Voir commentaire doc fichier.
        'fixed inset-0 z-[100] flex items-center justify-center',
        'bg-bg-0 cursor-pointer select-none',
      )}
    >
      {/* Nom centre écran */}
      <div className="relative flex flex-col items-center">
        <span
          ref={nameRef}
          className={cn(
            'font-display font-semibold text-text-0 leading-none',
            'text-display-l md:text-display-l',
          )}
        >
          {t('name')}
        </span>
        {/* Underline rouge qui se trace G→D. scaleX animé, origin left. */}
        <span
          ref={underlineRef}
          aria-hidden
          className="mt-4 block h-[2px] w-full bg-accent"
        />
      </div>

      {/* Compteur mono bottom-left (brief §6.1). */}
      <span
        ref={counterRef}
        aria-hidden
        className={cn(
          'absolute bottom-6 left-6 md:bottom-10 md:left-16',
          'font-mono text-caption text-text-1 tracking-[0.15em]',
        )}
      >
        00
      </span>
    </div>
  );
}
