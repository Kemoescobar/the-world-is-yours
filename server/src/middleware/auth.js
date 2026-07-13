import { supabase } from '../supabaseClient.js';

/**
 * Vérifie le JWT Supabase (Authorization: Bearer <access_token>).
 * Le service_role reste côté serveur ; l'identité vient du token utilisateur.
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

  req.user = data.user;
  req.accessToken = token;
  next();
}
