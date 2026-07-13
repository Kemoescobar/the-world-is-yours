import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createEntreeSchema } from '../schemas.js';
import { incrementerStreak } from './streaks.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  let query = supabase.from('entrees').select('*').order('cree_le', { ascending: false }).limit(200);
  if (req.query.arc) query = query.eq('arc_id', req.query.arc);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', validateBody(createEntreeSchema), async (req, res) => {
  const { arc_id, type_fait, detail, quete_id } = req.body;

  const { data, error } = await supabase
    .from('entrees')
    .insert({
      arc_id: arc_id || null,
      type_fait,
      detail: detail || null,
      quete_id: quete_id || null,
      source: 'manuel',
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  const streakParArc = { dev: 'dev', beatmaker: 'miprod' };
  if (type_fait === 'sport') await incrementerStreak('sport');
  else if (streakParArc[arc_id]) await incrementerStreak(streakParArc[arc_id]);

  res.status(201).json(data);
});

export default router;
