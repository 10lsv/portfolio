'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useEffect, useId, useRef, useState } from 'react';

import { gsap } from '@/lib/animations';
import { cn } from '@/lib/cn';
import { revealBlock, revealMask } from '@/lib/reveals';
import { useReducedMotion } from '@/lib/useReducedMotion';

// URLs sociales — cohérent avec BurgerMenu.tsx (mêmes valeurs hardcodées
// à deux endroits, pas de centralisation lib/config — pragmatique pour 2
// liens stables).
const GITHUB_URL = 'https://github.com/10lsv';
const LINKEDIN_URL = 'https://www.linkedin.com/in/léo-sauvey/';

// Contact V8 — card formulaire Apple form pur (revert d'un essai
// précédent avec skew + dots décoratifs).
//
// La card est un container blanc statique avec hairline noir ultra-
// discret + ombre douce Apple — vibe "fiche premium". Aucun transform,
// aucun ornement décoratif, aucune anim au hover.
//
// Spec :
//   - max-w-md responsive
//   - bg-white (blanc pur)
//   - border border-black/[0.08] (hairline 1px)
//   - rounded-2xl (16px généreux Apple)
//   - shadow [0_8px_30px_rgba(0,0,0,0.06)] (ombre portée subtile, vibe
//     "card flotte délicatement au-dessus de la page")
//   - p-8 md:p-10
//   - PAS de transform / hover effect (statique pro)
//   - PAS de transition sur le container
//
// Inputs : white bg + border-black/10 rounded-lg, focus border-black +
// ring subtil. Bouton submit pleine largeur bg-black text-white rounded-lg.
//
// Backend Resend INTACT (route /api/contact, rate limit, honeypot).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MESSAGE_MIN = 10;

type Status = 'idle' | 'loading' | 'success' | 'error';

const SERVER_ERROR_KEY: Record<string, string> = {
  rate_limit: 'errorRateLimit',
  invalid_email: 'errorInvalidEmail',
  message_too_short: 'errorMessageTooShort',
  missing_fields: 'errorMissingFields',
};

type FieldErrors = Partial<Record<'name' | 'email' | 'message', string>>;

