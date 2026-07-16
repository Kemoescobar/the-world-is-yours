import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuthOrApiKey } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  ravitaillementRepondreSchema,
  ravitaillementProposerSchema,
  ravitaillementRepondreLotSchema,
  ravitaillementAutoSchema,
} from '../schemas.js';
import {
  ARCS_RAVITAILLEMENT,
  ACTIVES_TARGET,
  preparerPropositionArc,
  quetesActivesArc,
  chapitreCourantArc,
  labelArc,
  messageDepuisSignaux,
} from '../lib/ravitaillement.js';

const router = express.Router();
router.use(requireAuthOrApiKey);

/** Debounce in-memory : seulement après create réussi ; 10 s pour ne pas bloquer un retry vide. */
const lastAutoByArc = new Map();
const AUTO_DEBOUNCE_MS = 10_000;

async function chargerContexte() {
  const [comps, quetes, preuves, chapitres] = await Promise.all([
    supabase.from('competences').select('*').in('arc_id', ARCS_RAVITAILLEMENT),
    supabase.from('quetes').select('*'),
    supabase.from('competences_preuves').select('competence_id'),
    supabase.from('chapitres').select('*').in('arc_id', ARCS_RAVITAILLEMENT),
  ]);
  if (comps.error) throw new Error(comps.error.message);
  if (quetes.error) throw new Error(quetes.error.message);
  if (preuves.error) throw new Error(preuves.error.message);
  if (chapitres.error) throw new Error(chapitres.error.message);
  return {
    competences: comps.data || [],
    quetes: quetes.data || [],
    preuves: preuves.data || [],
    chapitres: chapitres.data || [],
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

/** Marque les anciennes propositions ouvertes comme obsolètes (chemin auto). */
async function archiverPropositionsOuvertes() {
  const props = await propositionsActives();
  if (!props.length) return [];
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('ravitaillement_propositions')
    .update({ statut: 'refusee', date_reponse: now, note: 'obsolète — ravitaillement auto' })
    .eq('statut', 'proposee')
    .select();
  if (error) throw new Error(error.message);
  return data || [];
}

function chapitreIdPourArc(chapitres, arcId) {
  return chapitreCourantArc(chapitres, arcId)?.id ?? null;
}

/**
 * Remplit jusqu’à ACTIVES_TARGET pour les arcs needy — insert direct en quetes.
 * Compte les actifs du chapitre courant seulement. Debounce 10 s après create réussi.
 */
async function autoRemplirArcs(arcsDemandes) {
  const ctx = await chargerContexte();
  await archiverPropositionsOuvertes();

  const creees = [];
  const signaux = [];
  const now = Date.now();

  for (const arcId of arcsDemandes) {
    if (!ARCS_RAVITAILLEMENT.includes(arcId)) {
      signaux.push({ arc_id: arcId, skip: true, note: 'hors scope (ex. croisement)' });
      continue;
    }

    const chapitreId = chapitreIdPourArc(ctx.chapitres, arcId);
    const last = lastAutoByArc.get(arcId) || 0;
    if (now - last < AUTO_DEBOUNCE_MS) {
      const n = quetesActivesArc(ctx.quetes, arcId, { chapitreId }).length;
      signaux.push({
        arc_id: arcId,
        debounce: true,
        actives: n,
        note: 'auto récent (< 10 s) — skip',
      });
      continue;
    }

    const prep = preparerPropositionArc({
      arcId,
      competences: ctx.competences,
      quetes: ctx.quetes,
      preuves: ctx.preuves,
      chapitres: ctx.chapitres,
    });

    if (!prep.trigger) {
      signaux.push({ arc_id: arcId, trigger: false, actives: prep.actives, note: prep.note });
      continue;
    }

    if (prep.bloque_prereqs) {
      signaux.push({
        arc_id: arcId,
        bloque_prereqs: true,
        message: prep.message,
        actives: prep.actives,
      });
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

    const rows = prep.drafts.map((d) => ({
      type: d.type || arcId,
      titre: d.titre,
      statut: 'a_faire',
      competence_id: d.competence_id,
      chapitre_id: prep.chapitre_id || null,
    }));

    const { data: quetes, error: qErr } = await supabase.from('quetes').insert(rows).select();
    if (qErr) throw new Error(qErr.message);

    // Debounce uniquement après create réussi (pas sur attempt vide / bloqué)
    lastAutoByArc.set(arcId, now);
    const inserted = quetes || [];
    creees.push(...inserted);

    ctx.quetes.push(...inserted);

    signaux.push({
      arc_id: arcId,
      created: inserted.length,
      actives_apres: quetesActivesArc(ctx.quetes, arcId, { chapitreId: prep.chapitre_id }).length,
      competence: prep.competence?.titre || null,
      note: `auto · lot ×${inserted.length} · ${labelArc(arcId)}`,
    });
  }

  return { creees, signaux };
}

/** État par arc (sans créer). */
router.get('/status', async (req, res) => {
  try {
    const ctx = await chargerContexte();
    const arcs = {};
    for (const arcId of ARCS_RAVITAILLEMENT) {
      const chapitreId = chapitreIdPourArc(ctx.chapitres, arcId);
      const n = quetesActivesArc(ctx.quetes, arcId, { chapitreId }).length;
      const prep = preparerPropositionArc({
        arcId,
        competences: ctx.competences,
        quetes: ctx.quetes,
        preuves: ctx.preuves,
        chapitres: ctx.chapitres,
      });
      arcs[arcId] = {
        actives: n,
        chapitre_id: chapitreId,
        besoin_ravitaillement: n < ACTIVES_TARGET,
        cible: ACTIVES_TARGET,
        manquants: Math.max(0, ACTIVES_TARGET - n),
        roadmap_terminee: Boolean(prep.roadmap_terminee),
        bloque_prereqs: Boolean(prep.bloque_prereqs),
        message: prep.message || null,
      };
    }
    res.json({
      ok: true,
      mode: 'auto',
      arcs,
      skip_croisement: true,
      note: 'Ravitaillement auto — pas de propositions à accepter',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Legacy : listait les propositions — désormais vide (chemin auto). */
router.get('/actif', async (req, res) => {
  try {
    const list = await propositionsActives();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Auto-ravitaillement : crée directement les quêtes (lots ×3 / refill à 3)
 * pour tous les arcs needy Dev + Beatmaker. Pas de proposition UI.
 */
router.post('/auto', validateBody(ravitaillementAutoSchema), async (req, res) => {
  try {
    const arcsDemandes = req.body?.arc_id
      ? [req.body.arc_id]
      : ARCS_RAVITAILLEMENT;

    const { creees, signaux } = await autoRemplirArcs(arcsDemandes);
    const terminees = signaux.filter((s) => s.roadmap_terminee).map((s) => s.message);
    const message = messageDepuisSignaux(signaux, creees.length);
    const rienAFaire = !creees.length && !terminees.length
      && !signaux.some((s) => s.bloque_prereqs);

    res.status(creees.length ? 201 : 200).json({
      ok: true,
      mode: 'auto',
      quetes: creees,
      total_ajoutees: creees.length,
      signaux,
      roadmap_terminees: terminees,
      message,
      rien_a_faire: rienAFaire,
      skip_croisement: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Alias : ancien /proposer → même chemin auto (plus d’écriture de propositions).
 */
router.post('/proposer', validateBody(ravitaillementProposerSchema), async (req, res) => {
  try {
    const arcsDemandes = req.body?.arc_id
      ? [req.body.arc_id]
      : ARCS_RAVITAILLEMENT;

    const { creees, signaux } = await autoRemplirArcs(arcsDemandes);
    res.status(creees.length ? 201 : 200).json({
      ok: true,
      mode: 'auto',
      quetes: creees,
      propositions: [],
      total_ajoutees: creees.length,
      signaux,
      message: messageDepuisSignaux(signaux, creees.length),
      skip_croisement: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Legacy accepter/refuser lots — plus utilisé par l’UI.
 * Accepter crée encore les quêtes si des propositions trainent.
 */
router.post('/repondre-lot', validateBody(ravitaillementRepondreLotSchema), async (req, res) => {
  try {
    const action = req.body.action;
    const props = await propositionsActives();
    if (!props.length) {
      return res.json({ ok: true, propositions: [], quetes: [] });
    }

    const now = new Date().toISOString();
    const allQuetes = [];
    const updated = [];

    if (action === 'refuser') {
      for (const prop of props) {
        const { data, error } = await supabase
          .from('ravitaillement_propositions')
          .update({ statut: 'refusee', date_reponse: now })
          .eq('id', prop.id)
          .eq('statut', 'proposee')
          .select()
          .single();
        if (error) return res.status(500).json({ error: error.message });
        updated.push(data);
      }
      return res.json({ ok: true, propositions: updated, quetes: [] });
    }

    for (const prop of props) {
      const drafts = Array.isArray(prop.drafts) ? prop.drafts : [];
      if (!drafts.length) continue;

      const rows = drafts.map((d) => ({
        type: d.type || prop.arc_id,
        titre: d.titre,
        statut: 'a_faire',
        competence_id: d.competence_id || prop.competence_id,
      }));

      const { data: quetes, error: qErr } = await supabase.from('quetes').insert(rows).select();
      if (qErr) return res.status(500).json({ error: qErr.message });
      allQuetes.push(...(quetes || []));

      const { data, error } = await supabase
        .from('ravitaillement_propositions')
        .update({ statut: 'acceptee', date_reponse: now })
        .eq('id', prop.id)
        .eq('statut', 'proposee')
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      updated.push(data);
    }

    res.status(201).json({ ok: true, propositions: updated, quetes: allQuetes });
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
