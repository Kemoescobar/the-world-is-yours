import { supabase } from './supabase.js';

const API_URL = import.meta.env.VITE_API_URL;

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

  if (auth) {
    const token = await getAccessToken();
    if (!token) {
      throw new ApiError('authentification requise', 401);
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const url = path.startsWith('http') ? path : `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, { ...rest, headers });

  if (res.status === 204) return null;

  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
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
