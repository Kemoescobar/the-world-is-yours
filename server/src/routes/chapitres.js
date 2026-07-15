import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { askClaude, anthropicConfigured } from '../lib/claude.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  let query = supabase.from('chapitres').select('*').order('date_debut', { ascending: false });
  if (req.query.arc) query = query.eq('arc_id', req.query.arc);
  if (req.query.saison) query = query.eq('saison_id', req.query.saison);
  if (req.query.ere) query = query.eq('ere_id', req.query.ere);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/** Clôture + titre Claude (Phase 3). Si ere_id, peut créer un brouillon apprentissage. */
router.post('/:id/cloturer', async (req, res) => {
  const { id } = req.params;
  const { data: chap, error } = await supabase.from('chapitres').select('*').eq('id', id).single();
  if (error || !chap) return res.status(404).json({ error: 'chapitre introuvable' });

  const closePayload = { statut: 'clos' };
  if (!anthropicConfigured()) {
    const { data, error: upErr } = await supabase
      .from('chapitres')
      .update(closePayload)
      .eq('id', id)
      .select()
      .single();
    if (upErr) return res.status(500).json({ error: upErr.message });
    return res.json({ ok: true, chapitre: data, ia: false, note: 'clos sans titre IA (pas de clé)' });
  }

  try {
    const { data: entrees } = await supabase
      .from('entrees')
      .select('*')
      .eq('arc_id', chap.arc_id)
      .order('cree_le', { ascending: false })
      .limit(25);

    const { text } = await askClaude(
      'Titre de chapitre Chroniques TWIY. JSON only: {"titre":"...","resume_public":"..."}',
      JSON.stringify({ chapitre: chap, entrees: entrees || [] }),
      350,
    );
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : text);

    const { data, error: upErr } = await supabase
      .from('chapitres')
      .update({
        titre: parsed.titre || chap.titre,
        resume_public: parsed.resume_public || chap.resume_public,
        statut: 'clos',
      })
      .eq('id', id)
      .select()
      .single();
    if (upErr) return res.status(500).json({ error: upErr.message });
    res.json({ ok: true, chapitre: data, ia: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  const allowed = {};
  if (req.body?.ere_id !== undefined) allowed.ere_id = req.body.ere_id;
  if (req.body?.titre !== undefined) allowed.titre = req.body.titre;
  if (req.body?.resume_public !== undefined) allowed.resume_public = req.body.resume_public;
  if (req.body?.statut !== undefined) allowed.statut = req.body.statut;
  if (!Object.keys(allowed).length) return res.status(400).json({ error: 'rien à mettre à jour' });

  const { data, error } = await supabase
    .from('chapitres')
    .update(allowed)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
