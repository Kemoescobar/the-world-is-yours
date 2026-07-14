/**
 * Rate limiter mémoire simple (une instance Railway).
 * Clé = IP (+ suffixe optionnel, ex. api-key hash).
 */

const stores = new Map();

function clientIp(req) {
  const xf = req.header('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * @param {{ windowMs: number, max: number, key?: (req) => string, message?: string }} opts
 */
export function rateLimit(opts) {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 60;
  const message = opts.message || 'trop de requêtes — réessaie plus tard';
  const keyFn = opts.key || ((req) => clientIp(req));
  const name = opts.name || 'default';

  if (!stores.has(name)) stores.set(name, new Map());
  const bucket = stores.get(name);

  return function rateLimitMiddleware(req, res, next) {
    const key = keyFn(req);
    const now = Date.now();
    let entry = bucket.get(key);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      bucket.set(key, entry);
    }
    entry.count += 1;

    const remaining = Math.max(0, max - entry.count);
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      return res.status(429).json({ error: message });
    }
    next();
  };
}

/** Webhooks (GitHub + entree générique) — anti brute-force secret. */
export const webhookRateLimit = rateLimit({
  name: 'webhooks',
  windowMs: 60_000,
  max: 60,
  message: 'webhook rate limit',
});

/** Routes AI (coût Claude). */
export const aiRateLimit = rateLimit({
  name: 'ai',
  windowMs: 60_000,
  max: 20,
  message: 'AI rate limit',
});

/** Auth-adjacent / export sensibles. */
export const authSensitiveRateLimit = rateLimit({
  name: 'auth-sensitive',
  windowMs: 15 * 60_000,
  max: 40,
  message: 'trop de tentatives',
});
