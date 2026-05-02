'use client';

import { Github, Linkedin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/cn';

// V6 sprint chirurgical : item "about" retiré (section supprimée).
const NAV_ITEMS = [
  { href: '#home', key: 'home' },
  { href: '#projects', key: 'projects' },
  { href: '#contact', key: 'contact' },
] as const;

const GITHUB_URL = 'https://github.com/10lsv';
const LINKEDIN_URL = 'https://www.linkedin.com/in/léo-sauvey/';

type BurgerMenuProps = {
  open: boolean;
  onClose: () => void;
};

// BurgerMenu V5 — Minimal Apple (refonte sprint massif).
//
// Mécanique :
//   - Fade-in fullscreen + scale 1.05 → 1 du contenu (vibe Apple Vision
//     Pro / Apple.com landing). Pas d'effet portail, pas de clip-path.
//   - Background : noir pur #000000 + radial-gradient blanc 4% au
//     centre (donne profondeur subtile).
//   - Items du menu CENTRÉS verticalement et horizontalement, en Inter
//     bold extra-large (text-5xl à text-7xl), sans préfixe numéroté,
//     sans monospace.
//   - Hover Apple : opacity 0.6 sur l'item non-survolé... non en fait
//     l'item survolé reste à 1, les autres tombent à 0.4 — pattern
//     Apple "focus on what matters".
//   - Footer : 2 liens sociaux text-sm gris discret, espacés, hover
//     opacity 0.6.
//
// Timing :
//   - Open : 800ms ease cubic-bezier(0.16, 1, 0.3, 1)
//   - Close : 600ms même easing
//
// Accessibilité :
//   - role="dialog" aria-modal
//   - inert quand fermé
//   - Escape → close
//   - Scroll lock body pendant open
export function BurgerMenu({ open, onClose }: BurgerMenuProps) {
  const t = useTranslations('nav');
  const tBurger = useTranslations('burger');

  // mounted = différé d'unmount pour laisser jouer la transition de
  // fermeture (le content fade-out 600ms avant le retrait du DOM).
  const [mounted, setMounted] = useState(open);

  // Track which item is hovered → tous les autres descendent à opacity 0.4.
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const tid = window.setTimeout(() => {
      setMounted(false);
      setHoveredKey(null);
    }, 700); // > 600ms close transition
    return () => window.clearTimeout(tid);
  }, [open]);

  // Escape ferme le menu.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Scroll lock body pendant l'ouverture.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div
      id="burger-menu"
      role="dialog"
      aria-modal="true"
      aria-label={tBurger('label')}
      inert={!open || undefined}
      className={cn(
        // V6 light : bg-black → bg-white, le menu prend la couleur du
        // body de la page light.
        'fixed inset-0 z-40 bg-white',
        // Open : 800ms, Close : 600ms — Apple-ease cubic-bezier(0.16,1,0.3,1).
        // On utilise --ease-expo-out qui pointe vers cette même curve.
        'transition-opacity ease-(--ease-expo-out)',
        open
          ? 'pointer-events-auto opacity-100 duration-[800ms]'
          : 'pointer-events-none opacity-0 duration-[600ms]',
      )}
    >
      {/* Radial-gradient subtil au centre — vibe Apple "spotlight discret".
          Posé en pseudo via un div absolute pour pouvoir être animé
          indépendamment si besoin. Inactif au close (pointer-events none
          inherited) pour ne pas charger le compositing. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          // V6 light : radial sombre (0,0,0,0.04) au centre — donne le
          // spotlight subtil inversé pour fond blanc.
          background:
            'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.04) 0%, transparent 30%)',
        }}
      />

      {/* Contenu — scale + fade pour matcher l'animation d'ouverture.
          Mounted gate pour éviter de rendre quand pas open + 700ms
          delay close fini. */}
      {mounted && (
        <div
          className={cn(
            'relative flex h-full w-full flex-col',
            'transition-[transform,opacity] ease-(--ease-expo-out)',
            open
              ? 'opacity-100 scale-100 duration-[800ms]'
              : 'opacity-0 scale-105 duration-[600ms]',
          )}
        >
          {/* NAV — items centrés vertical + horizontal */}
          <nav
            className="flex flex-1 flex-col items-center justify-center gap-6 px-6 md:gap-8 md:px-16"
            aria-label="Primary"
          >
            {NAV_ITEMS.map((item) => {
              const dimmed = hoveredKey !== null && hoveredKey !== item.key;
              return (
                <a
                  key={item.key}
                  href={item.href}
                  onClick={onClose}
                  onMouseEnter={() => setHoveredKey(item.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  className={cn(
                    // Inter bold tracking-tight — display feel sans
                    // ajouter une nouvelle font.
                    'font-sans font-bold tracking-tight text-text-1',
                    'text-5xl md:text-7xl lg:text-8xl',
                    'leading-none',
                    'transition-opacity duration-(--duration-normal) ease-(--ease-expo-out)',
                    dimmed ? 'opacity-40' : 'opacity-100',
                  )}
                >
                  {t(item.key)}
                </a>
              );
            })}
          </nav>

          {/* FOOTER — socials minimal */}
          <div className="flex items-center justify-center gap-8 px-6 pb-10 md:gap-12 md:pb-16">
            <SocialLink
              href={GITHUB_URL}
              label={tBurger('github')}
              icon={<Github className="size-4" strokeWidth={1.25} />}
            />
            <SocialLink
              href={LINKEDIN_URL}
              label={tBurger('linkedin')}
              icon={<Linkedin className="size-4" strokeWidth={1.25} />}
            />
          </div>
        </div>
      )}
    </div>
  );
}

type SocialLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function SocialLink({ href, label, icon }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 text-sm text-text-3',
        'transition-opacity duration-(--duration-normal) ease-(--ease-expo-out)',
        'hover:opacity-60',
      )}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}
