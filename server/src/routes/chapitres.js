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
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/** Clôture + titre Claude (Phase 3). */
router.post('/:id/cloturer', async (req, res) => {
  const { id } = req.params;
  const { data: chap, error } = await supabase.from('chapitres').select('*').eq('id', id).single();
  if (error || !chap) return res.status(404).json({ error: 'chapitre introuvable' });

  if (!anthropicConfigured()) {
    const { data, error: upErr } = await supabase
      .from('chapitres')
      .update({ statut: 'clos' })
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

export default router;
