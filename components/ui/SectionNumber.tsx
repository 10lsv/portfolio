import { cn } from '@/lib/cn';

type SectionNumberProps = {
  number: string;
  className?: string;
};

// 01/02/04 en Clash Display 24px rouge, ligne verticale rouge qui descend
// en dessous (brief §6.5). Purement décoratif, caché aux AT.
export function SectionNumber({ number, className }: SectionNumberProps) {
  return (
    <div
      aria-hidden
      className={cn('flex flex-col items-start gap-4', className)}
    >
      <span className="font-display text-accent text-h3 leading-none font-semibold">
        {number}
      </span>
      <span className="bg-accent h-20 w-px md:h-24" />
    </div>
  );
}
