import { type NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

import { take } from '@/lib/rateLimit';

// Node runtime explicite : Resend SDK + Map en mémoire (rateLimit) sont plus
// stables ici qu'en Edge (régions multiples = état Map fragmenté).
export const runtime = 'nodejs';

// Garde-fous serveur. Le client valide aussi mais on ne lui fait pas confiance.
const NAME_MIN = 1;
const NAME_MAX = 100;
const EMAIL_MAX = 200;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Adresse de réception (compte Resend de Léo, validée chez eux).
const TO_EMAIL = 'sauveyleo@gmail.com';
// Domaine d'envoi : `onboarding@resend.dev` est le sandbox Resend gratuit
// (pas besoin de DNS). À swapper sur un domaine custom une fois leosauvey.fr
// vérifié dans Resend (records SPF/DKIM/Return-Path).
const FROM_EMAIL = 'Portfolio <onboarding@resend.dev>';

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown; // honeypot
};

type ErrorCode =
  | 'missing_fields'
  | 'invalid_email'
  | 'message_too_short'
  | 'rate_limit'
  | 'config'
  | 'send_failed';

function err(code: ErrorCode, status: number, retryAfter?: number) {
  const headers: Record<string, string> = {};
  if (retryAfter) headers['Retry-After'] = String(retryAfter);
  return NextResponse.json({ ok: false, code }, { status, headers });
}

// Extraction d'IP. Vercel pose `x-forwarded-for` ; en local, fallback sur une
// constante (pas critique, le rate limit local n'a pas de sens en dev solo).
function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() ?? 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: NextRequest) {
  let body: ContactPayload;
  try {
    body = (await req.json()) as ContactPayload;
  } catch {
    return err('missing_fields', 400);
  }

  // Honeypot : si le champ "website" (caché côté UI) est rempli, c'est un
  // bot. On ack 200 silencieusement pour ne pas signaler la détection.
  if (typeof body.website === 'string' && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (
    name.length < NAME_MIN ||
    name.length > NAME_MAX ||
    !email ||
    email.length > EMAIL_MAX ||
    !message
  ) {
    return err('missing_fields', 400);
  }
  if (!EMAIL_RE.test(email)) return err('invalid_email', 400);
  if (message.length < MESSAGE_MIN) return err('message_too_short', 400);
  if (message.length > MESSAGE_MAX) return err('message_too_short', 400);

  const verdict = take(getClientIp(req));
  if (!verdict.ok) {
    return err('rate_limit', 429, verdict.retryAfterSeconds);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Pas de crash 500 brut : on logue côté serveur, on renvoie une erreur
    // claire. Le client affiche un message générique. En local sans la clé,
    // c'est attendu — Léo verra l'erreur dans le UI plutôt qu'un trace.
    console.error('[contact] RESEND_API_KEY missing — set it in .env.local');
    return err('config', 503);
  }

  const resend = new Resend(apiKey);

  // HTML simple, pas de templating. Échappement basique des champs user
  // dans le body (Resend ne sanitize pas — on évite l'injection HTML).
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
  const sentAt = new Date().toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',
  });

  const html = `<!doctype html>
<html><body style="font-family: -apple-system, system-ui, sans-serif; color: #0a0a0a; max-width: 600px;">
<h2 style="margin: 0 0 24px;">Nouveau message depuis ton portfolio</h2>
<p><strong>Nom :</strong> ${safeName}<br>
<strong>Email :</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
<p><strong>Message :</strong></p>
<div style="border-left: 3px solid #8b0000; padding: 8px 16px; background: #fafafa;">
${safeMessage}
</div>
<hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e5e5;">
<p style="font-size: 12px; color: #6b6b6b;">Envoyé via leosauvey.fr le ${sentAt}</p>
</body></html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `Contact via leosauvey.fr — ${name}`,
      html,
    });
    if (error) {
      console.error('[contact] Resend error:', error);
      return err('send_failed', 502);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[contact] unexpected:', e);
    return err('send_failed', 502);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
