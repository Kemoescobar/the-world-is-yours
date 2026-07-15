import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createApprentissageSchema, patchApprentissageSchema } from '../schemas.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  let query = supabase.from('apprentissages').select('*').order('cree_le', { ascending: false });
  if (req.query.arc) query = query.eq('arc_id', req.query.arc);
  if (req.query.type) query = query.eq('type', req.query.type);
  if (req.query.depuis) query = query.gte('cree_le', req.query.depuis);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', validateBody(createApprentissageSchema), async (req, res) => {
  const { data, error } = await supabase.from('apprentissages').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', validateBody(patchApprentissageSchema), async (req, res) => {
  const { data, error } = await supabase
    .from('apprentissages')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/** Ressort un apprentissage proche (tags/titre) et incrémente reutilise_count. */
router.post('/ressortir', async (req, res) => {
  const q = String(req.body?.q || '').trim().toLowerCase();
  const arcId = req.body?.arc_id || null;
  if (!q) return res.status(400).json({ error: 'q requis' });

  let query = supabase.from('apprentissages').select('*').order('cree_le', { ascending: false }).limit(80);
  if (arcId) query = query.eq('arc_id', arcId);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const tokens = q.split(/\s+/).filter((t) => t.length > 2);
  const scored = (data || [])
    .map((a) => {
      const hay = `${a.titre} ${a.contenu} ${(a.tags || []).join(' ')}`.toLowerCase();
      const score = tokens.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0);
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score);

  if (!scored.length) return res.json({ ok: true, match: null });

  const match = scored[0].a;
  await supabase
    .from('apprentissages')
    .update({ reutilise_count: (match.reutilise_count || 0) + 1 })
    .eq('id', match.id);

  res.json({ ok: true, match: { ...match, reutilise_count: (match.reutilise_count || 0) + 1 } });
});

export default router;
