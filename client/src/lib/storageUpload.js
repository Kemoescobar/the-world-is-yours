import { supabase } from './supabase.js';

/**
 * Upload image to public `captures` bucket; returns public URL.
 * @param {File} file
 * @param {string} folder e.g. 'covers' | 'projets'
 */
export async function uploadCapture(file, folder = 'misc') {
  if (!file) throw new Error('fichier manquant');
  const safe = file.name.replace(/[^\w.\-]+/g, '-').slice(0, 80);
  const path = `${folder}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from('captures').upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('captures').getPublicUrl(path);
  return data.publicUrl;
}
