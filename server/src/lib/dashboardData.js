/**
 * Chargeurs partagés pour GET /api/dashboard et endpoints unitaires.
 * Faits uniquement — pas de génération de conseil / LLM.
 */
import { supabase } from '../supabaseClient.js';
import { evaluerRupturesStreak } from './streaksLogic.js';
import {
  assezDeFaitsPourTitre,
  estTitreGenerique,
  genererChroniqueHeuristique,
  genererTitreChapitreHeuristique,
} from './chronique.js';
import { construireEmploiDuTemps } from './emploiDuTemps.js';
import { getActiveDirectives } from './directives.js';
import { runRavitaillementAuto } from './ravitaillementAuto.js';

/** @param {unknown} err */
function msg(err) {
  return err?.message || String(err);
}

export async function loadArcs() {
  const { data, error } = await supabase.from('arcs').select('*');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function loadQuetes() {
  const { data, error } = await supabase
    .from('quetes')
    .select('*')
    .order('date_prevue', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function loadStreaks() {
  await evaluerRupturesStreak();
  const { data, error } = await supabase.from('streaks').select('*');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function loadChapitres() {
  const { data, error } = await supabase
    .from('chapitres')
    .select('*')
    .order('date_debut', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

/** Entrées des 7 derniers jours (ordre desc). */
export async function loadEntrees7j() {
  const debut = new Date();
  debut.setDate(debut.getDate() - 7);
  const { data, error } = await supabase
    .from('entrees')
    .select('*')
    .gte('cree_le', debut.toISOString())
    .order('cree_le', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function loadEreActive() {
  const { data, error } = await supabase
    .from('eres')
    .select('*')
    .eq('statut', 'active')
    .order('date_debut', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Flag dispersion (même logique que GET /eres/dispersion).
 * @param {number} [jours=14]
 */
export async function loadDispersion(jours = 14) {
  const j = Math.min(90, Math.max(1, Number(jours) || 14));
  const debut = new Date();
  debut.setDate(debut.getDate() - j);
  const iso = debut.toISOString().slice(0, 10);

  const { data: ere, error: ereErr } = await supabase
    .from('eres')
    .select('*')
    .eq('statut', 'active')
    .order('date_debut', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (ereErr) throw new Error(ereErr.message);

  if (!ere) {
    return {
      ok: true,
      ere: null,
      dispersion: false,
      sans_objectif: [],
      total_periode: 0,
      jours: j,
      note: 'aucune ère active',
    };
  }

  const { data: quetes, error } = await supabase
    .from('quetes')
    .select('*')
    .neq('statut', 'abandonne')
    .or(`date_prevue.gte.${iso},cree_le.gte.${debut.toISOString()}`);
  if (error) throw new Error(error.message);

  const liste = quetes || [];
  const avecObjectif = liste.filter((q) => q.ere_objectif_id);
  const sans = liste.filter((q) => !q.ere_objectif_id);

  if (avecObjectif.length === 0) {
    return {
      ok: true,
      ere,
      dispersion: false,
      sans_objectif: [],
      total_periode: liste.length,
      lies_ere: 0,
      jours: j,
      note: 'ère pas encore branchée aux quêtes',
    };
  }

  const pct = sans.length / Math.max(liste.length, 1);
  const dispersion = sans.length >= 2 && pct >= 0.5;

  return {
    ok: true,
    ere,
    dispersion,
    sans_objectif: sans,
    total_periode: liste.length,
    lies_ere: avecObjectif.length,
    pct_hors: Math.round(pct * 100),
    jours: j,
  };
}

export async function loadContremaitreActive() {
  const { data, error } = await supabase
    .from('suggestions_contremaitre')
    .select('*')
    .eq('statut', 'proposee')
    .order('date_proposition', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function loadEmploiDuTemps() {
  const [{ data: quetes, error: qErr }, { data: streaks, error: sErr }, contre] = await Promise.all([
    supabase.from('quetes').select('*').neq('statut', 'abandonne'),
    supabase.from('streaks').select('*'),
    loadContremaitreActive(),
  ]);
  if (qErr) throw new Error(qErr.message);
  if (sErr) throw new Error(sErr.message);

  let noteContexte = null;
  if (contre?.ressource_titre) {
    noteContexte = `Contremaître · ${contre.ressource_titre}`;
  }

  const plan = construireEmploiDuTemps({
    quetes: quetes || [],
    streaks: streaks || [],
    noteContexte,
  });
  plan.contremaitre = contre || null;
  return plan;
}

async function chargerContexteChronique({ jours = 7, chapitreId = null, arcId = null } = {}) {
  const debut = new Date();
  debut.setDate(debut.getDate() - jours);
  const iso = debut.toISOString();

  let quetesQ = supabase.from('quetes').select('*');
  if (chapitreId) quetesQ = quetesQ.eq('chapitre_id', chapitreId);

  let entreesQ = supabase
    .from('entrees')
    .select('*')
    .gte('cree_le', iso)
    .order('cree_le', { ascending: false })
    .limit(40);
  if (arcId) entreesQ = entreesQ.eq('arc_id', arcId);

  const [quetesRes, entreesRes, streaksRes, appRes, ereRes] = await Promise.all([
    quetesQ,
    entreesQ,
    supabase.from('streaks').select('*'),
    supabase.from('apprentissages').select('*').gte('cree_le', iso).order('cree_le', { ascending: false }).limit(8),
    supabase.from('eres').select('id, nom, statut').eq('statut', 'active').limit(1).maybeSingle(),
  ]);

  const quetes = quetesRes.data || [];
  return {
    quetes,
    quetesFaites: quetes.filter((q) => q.statut === 'fait'),
    quetesActives: quetes.filter((q) => q.statut === 'a_faire' || q.statut === 'en_cours'),
    entrees: entreesRes.data || [],
    streaks: streaksRes.data || [],
    apprentissages: appRes.data || [],
    ere: ereRes.data || null,
  };
}

/** Chronique du jour — heuristique factuelle uniquement (pas de LLM). */
export async function loadChroniqueJour() {
  const ctx = await chargerContexteChronique({ jours: 7 });
  const out = genererChroniqueHeuristique({
    mode: 'jour',
    quetesFaites: ctx.quetesFaites,
    quetesActives: ctx.quetesActives,
    entrees: ctx.entrees,
    streaks: ctx.streaks,
    apprentissages: ctx.apprentissages,
    ere: ctx.ere,
  });
  return {
    ok: true,
    titre: out.titre,
    corps: out.corps,
    source: 'heuristic',
    meta: {
      quetes_faites: ctx.quetesFaites.length,
      entrees: ctx.entrees.length,
      apprentissages: ctx.apprentissages.length,
    },
  };
}

/**
 * Chapitre actif + titre heuristique si générique.
 * @param {{ appliquerTitre?: boolean }} [opts]
 */
export async function loadChapitreActif({ appliquerTitre = true } = {}) {
  const { data: chapitres, error } = await supabase
    .from('chapitres')
    .select('*')
    .in('statut', ['en_cours', 'reprise', 'rompu'])
    .order('date_debut', { ascending: false });

  if (error) throw new Error(error.message);

  const liste = chapitres || [];
  const chap = liste.find((c) => c.arc_id === 'dev')
    || liste.find((c) => c.arc_id === 'beatmaker')
    || liste[0]
    || null;

  if (!chap) {
    const empty = genererChroniqueHeuristique({ mode: 'chapitre' });
    return {
      ok: true,
      titre: empty.titre,
      corps: empty.corps,
      source: 'heuristic',
      chapitre: null,
      titre_mis_a_jour: false,
    };
  }

  const ctx = await chargerContexteChronique({
    jours: 21,
    chapitreId: chap.id,
    arcId: chap.arc_id,
  });

  let chapitreCourant = chap;
  let titreMisAJour = false;
  let sourceTitre = null;

  if (
    appliquerTitre
    && estTitreGenerique(chap.titre)
    && assezDeFaitsPourTitre({
      quetesFaites: ctx.quetesFaites,
      entrees: ctx.entrees,
      apprentissages: ctx.apprentissages,
    })
  ) {
    const suggestion = genererTitreChapitreHeuristique({
      chapitre: chap,
      quetesFaites: ctx.quetesFaites,
      entrees: ctx.entrees,
      apprentissages: ctx.apprentissages,
    });
    sourceTitre = 'heuristic';

    const { data: updated, error: upErr } = await supabase
      .from('chapitres')
      .update({
        titre: suggestion.titre,
        resume_public: suggestion.resume_public,
      })
      .eq('id', chap.id)
      .select()
      .single();

    if (!upErr && updated) {
      chapitreCourant = updated;
      titreMisAJour = true;
    }
  }

  const heuristic = genererChroniqueHeuristique({
    mode: 'chapitre',
    quetesFaites: ctx.quetesFaites,
    quetesActives: ctx.quetesActives,
    entrees: ctx.entrees,
    streaks: ctx.streaks,
    apprentissages: ctx.apprentissages,
    chapitre: chapitreCourant,
    ere: ctx.ere,
  });

  if (chapitreCourant?.titre && !estTitreGenerique(chapitreCourant.titre)) {
    heuristic.titre = chapitreCourant.titre;
  }

  return {
    ok: true,
    titre: heuristic.titre,
    corps: heuristic.corps,
    source: 'heuristic',
    chapitre: chapitreCourant,
    titre_mis_a_jour: titreMisAJour,
    source_titre: sourceTitre,
  };
}

export async function loadRavitaillementAuto() {
  return runRavitaillementAuto();
}

export async function loadDirectives() {
  return getActiveDirectives();
}

/**
 * Agrège le dashboard. Sous-échec → null + entrée dans erreurs.
 * @returns {Promise<object>}
 */
export async function loadDashboard() {
  /** @type {{ cle: string, message: string }[]} */
  const erreurs = [];

  async function wrap(cle, fn) {
    try {
      return await fn();
    } catch (err) {
      erreurs.push({ cle, message: msg(err) });
      return null;
    }
  }

  const [
    arcs,
    quetes,
    streaks,
    chapitres,
    chroniqueJour,
    chapitreActif,
    entrees,
    emploiDuTemps,
    ereActive,
    dispersion,
    contremaitre,
    ravitaillement,
    directives,
  ] = await Promise.all([
    wrap('arcs', loadArcs),
    wrap('quetes', loadQuetes),
    wrap('streaks', loadStreaks),
    wrap('chapitres', loadChapitres),
    wrap('chroniqueJour', loadChroniqueJour),
    wrap('chapitreActif', () => loadChapitreActif({ appliquerTitre: true })),
    wrap('entrees', loadEntrees7j),
    wrap('emploiDuTemps', loadEmploiDuTemps),
    wrap('ereActive', loadEreActive),
    wrap('dispersion', () => loadDispersion(14)),
    wrap('contremaitre', loadContremaitreActive),
    wrap('ravitaillement', loadRavitaillementAuto),
    wrap('directives', loadDirectives),
  ]);

  return {
    arcs,
    quetes,
    streaks,
    chapitres,
    chroniqueJour,
    chapitreActif,
    entrees,
    emploiDuTemps,
    ereActive,
    dispersion,
    contremaitre,
    ravitaillement,
    directives: directives || {},
    erreurs,
  };
}
