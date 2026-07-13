import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createMouvementSchema, createObjectifSchema, patchObjectifSchema } from '../schemas.js';

const router = express.Router();

router.use(requireAuth);

router.get('/solde', async (req, res) => {
  const { data, error } = await supabase.from('portefeuille_mouvements').select('montant, devise');
  if (error) return res.status(500).json({ error: error.message });

  const solde = data.reduce((acc, m) => {
    acc[m.devise] = (acc[m.devise] || 0) + Number(m.montant);
    return acc;
  }, {});
  res.json(solde);
});

router.get('/mouvements', async (req, res) => {
  const { data, error } = await supabase
    .from('portefeuille_mouvements')
    .select('*')
    .order('date_mouvement', { ascending: false })
    .limit(200);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/mouvements', validateBody(createMouvementSchema), async (req, res) => {
  const { data, error } = await supabase.from('portefeuille_mouvements').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.get('/objectifs', async (req, res) => {
  const { data, error } = await supabase.from('objectifs_epargne').select('*').order('date_cible', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/objectifs', validateBody(createObjectifSchema), async (req, res) => {
  const { data, error } = await supabase.from('objectifs_epargne').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/objectifs/:id', validateBody(patchObjectifSchema), async (req, res) => {
  const { data, error } = await supabase
    .from('objectifs_epargne')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
