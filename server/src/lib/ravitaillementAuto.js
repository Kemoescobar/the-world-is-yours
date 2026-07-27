/**
 * Ravitaillement auto — partagé entre POST /ravitaillement/auto et GET /dashboard.
 */
import { supabase } from '../supabaseClient.js';
import {
  ARCS_RAVITAILLEMENT,
  preparerPropositionArc,
  quetesActivesArc,
  chapitreCourantArc,
  labelArc,
  messageDepuisSignaux,
} from './ravitaillement.js';

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
 * @param {string[]} [arcsDemandes]
 */
export async function autoRemplirArcs(arcsDemandes = ARCS_RAVITAILLEMENT) {
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

/**
 * @param {string} [arcId]
 */
export async function runRavitaillementAuto(arcId) {
  const arcsDemandes = arcId ? [arcId] : ARCS_RAVITAILLEMENT;
  const { creees, signaux } = await autoRemplirArcs(arcsDemandes);
  const terminees = signaux.filter((s) => s.roadmap_terminee).map((s) => s.message);
  const message = messageDepuisSignaux(signaux, creees.length);
  const rienAFaire = !creees.length && !terminees.length
    && !signaux.some((s) => s.bloque_prereqs);

  return {
    ok: true,
    mode: 'auto',
    quetes: creees,
    total_ajoutees: creees.length,
    signaux,
    roadmap_terminees: terminees,
    message,
    rien_a_faire: rienAFaire,
    skip_croisement: true,
  };
}

export { chargerContexte, propositionsActives, chapitreIdPourArc };
