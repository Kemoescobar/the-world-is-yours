import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth, resolveOwnerFromBearer } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createInstrumentalSchema } from '../schemas.js';

const router = express.Router();

// Lecture publique : showcase uniquement. Owner JWT vérifié → tout.
router.get('/', async (req, res) => {
  const owner = await resolveOwnerFromBearer(req);
  let query = supabase.from('instrumentaux').select('*').order('cree_le', { ascending: false });
  if (!owner) {
    query = query.eq('statut', 'showcase');
  } else if (req.query.statut) {
    query = query.eq('statut', req.query.statut);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.setHeader('Cache-Control', owner ? 'private, no-store' : 'public, max-age=60');
  res.json(data);
});

router.post('/', requireAuth, validateBody(createInstrumentalSchema), async (req, res) => {
  const { data, error } = await supabase.from('instrumentaux').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
