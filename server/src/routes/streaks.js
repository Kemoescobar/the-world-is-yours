import express from 'express';
import { supabase } from '../supabaseClient.js';
import { jourLocal, hierLocal } from '../lib/dates.js';
import { requireAuthOrApiKey } from '../middleware/auth.js';
import { evaluerRupturesStreak, marquerReprise } from '../lib/streaksLogic.js';

const router = express.Router();

router.get('/', requireAuthOrApiKey, async (req, res) => {
  // Évalue les ruptures à chaque lecture (cheap, mono-user)
  await evaluerRupturesStreak();

  const { data, error } = await supabase.from('streaks').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * Incrémente un streak (fuseau TZ Madagascar).
 * Si reprise après rupture → chapitres rompus → 'reprise'.
 */
export async function incrementerStreak(streakId) {
  const { data: streak, error: readErr } = await supabase
    .from('streaks')
    .select('*')
    .eq('id', streakId)
    .single();
  if (readErr || !streak) return { ok: false, reason: 'not_found' };

  const aujourdhui = jourLocal();
  if (streak.dernier_jour === aujourdhui) {
    return { ok: true, skipped: true, jours: streak.jours_consecutifs };
  }

  const hier = hierLocal();
  const etaitRompu = streak.dernier_jour && streak.dernier_jour !== hier && streak.dernier_jour !== aujourdhui;
  const suite = streak.dernier_jour === hier ? streak.jours_consecutifs + 1 : 1;
  const record = Math.max(suite, streak.record ?? 0);

  const { data: updated, error } = await supabase
    .from('streaks')
    .update({
      jours_consecutifs: suite,
      dernier_jour: aujourdhui,
      record,
    })
    .eq('id', streakId)
    .neq('dernier_jour', aujourdhui)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[streak]', streakId, error.message);
    return { ok: false, reason: error.message };
  }

  if (etaitRompu || (suite === 1 && streak.jours_consecutifs === 0)) {
    await marquerReprise(streakId);
  }

  return {
    ok: true,
    skipped: !updated,
    jours: updated?.jours_consecutifs ?? suite,
    reprise: Boolean(etaitRompu),
  };
}

export default router;
