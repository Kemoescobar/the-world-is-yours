import crypto from 'crypto';

function timingSafeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * X-API-Key = WEBHOOK_API_KEY (même pattern que POST /api/entree, POST /api/directives).
 * Pas d'auth utilisateur.
 */
export function requireApiKey(req, res, next) {
  const cle = req.header('x-api-key');
  if (!timingSafeEqualString(cle || '', process.env.WEBHOOK_API_KEY || '')) {
    return res.status(401).json({ error: 'clé API invalide ou absente' });
  }
  next();
}
