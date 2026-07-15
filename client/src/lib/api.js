import { supabase } from './supabase.js';

/** Normalise VITE_API_URL — sans schéma, fetch devient relatif à Vercel et renvoie du HTML. */
function resolveApiUrl() {
  let base = (import.meta.env.VITE_API_URL || '').trim();
  if (!base) return '';
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  return base.replace(/\/$/, '');
}

const API_URL = resolveApiUrl();

export function getApiBaseUrl() {
  return API_URL;
}

/** Origin Express (sans /api) pour /health etc. */
export function getApiOrigin() {
  if (!API_URL) return '';
  return API_URL.replace(/\/api\/?$/, '');
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

/**
 * Client HTTP central — injecte le JWT Supabase.
 * @param {string} path chemin relatif (ex: '/quetes') ou absolu API
 * @param {RequestInit & { auth?: boolean }} options auth=false pour endpoints publics
 */
export async function api(path, options = {}) {
  const { auth = true, headers: extraHeaders, ...rest } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (!API_URL && !path.startsWith('http')) {
    throw new ApiError(
      'VITE_API_URL manquante — impossible d’appeler l’API (rebuild client requis)',
      0,
    );
  }

  if (auth) {
    const token = await getAccessToken();
    if (!token) {
      // Throw BEFORE fetch → zero network. Callers must surface this, never invent data.
      throw new ApiError('authentification requise', 401);
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const url = path.startsWith('http') ? path : `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    cache: 'no-store',
    ...rest,
    headers,
  });

  if (res.status === 204) return null;

  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // HTML from SPA rewrite = misconfigured API URL
    if (typeof text === 'string' && text.trimStart().startsWith('<')) {
      throw new ApiError(
        'réponse HTML au lieu de JSON — VITE_API_URL pointe probablement sur le front, pas Railway',
        res.status,
        text.slice(0, 120),
      );
    }
    body = text;
  }

  if (!res.ok) {
    const message = (body && body.error) || res.statusText || 'erreur API';
    throw new ApiError(message, res.status, body);
  }

  return body;
}

export function apiGet(path, opts) {
  return api(path, { ...opts, method: 'GET' });
}

export function apiPost(path, data, opts) {
  return api(path, { ...opts, method: 'POST', body: JSON.stringify(data) });
}

export function apiPatch(path, data, opts) {
  return api(path, { ...opts, method: 'PATCH', body: JSON.stringify(data) });
}
