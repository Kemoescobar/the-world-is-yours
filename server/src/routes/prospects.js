import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createProspectSchema, patchProspectSchema } from '../schemas.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('prospects').select('*').order('date_maj', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', validateBody(createProspectSchema), async (req, res) => {
  const { data, error } = await supabase.from('prospects').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', validateBody(patchProspectSchema), async (req, res) => {
  const { data, error } = await supabase
    .from('prospects')
    .update({ ...req.body, date_maj: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
