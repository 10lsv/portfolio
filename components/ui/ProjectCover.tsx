import Image from 'next/image';

import { cn } from '@/lib/cn';

type ProjectCoverProps = {
  title: string;
  src?: string;
  className?: string;
  /**
   * Charge l'image en priorité (LCP hint) — featured project uniquement.
   * Évite un FCP dégradé sur le hero card au-dessus du fold.
   */
  priority?: boolean;
};

// Cover du projet. Si `src` est fourni, on affiche l'image via next/image
// en mode `fill` (le parent définit l'aspect ratio). Sinon, placeholder
// propre : bg-bg-2 + nom du projet en Clash Display uppercase centré.
// Volontairement aucun label "COVER PENDING" — le bloc doit lire comme un
// choix design, pas comme un asset manquant.
//
// `placeholder="empty"` (défaut next/image) : fond transparent pendant le
// chargement. Le wrapper parent a déjà `bg-bg-2` implicite via la card, donc
// l'attente est cohérente visuellement avec le placeholder textuel du mode
// sans src — continuité demandée brief Sprint covers.
export function ProjectCover({
  title,
  src,
  className,
  priority,
}: ProjectCoverProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        priority={priority}
        // Les covers viennent de /api/project-cover/[slug] : PNG 1600×1000
        // (ratio 4:3 exact de la card) déjà optimisé, avec Cache-Control
        // immutable 1y. Le passage par _next/image (qui re-encode en AVIF/
        // WebP via next.config.images.formats) introduit du banding et
        // désature visiblement les blancs sur Satori PNG → on bypass.
        unoptimized
        className={cn('object-cover', className)}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        'flex size-full items-center justify-center bg-bg-2',
        'px-6',
        className,
      )}
    >
      <span
        className={cn(
          'font-display font-semibold uppercase text-text-1',
          'text-[clamp(1.75rem,4vw,3.5rem)] leading-none tracking-tight',
        )}
      >
        {title}
      </span>
    </div>
  );
}
