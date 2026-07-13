import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createQueteSchema, patchQueteSchema } from '../schemas.js';
import { incrementerStreak } from './streaks.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  let query = supabase.from('quetes').select('*').order('date_prevue', { ascending: true });
  if (req.query.type) query = query.eq('type', req.query.type);
  if (req.query.statut) query = query.eq('statut', req.query.statut);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', validateBody(createQueteSchema), async (req, res) => {
  const { data, error } = await supabase.from('quetes').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', validateBody(patchQueteSchema), async (req, res) => {
  const before = await supabase.from('quetes').select('*').eq('id', req.params.id).single();
  if (before.error || !before.data) {
    return res.status(404).json({ error: 'quête introuvable' });
  }

  const { data, error } = await supabase
    .from('quetes')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  const champs = Object.keys(req.body);
  if (champs.length) {
    const historique = champs.map((champ) => ({
      quete_id: req.params.id,
      champ_modifie: champ,
      ancienne_valeur: String(before.data[champ] ?? ''),
      nouvelle_valeur: String(req.body[champ] ?? ''),
    }));
    const hist = await supabase.from('quetes_historique').insert(historique);
    if (hist.error) console.error('[quetes_historique]', hist.error.message);
  }

  // Idempotence : ne créer une entrée + streak que lors de la *transition* vers 'fait'
  const vientDePasserAFait = req.body.statut === 'fait' && before.data.statut !== 'fait';
  if (vientDePasserAFait) {
    const arcId = data.type === 'freelance' || data.type === 'routine' ? null : data.type;
    const { error: entreeErr } = await supabase.from('entrees').insert({
      quete_id: data.id,
      arc_id: arcId,
      type_fait: data.type === 'routine' ? 'sport' : 'quete',
      detail: data.titre,
      source: 'manuel',
    });
    if (entreeErr) console.error('[entree quete]', entreeErr.message);

    const streakParType = { dev: 'dev', beatmaker: 'miprod', routine: 'sport' };
    if (streakParType[data.type]) {
      const r = await incrementerStreak(streakParType[data.type]);
      if (!r.ok) console.error('[streak quete]', r.reason);
    }
  }

  res.json(data);
});

export default router;
