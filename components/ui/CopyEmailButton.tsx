'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

type CopyEmailButtonProps = {
  email: string;
  label: string;
  copiedLabel: string;
};

// Brief §6.8 : bouton secondaire "Copier l'email", icône Copy qui devient
// Check 2s après clic, toast "Copié ✓" en rouge accent qui fade après 2s.
export function CopyEmailButton({ email, label, copiedLabel }: CopyEmailButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // navigator.clipboard peut échouer hors HTTPS ou si la permission
      // est refusée — on reste silencieux, l'utilisateur garde le mailto.
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-live="polite"
        className={cn(
          'inline-flex items-center gap-2 rounded-md px-4 py-2',
          'border border-border text-text-1',
          'font-mono text-sm uppercase tracking-wider',
          'transition-colors duration-(--duration-fast) ease-(--ease-in-out)',
          'hover:border-border-hi hover:text-text-0',
        )}
      >
        {copied ? (
          <Check className="size-4" strokeWidth={1.5} aria-hidden />
        ) : (
          <Copy className="size-4" strokeWidth={1.5} aria-hidden />
        )}
        <span>{label}</span>
      </button>

      <span
        aria-hidden={!copied}
        className={cn(
          'text-accent font-mono text-sm uppercase tracking-wider',
          'transition-opacity duration-(--duration-normal) ease-(--ease-in-out)',
          copied ? 'opacity-100' : 'opacity-0',
        )}
      >
        {copiedLabel}
      </span>
    </div>
  );
}
