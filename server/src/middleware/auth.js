import crypto from 'crypto';
import { supabase } from '../supabaseClient.js';

/**
 * OWNER_USER_ID (un id) ou ALLOWED_USER_IDS (liste séparée par des virgules).
 * Obligatoire en production — l'API utilise service_role et contourne le RLS.
 */
export function getAllowedUserIds() {
  const raw = process.env.ALLOWED_USER_IDS || process.env.OWNER_USER_ID || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isOwnerUserId(userId) {
  const allowed = getAllowedUserIds();
  if (!allowed.length) return false;
  return allowed.includes(userId);
}

function timingSafeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/**
 * Vérifie le JWT Supabase (Authorization: Bearer <access_token>).
 * Le service_role reste côté serveur ; l'identité vient du token utilisateur.
 * Ensuite applique l'allowlist owner (single-owner personal OS).
 */
export async function requireAuth(req, res, next) {
  const header = req.header('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'authentification requise' });
  }

  const token = match[1];
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: 'session invalide ou expirée' });
  }

  const allowed = getAllowedUserIds();
  if (!allowed.length) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        error: 'OWNER_USER_ID / ALLOWED_USER_IDS non configuré — accès privé désactivé',
      });
    }
    console.warn(
      '[auth] OWNER_USER_ID / ALLOWED_USER_IDS unset — allowlist désactivée (dev only)',
    );
  } else if (!isOwnerUserId(data.user.id)) {
    return res.status(403).json({ error: 'accès réservé au propriétaire' });
  }

  req.user = data.user;
  req.accessToken = token;
  next();
}

/** JWT utilisateur OU clé n8n (x-api-key = WEBHOOK_API_KEY). */
export function requireAuthOrApiKey(req, res, next) {
  const cle = req.header('x-api-key');
  if (cle && timingSafeEqualString(cle, process.env.WEBHOOK_API_KEY || '')) {
    req.authMode = 'apiKey';
    return next();
  }
  return requireAuth(req, res, next);
}

/**
 * Valide un JWT optionnel. Retourne l'user owner si token valide + allowlist OK, sinon null.
 * Ne lève jamais le filtre public sur un header Authorization non vérifié.
 */
export async function resolveOwnerFromBearer(req) {
  const header = req.header('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const { data, error } = await supabase.auth.getUser(match[1]);
  if (error || !data?.user) return null;

  const allowed = getAllowedUserIds();
  if (!allowed.length) {
    if (process.env.NODE_ENV === 'production') return null;
    return data.user;
  }
  if (!isOwnerUserId(data.user.id)) return null;
  return data.user;
}
