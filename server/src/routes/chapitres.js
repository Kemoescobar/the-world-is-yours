import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  let query = supabase.from('chapitres').select('*').order('date_debut', { ascending: false });
  if (req.query.arc) query = query.eq('arc_id', req.query.arc);
  if (req.query.saison) query = query.eq('saison_id', req.query.saison);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/:id/cloturer', async (req, res) => {
  res.status(501).json({ todo: 'génération de titre de chapitre via Claude — Phase 3' });
});

export default router;