export function Contact() {
  const t = useTranslations('contact');
  const tForm = useTranslations('contact.form');
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);

  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const errorAnnounceId = useId();
  const successAnnounceId = useId();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Cascade naturelle : pas de `trigger` global passé aux deux
      // helpers — chaque élément est son propre trigger (fallback
      // wrapper / els[0]). Le H2 entre dans le viewport en premier
      // (positionné au-dessus de la card) et se révèle, puis la card
      // suit quand elle entre à son tour. Pas besoin de delay GSAP
      // explicite — le scroll fait la cascade.
      revealMask({
        reducedMotion,
        target: '[data-reveal-mask]',
        root: rootRef.current,
      });

      revealBlock({
        reducedMotion,
        target: '[data-reveal-block]',
        root: rootRef.current,
      });
    }, rootRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  function validateLocally(): FieldErrors {
    const errs: FieldErrors = {};
    if (!name.trim()) errs.name = tForm('errorMissingFields');
    if (!email.trim()) errs.email = tForm('errorMissingFields');
    else if (!EMAIL_RE.test(email.trim())) errs.email = tForm('errorInvalidEmail');
    if (!message.trim()) errs.message = tForm('errorMissingFields');
    else if (message.trim().length < MESSAGE_MIN)
      errs.message = tForm('errorMessageTooShort');
    return errs;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);

    const errs = validateLocally();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          website,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
      };

      if (res.ok && data.ok) {
        setStatus('success');
        setFeedback(tForm('successMessage'));
        setName('');
        setEmail('');
        setMessage('');
        setFieldErrors({});
        return;
      }

      const errKey = data.code ? SERVER_ERROR_KEY[data.code] : undefined;
      setStatus('error');
      setFeedback(errKey ? tForm(errKey) : tForm('errorGeneric'));
    } catch {
      setStatus('error');
      setFeedback(tForm('errorGeneric'));
    }
  }

  const isLoading = status === 'loading';
  const submitLabel = isLoading ? tForm('submitting') : tForm('submit');

  return (
    <section
      ref={rootRef}
      id="contact"
      // Sprint mobile v3 : pt-40 mobile (160px) au lieu de pt-32 (128px)
      // → gap >100px entre le bas du menu burger sticky (header h-14 =
      // 56px) et le H2 → respiration visuelle. Desktop INCHANGÉ
      // (md:px-12 md:pt-48 md:pb-0).
      className="relative px-6 pt-40 pb-4 md:px-12 md:pt-48 md:pb-0"
      aria-labelledby="contact-title"
    >
      <div className="mx-auto flex w-full max-w-(--container-max) flex-col items-center">
        {/* H2 visible — wrapper pour revealMask (le helper applique
            overflow:hidden au runtime + anime l'inner H2 yPercent 100 → 0). */}
        <div data-reveal-mask className="mb-12 px-4 text-center md:mb-16 md:px-0">
          <h2
            id="contact-title"
            className={cn(
              'font-sans font-semibold text-black',
              // Sprint mobile v3 : text-xl (20px) au lieu de text-2xl
              // (24px) — encore plus de marge pour "Une idée ?
              // Parlons-en." / "Got an idea? Let's talk." sur 1 ligne
              // même sur viewports plus étroits que 393px (iPhone SE
              // 375px). md:text-5xl lg:text-6xl INCHANGÉS (desktop
              // locked).
              'text-xl md:text-5xl lg:text-6xl',
              'tracking-tight leading-[1.1]',
            )}
          >
            {t('title')}
          </h2>
        </div>

        <div
          data-reveal-block
          className={cn(
            // Sprint mobile v3 : max-w-xs (320px) mobile pour un look
            // encore plus compact sur téléphone. md:max-w-md (448px)
            // restauré dès le breakpoint desktop. Desktop INCHANGÉ.
            'w-full max-w-xs md:max-w-md',
            'bg-white',
            'border border-black/[0.08]',
            'rounded-2xl',
            // p-6 mobile / md:p-10 desktop INCHANGÉ.
            'p-6 md:p-10',
            'shadow-[0_8px_30px_rgba(0,0,0,0.06)]',
          )}
        >
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
            aria-busy={isLoading}
          >
            {/* Honeypot — invisible humains/SR, accessible aux bots */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden opacity-0"
            >
              <label htmlFor="website-hp">Website</label>
              <input
                id="website-hp"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <FormField
              id={nameId}
              label={tForm('nameLabel')}
              type="text"
              autoComplete="name"
              value={name}
              onChange={setName}
              placeholder={tForm('namePlaceholder')}
              required
              error={fieldErrors.name}
              disabled={isLoading}
            />

            <FormField
              id={emailId}
              label={tForm('emailLabel')}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={setEmail}
              placeholder={tForm('emailPlaceholder')}
              required
              error={fieldErrors.email}
              disabled={isLoading}
            />

            <FormTextarea
              id={messageId}
              label={tForm('messageLabel')}
              value={message}
              onChange={setMessage}
              placeholder={tForm('messagePlaceholder')}
              required
              rows={5}
              error={fieldErrors.message}
              disabled={isLoading}
            />

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              aria-describedby={
                status === 'error'
                  ? errorAnnounceId
                  : status === 'success'
                    ? successAnnounceId
                    : undefined
              }
              className={cn(
                'mt-2 inline-flex w-full items-center justify-center gap-2',
                'rounded-lg bg-black px-6 py-4',
                'font-sans text-base font-semibold text-white',
                // V8 : transition 200ms (vs 300ms avant) plus snappy Apple
                // form pur — toujours sur l'Apple ease curve.
                'transition-opacity duration-200 ease-(--ease-expo-out)',
                'hover:opacity-90',
                'disabled:cursor-not-allowed disabled:opacity-60',
                'focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2',
              )}
            >
              {isLoading && (
                <Loader2 className="size-4 animate-spin text-white/70" aria-hidden />
              )}
              {submitLabel}
            </button>

            {status === 'success' && feedback && (
              <p
                id={successAnnounceId}
                role="status"
                aria-live="polite"
                className="text-center text-sm text-green-600"
              >
                {feedback}
              </p>
            )}
            {status === 'error' && feedback && (
              <p
                id={errorAnnounceId}
                role="alert"
                aria-live="assertive"
                className="text-center text-sm text-red-600"
              >
                {feedback}
              </p>
            )}
          </form>
        </div>

        {/* Liens sociaux sous la card — texte simple sans icônes (vibe
            Apple footer minimal). Séparateur "·" au milieu, gris discret
            qui passe noir au hover. target=_blank + rel sécurisé. */}
        <div className="mt-8 md:mt-10 flex items-center justify-center gap-3 text-sm">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('socialAriaGithub')}
            className={cn(
              'text-text-3 transition-colors duration-200 ease-(--ease-expo-out)',
              'hover:text-black',
            )}
          >
            GitHub
          </a>
          <span aria-hidden className="text-text-3 select-none">
            ·
          </span>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('socialAriaLinkedin')}
            className={cn(
              'text-text-3 transition-colors duration-200 ease-(--ease-expo-out)',
              'hover:text-black',
            )}
          >
            LinkedIn
          </a>
        </div>
      </div>
    </section>
  );
}

type FormFieldProps = {
  id: string;
  label: string;
  type: 'text' | 'email';
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'email';
  required?: boolean;
  error?: string;
  disabled?: boolean;
};

function FormField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  required,
  error,
  disabled,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-black">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg px-4 py-3',
          'bg-white border border-black/10',
          'text-base text-black placeholder:text-black/40',
          'transition-[border-color,box-shadow] duration-200 ease-(--ease-expo-out)',
          'focus:border-black focus:outline-none focus:ring-1 focus:ring-black/5',
          'disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-red-500/60',
        )}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type FormTextareaProps = Omit<FormFieldProps, 'type' | 'inputMode' | 'autoComplete'> & {
  rows: number;
};

function FormTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  disabled,
  rows,
}: FormTextareaProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-black">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled}
        className={cn(
          'w-full resize-y rounded-lg px-4 py-3',
          'bg-white border border-black/10',
          'text-base text-black placeholder:text-black/40',
          'transition-[border-color,box-shadow] duration-200 ease-(--ease-expo-out)',
          'focus:border-black focus:outline-none focus:ring-1 focus:ring-black/5',
          'disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-red-500/60',
        )}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
