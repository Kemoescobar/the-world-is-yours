import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createInstrumentalSchema } from '../schemas.js';

const router = express.Router();

// Lecture publique : showcase uniquement. Auth → tout.
router.get('/', async (req, res) => {
  const authHeader = req.header('authorization');
  let query = supabase.from('instrumentaux').select('*').order('cree_le', { ascending: false });
  if (!authHeader) {
    query = query.eq('statut', 'showcase');
  } else {
    // Si token invalide, on reste en mode public plutôt que 401 sur GET vitrine
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) query = query.eq('statut', 'showcase');
  }
  if (req.query.statut) query = query.eq('statut', req.query.statut);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAuth, validateBody(createInstrumentalSchema), async (req, res) => {
  const { data, error } = await supabase.from('instrumentaux').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
