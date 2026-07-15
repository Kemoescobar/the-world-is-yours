import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth, resolveOwnerFromBearer } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createProjetSchema, patchProjetSchema } from '../schemas.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const owner = await resolveOwnerFromBearer(req);
  let query = supabase.from('projets_dev').select('*').order('cree_le', { ascending: false });
  if (!owner) {
    query = query.eq('statut', 'shippe');
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.setHeader('Cache-Control', owner ? 'private, no-store' : 'public, max-age=60');
  res.json(data);
});

router.post('/', requireAuth, validateBody(createProjetSchema), async (req, res) => {
  const { data, error } = await supabase.from('projets_dev').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', requireAuth, validateBody(patchProjetSchema), async (req, res) => {
  if (!Object.keys(req.body).length) {
    return res.status(400).json({ error: 'aucune modification' });
  }
  const { data, error } = await supabase
    .from('projets_dev')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return res.status(404).json({ error: 'projet introuvable' });
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

export default router;
