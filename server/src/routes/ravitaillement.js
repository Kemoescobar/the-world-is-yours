import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuthOrApiKey } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { ravitaillementRepondreSchema, ravitaillementProposerSchema } from '../schemas.js';
import {
  ARCS_RAVITAILLEMENT,
  ACTIVES_TRIGGER,
  preparerPropositionArc,
  quetesActivesArc,
  labelArc,
} from '../lib/ravitaillement.js';

const router = express.Router();
router.use(requireAuthOrApiKey);

async function chargerContexte() {
  const [comps, quetes, preuves] = await Promise.all([
    supabase.from('competences').select('*').in('arc_id', ARCS_RAVITAILLEMENT),
    supabase.from('quetes').select('*'),
    supabase.from('competences_preuves').select('competence_id'),
  ]);
  if (comps.error) throw new Error(comps.error.message);
  if (quetes.error) throw new Error(quetes.error.message);
  if (preuves.error) throw new Error(preuves.error.message);
  return {
    competences: comps.data || [],
    quetes: quetes.data || [],
    preuves: preuves.data || [],
  };
}

async function propositionsActives() {
  const { data, error } = await supabase
    .from('ravitaillement_propositions')
    .select('*')
    .eq('statut', 'proposee')
    .order('date_proposition', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

/** État par arc + propositions ouvertes (sans créer). */
router.get('/status', async (req, res) => {
  try {
    const ctx = await chargerContexte();
    const actives = await propositionsActives();
    const arcs = {};
    for (const arcId of ARCS_RAVITAILLEMENT) {
      const n = quetesActivesArc(ctx.quetes, arcId).length;
      const prep = preparerPropositionArc({
        arcId,
        competences: ctx.competences,
        quetes: ctx.quetes,
        preuves: ctx.preuves,
      });
      arcs[arcId] = {
        actives: n,
        besoin_ravitaillement: n <= ACTIVES_TRIGGER,
        roadmap_terminee: Boolean(prep.roadmap_terminee),
        message: prep.message || null,
      };
    }
    res.json({
      ok: true,
      arcs,
      propositions: actives,
      skip_croisement: true,
      note: 'Croisement hors scope — arbre non peuplé',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/actif', async (req, res) => {
  try {
    const list = await propositionsActives();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Propose des brouillons si ≤1 quête active sur l'arc.
 * Jamais d'insert quetes ici — statut proposee seulement.
 */
router.post('/proposer', validateBody(ravitaillementProposerSchema), async (req, res) => {
  try {
    const arcsDemandes = req.body?.arc_id
      ? [req.body.arc_id]
      : ARCS_RAVITAILLEMENT;

    const ctx = await chargerContexte();
    const existantes = await propositionsActives();
    const byArc = Object.fromEntries(existantes.map((p) => [p.arc_id, p]));
    const creees = [];
    const signaux = [];

    for (const arcId of arcsDemandes) {
      if (!ARCS_RAVITAILLEMENT.includes(arcId)) {
        signaux.push({ arc_id: arcId, skip: true, note: 'hors scope (ex. croisement)' });
        continue;
      }

      if (byArc[arcId]) {
        creees.push({ ...byArc[arcId], deja: true });
        continue;
      }

      const prep = preparerPropositionArc({
        arcId,
        competences: ctx.competences,
        quetes: ctx.quetes,
        preuves: ctx.preuves,
      });

      if (!prep.trigger) {
        signaux.push({ arc_id: arcId, trigger: false, actives: prep.actives, note: prep.note });
        continue;
      }

      if (prep.roadmap_terminee) {
        signaux.push({
          arc_id: arcId,
          roadmap_terminee: true,
          message: prep.message,
          actives: prep.actives,
        });
        continue;
      }

      const { data, error } = await supabase
        .from('ravitaillement_propositions')
        .insert({
          arc_id: arcId,
          competence_id: prep.competence.id,
          drafts: prep.drafts,
          statut: 'proposee',
          note: `Remplir jusqu'à ${prep.cible} actifs · ${labelArc(arcId)} · ${prep.competence.titre}`,
        })
        .select()
        .single();

      if (error) {
        if (String(error.message || '').includes('uniq_ravitaillement_proposee_arc')) {
          const again = await propositionsActives();
          const hit = again.find((p) => p.arc_id === arcId);
          if (hit) creees.push({ ...hit, deja: true });
          continue;
        }
        return res.status(500).json({ error: error.message });
      }
      creees.push(data);
    }

    res.status(creees.length ? 201 : 200).json({
      ok: true,
      propositions: creees,
      signaux,
      skip_croisement: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/repondre', validateBody(ravitaillementRepondreSchema), async (req, res) => {
  const action = req.body.action;
  const { data: prop, error: pErr } = await supabase
    .from('ravitaillement_propositions')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (pErr || !prop) return res.status(404).json({ error: 'proposition introuvable' });
  if (prop.statut !== 'proposee') {
    return res.status(400).json({ error: `déjà ${prop.statut}` });
  }

  if (action === 'refuser') {
    const { data, error } = await supabase
      .from('ravitaillement_propositions')
      .update({ statut: 'refusee', date_reponse: new Date().toISOString() })
      .eq('id', prop.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, proposition: data, quetes: [] });
  }

  // accepter → créer les quêtes (seul moment d'insert)
  const drafts = Array.isArray(prop.drafts) ? prop.drafts : [];
  if (!drafts.length) {
    return res.status(400).json({ error: 'aucun brouillon à accepter' });
  }

  const rows = drafts.map((d) => ({
    type: d.type || prop.arc_id,
    titre: d.titre,
    statut: 'a_faire',
    competence_id: d.competence_id || prop.competence_id,
  }));

  const { data: quetes, error: qErr } = await supabase.from('quetes').insert(rows).select();
  if (qErr) return res.status(500).json({ error: qErr.message });

  const { data: updated, error: uErr } = await supabase
    .from('ravitaillement_propositions')
    .update({ statut: 'acceptee', date_reponse: new Date().toISOString() })
    .eq('id', prop.id)
    .select()
    .single();
  if (uErr) return res.status(500).json({ error: uErr.message });

  res.status(201).json({ ok: true, proposition: updated, quetes: quetes || [] });
});

export default router;
