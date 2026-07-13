import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createProjetSchema } from '../schemas.js';

const router = express.Router();

router.get('/', async (req, res) => {
  let query = supabase.from('projets_dev').select('*').order('cree_le', { ascending: false });
  if (!req.header('authorization')) {
    query = query.eq('statut', 'shippe');
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAuth, validateBody(createProjetSchema), async (req, res) => {
  const { data, error } = await supabase.from('projets_dev').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
