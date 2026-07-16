import express from 'express';
import { randomUUID } from 'crypto';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createEreSchema, patchEreSchema } from '../schemas.js';

const router = express.Router();
router.use(requireAuth);

function normalizeObjectifs(objectifs) {
  if (!Array.isArray(objectifs)) return [];
  return objectifs.map((o) => ({
    id: o.id || randomUUID(),
    titre: o.titre || '',
    description: o.description || '',
    metrique_cible: o.metrique_cible ?? null,
    metrique_actuelle: o.metrique_actuelle ?? 0,
  }));
}

router.get('/', async (req, res) => {
  let query = supabase.from('eres').select('*').order('date_debut', { ascending: false });
  if (req.query.statut) query = query.eq('statut', req.query.statut);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/active', async (req, res) => {
  const { data, error } = await supabase
    .from('eres')
    .select('*')
    .eq('statut', 'active')
    .order('date_debut', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/** Flag doux : quêtes sans ere_objectif_id sur période (défaut 14j). */
router.get('/dispersion', async (req, res) => {
  const jours = Math.min(90, Math.max(1, Number(req.query.jours) || 14));
  const debut = new Date();
  debut.setDate(debut.getDate() - jours);
  const iso = debut.toISOString().slice(0, 10);

  const { data: ere } = await supabase
    .from('eres')
    .select('*')
    .eq('statut', 'active')
    .order('date_debut', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Never alarm without an active Ère — frontend also guards on `ere`
  if (!ere) {
    return res.json({
      ok: true,
      ere: null,
      dispersion: false,
      sans_objectif: [],
      total_periode: 0,
      jours,
      note: 'aucune ère active',
    });
  }

  const { data: quetes, error } = await supabase
    .from('quetes')
    .select('*')
    .neq('statut', 'abandonne')
    .or(`date_prevue.gte.${iso},cree_le.gte.${debut.toISOString()}`);
  if (error) return res.status(500).json({ error: error.message });

  const sans = (quetes || []).filter((q) => !q.ere_objectif_id);
  res.json({
    ok: true,
    ere,
    dispersion: sans.length > 0,
    sans_objectif: sans,
    total_periode: (quetes || []).length,
    jours,
  });
});

router.post('/', validateBody(createEreSchema), async (req, res) => {
  const body = {
    ...req.body,
    objectifs: normalizeObjectifs(req.body.objectifs || []),
  };
  const { data, error } = await supabase.from('eres').insert(body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', validateBody(patchEreSchema), async (req, res) => {
  const body = { ...req.body };
  if (body.objectifs) body.objectifs = normalizeObjectifs(body.objectifs);
  const { data, error } = await supabase
    .from('eres')
    .update(body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/** Clôture ère → entrée Drop type bilan_ere + lien bilan_drop_id. */
router.post('/:id/cloturer', async (req, res) => {
  const { id } = req.params;
  const { data: ere, error } = await supabase.from('eres').select('*').eq('id', id).single();
  if (error || !ere) return res.status(404).json({ error: 'ère introuvable' });
  if (ere.statut === 'cloturee' && ere.bilan_drop_id) {
    return res.json({ ok: true, ere, deja: true });
  }

  const detail = req.body?.detail
    || `Bilan Ère — ${ere.nom} (${ere.date_debut} → ${ere.date_fin})`;

  const { data: entree, error: eErr } = await supabase
    .from('entrees')
    .insert({
      type_fait: 'bilan_ere',
      detail,
      source: 'ere_cloture',
      arc_id: null,
    })
    .select()
    .single();
  if (eErr) return res.status(500).json({ error: eErr.message });

  const { data: updated, error: uErr } = await supabase
    .from('eres')
    .update({ statut: 'cloturee', bilan_drop_id: entree.id })
    .eq('id', id)
    .select()
    .single();
  if (uErr) return res.status(500).json({ error: uErr.message });

  res.json({ ok: true, ere: updated, drop: entree });
});

export default router;
