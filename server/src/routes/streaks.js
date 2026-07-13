import express from 'express';
import { supabase } from '../supabaseClient.js';
import { jourLocal, hierLocal } from '../lib/dates.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('streaks').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * Incrémente un streak de façon conditionnelle (évite double-compte le même jour local).
 * Utilise le fuseau TZ (Indian/Antananarivo par défaut).
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
  const suite = streak.dernier_jour === hier ? streak.jours_consecutifs + 1 : 1;
  const record = Math.max(suite, streak.record ?? 0);

  // Update conditionnel : n'écrit que si dernier_jour n'est pas déjà aujourd'hui (anti race)
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

  return { ok: true, skipped: !updated, jours: updated?.jours_consecutifs ?? suite };
}

export default router;
