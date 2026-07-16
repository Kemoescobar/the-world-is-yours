import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuthOrApiKey } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createQueteSchema, patchQueteSchema } from '../schemas.js';
import { incrementerStreak } from './streaks.js';

const router = express.Router();

router.use(requireAuthOrApiKey);

router.get('/', async (req, res) => {
  let query = supabase.from('quetes').select('*').order('date_prevue', { ascending: true });
  if (req.query.type) query = query.eq('type', req.query.type);
  if (req.query.statut) query = query.eq('statut', req.query.statut);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', validateBody(createQueteSchema), async (req, res) => {
  const row = { ...req.body };
  // Rattache au chapitre ouvert de l’arc (même heuristique que Chantier / ravitaillement)
  if (!row.chapitre_id && row.type && ['dev', 'beatmaker', 'croisement'].includes(row.type)) {
    const { data: chaps } = await supabase
      .from('chapitres')
      .select('id, date_debut')
      .eq('arc_id', row.type)
      .order('date_debut', { ascending: false })
      .limit(1);
    if (chaps?.[0]?.id) row.chapitre_id = chaps[0].id;
  }
  const { data, error } = await supabase.from('quetes').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', validateBody(patchQueteSchema), async (req, res) => {
  const before = await supabase.from('quetes').select('*').eq('id', req.params.id).single();
  if (before.error || !before.data) {
    return res.status(404).json({ error: 'quête introuvable' });
  }

  // Compétence liée : ne passer en « fait » que s'il existe au moins une preuve
  const competenceCible = req.body.competence_id ?? before.data.competence_id;
  const veutValider = req.body.statut === 'fait' && before.data.statut !== 'fait';
  if (veutValider && competenceCible) {
    const { data: preuves } = await supabase
      .from('competences_preuves')
      .select('id')
      .eq('competence_id', competenceCible)
      .limit(1);
    if (!preuves?.length) {
      return res.status(400).json({
        error: 'preuve requise : ajoute une preuve (repo/track/cert) avant de valider cette compétence',
      });
    }
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
