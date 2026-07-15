import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createCompetenceSchema, createPreuveSchema, patchCompetenceSchema } from '../schemas.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  let query = supabase.from('competences').select('*').order('source_roadmap', { ascending: true });
  if (req.query.arc) query = query.eq('arc_id', req.query.arc);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('competences').select('*').eq('id', req.params.id).single();
  if (error || !data) return res.status(404).json({ error: 'compétence introuvable' });
  const preuves = await supabase
    .from('competences_preuves')
    .select('*')
    .eq('competence_id', req.params.id)
    .order('date_validation', { ascending: false });
  res.json({ ...data, preuves: preuves.data || [] });
});

router.get('/:id/preuves', async (req, res) => {
  const { data, error } = await supabase
    .from('competences_preuves')
    .select('*')
    .eq('competence_id', req.params.id)
    .order('date_validation', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', validateBody(createCompetenceSchema), async (req, res) => {
  const { data, error } = await supabase.from('competences').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', validateBody(patchCompetenceSchema), async (req, res) => {
  const { data, error } = await supabase
    .from('competences')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/:id/preuves', validateBody(createPreuveSchema), async (req, res) => {
  const competenceId = req.params.id;
  const { data: comp } = await supabase.from('competences').select('id').eq('id', competenceId).single();
  if (!comp) return res.status(404).json({ error: 'compétence introuvable' });

  const { type, reference_id, url } = req.body;
  if (!reference_id && !url) {
    return res.status(400).json({ error: 'preuve requiert reference_id ou url' });
  }

  if (reference_id) {
    if (type === 'repo') {
      const { data: p } = await supabase.from('projets_dev').select('id').eq('id', reference_id).maybeSingle();
      if (!p) return res.status(400).json({ error: 'reference_id : projet_dev introuvable' });
    }
    if (type === 'track') {
      const { data: t } = await supabase.from('instrumentaux').select('id').eq('id', reference_id).maybeSingle();
      if (!t) return res.status(400).json({ error: 'reference_id : instrumental introuvable' });
    }
  }

  const { data, error } = await supabase
    .from('competences_preuves')
    .insert({
      competence_id: competenceId,
      type,
      reference_id: reference_id || null,
      url: url || null,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
