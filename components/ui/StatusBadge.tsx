import type { ProjectStatus } from '@/content/projects';
import { cn } from '@/lib/cn';

type StatusBadgeProps = {
  status: ProjectStatus;
  label: string;
  className?: string;
};

// Pastille + label caption mono uppercase. Même taille / même positionnement
// pour les 3 statuts, pour garder une cohérence visuelle card ↔ modal.
const DOT_CLASS: Record<ProjectStatus, string> = {
  live: 'bg-success',
  wip: 'bg-accent',
  offline: 'bg-text-2',
};

const LABEL_CLASS: Record<ProjectStatus, string> = {
  live: 'text-success',
  wip: 'text-accent',
  offline: 'text-text-2',
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2',
        'font-mono text-[11px] font-medium uppercase tracking-[0.15em]',
        LABEL_CLASS[status],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn('size-[6px] rounded-full', DOT_CLASS[status])}
      />
      {label}
    </span>
  );
}
