// Rate limit IP en mémoire — MVP only.
//
// Limites :
//  - Vercel serverless est éphémère (cold starts vidents la Map). Le rate
//    limit est "best-effort" : il bloque les abus rapprochés au sein d'une
//    même instance chaude, mais un attaquant qui tape assez fort pour faire
//    cold-start chaque invocation passe à travers.
//  - Pour de la vraie protection : migrer vers Vercel KV / Upstash Redis.
//
// Choix d'API minimal : `take(ip)` retourne un verdict `{ ok, retryAfter? }`,
// le caller décide de la réponse HTTP. Pas de lib externe.
const WINDOW_MS = 60 * 60 * 1000; // 1 heure
const MAX_REQUESTS = 3;

type Bucket = { count: number; firstAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimitVerdict =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

export function take(ip: string): RateLimitVerdict {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || now - bucket.firstAt > WINDOW_MS) {
    buckets.set(ip, { count: 1, firstAt: now });
    return { ok: true };
  }

  if (bucket.count < MAX_REQUESTS) {
    bucket.count += 1;
    return { ok: true };
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((WINDOW_MS - (now - bucket.firstAt)) / 1000),
  );
  return { ok: false, retryAfterSeconds };
}
