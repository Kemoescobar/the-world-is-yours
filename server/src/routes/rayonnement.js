import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createRayonnementSchema } from '../schemas.js';
import { incrementerStreak } from './streaks.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  let query = supabase
    .from('rayonnement_evenements')
    .select('*')
    .order('date_evenement', { ascending: false });
  if (req.query.type) query = query.eq('type', req.query.type);
  if (req.query.arc) query = query.eq('arc_id', req.query.arc);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/stats', async (req, res) => {
  const { data, error } = await supabase.from('rayonnement_evenements').select('type, date_evenement');
  if (error) return res.status(500).json({ error: error.message });
  const parType = {};
  for (const e of data || []) {
    parType[e.type] = (parType[e.type] || 0) + 1;
  }
  const { data: streak } = await supabase.from('streaks').select('*').eq('id', 'rayonnement').maybeSingle();
  res.json({ ok: true, total: (data || []).length, parType, streak: streak || null });
});

router.post('/', validateBody(createRayonnementSchema), async (req, res) => {
  const { data, error } = await supabase
    .from('rayonnement_evenements')
    .insert(req.body)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  const streak = await incrementerStreak('rayonnement');
  res.status(201).json({ ...data, streak });
});

export default router;
