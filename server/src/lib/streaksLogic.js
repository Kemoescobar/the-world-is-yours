import { jourLocal, hierLocal } from '../lib/dates.js';
import { supabase } from '../supabaseClient.js';

/** Mapping piste streak → arc chapitre à marquer rompu. */
const STREAK_VERS_ARC = {
  dev: 'dev',
  miprod: 'beatmaker',
  // sport : pas d'arc dédié — pas de chapitre rompu
};

/**
 * Si dernier_jour < hier (trou d'au moins 1 jour), le streak est rompu.
 * Marque les chapitres en_cours de l'arc correspondant en statut 'rompu'.
 */
export async function evaluerRupturesStreak() {
  const aujourdhui = jourLocal();
  const hier = hierLocal();
  const { data: streaks, error } = await supabase.from('streaks').select('*');
  if (error || !streaks) {
    console.error('[evaluerRuptures]', error?.message);
    return { ok: false };
  }

  const rompus = [];

  for (const streak of streaks) {
    if (!streak.dernier_jour) continue;
    // Toujours actif aujourd'hui ou hier → pas rompu
    if (streak.dernier_jour === aujourdhui || streak.dernier_jour === hier) continue;
    // Pas d'activité depuis avant hier → rupture
    if (streak.jours_consecutifs === 0) continue;

    const arcId = STREAK_VERS_ARC[streak.id];
    // Reset compteur local (le record est conservé)
    await supabase
      .from('streaks')
      .update({ jours_consecutifs: 0 })
      .eq('id', streak.id)
      .gt('jours_consecutifs', 0);

    if (!arcId) {
      rompus.push({ streak: streak.id, arc: null });
      continue;
    }

    const { data: chapitres } = await supabase
      .from('chapitres')
      .update({ statut: 'rompu' })
      .eq('arc_id', arcId)
      .eq('statut', 'en_cours')
      .select('id, titre');

    rompus.push({ streak: streak.id, arc: arcId, chapitres: chapitres || [] });
  }

  return { ok: true, rompus };
}

/**
 * Après un nouvel incrément suite à une rupture (suite === 1 alors qu'il y avait un trou),
 * passe les chapitres 'rompu' de l'arc en 'reprise'.
 */
export async function marquerReprise(streakId) {
  const arcId = STREAK_VERS_ARC[streakId];
  if (!arcId) return;

  const { error } = await supabase
    .from('chapitres')
    .update({ statut: 'reprise' })
    .eq('arc_id', arcId)
    .eq('statut', 'rompu');

  if (error) console.error('[reprise]', error.message);
}
