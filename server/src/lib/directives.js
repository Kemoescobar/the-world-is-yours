import { supabase } from '../supabaseClient.js';

export const DIRECTIVE_TYPES = [
  'message_matin',
  'priorites_jour',
  'revue_soir',
  'alerte',
  'decision',
];

/**
 * Directives encore valides (valide_jusqua null ou future), une par type (plus récente).
 * @param {string} [typeFilter]
 * @returns {Promise<Record<string, object>|object|null>}
 */
export async function getActiveDirectives(typeFilter) {
  const now = new Date().toISOString();
  let query = supabase
    .from('directives')
    .select('*')
    .order('cree_le', { ascending: false })
    .limit(40);

  if (typeFilter) {
    if (!DIRECTIVE_TYPES.includes(typeFilter)) {
      const err = new Error(`type invalide: ${typeFilter}`);
      err.status = 400;
      throw err;
    }
    query = query.eq('type', typeFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const valides = (data || []).filter(
    (d) => !d.valide_jusqua || d.valide_jusqua > now,
  );

  if (typeFilter) {
    return valides[0] || null;
  }

  /** @type {Record<string, object>} */
  const byType = {};
  for (const d of valides) {
    if (!byType[d.type]) byType[d.type] = d;
  }
  return byType;
}

/**
 * @param {{ type: string, contenu: object, valide_jusqua?: string|null, source?: string }} row
 */
export async function insertDirective(row) {
  const { data, error } = await supabase
    .from('directives')
    .insert({
      type: row.type,
      contenu: row.contenu,
      source: row.source || 'cowork',
      valide_jusqua: row.valide_jusqua || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
