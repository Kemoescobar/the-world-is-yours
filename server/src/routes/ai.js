import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuthOrApiKey } from '../middleware/auth.js';
import { aiRateLimit } from '../middleware/rateLimit.js';
import { lireMemoire, appendLecon } from '../lib/coachingMemory.js';
import {
  genererRevueHeuristique,
  genererTitreChapitreHeuristique,
} from '../lib/chronique.js';
import { parserCheckinHeuristique } from '../lib/checkinHeuristique.js';
import { incrementerStreak } from './streaks.js';
import { getActiveDirectives } from '../lib/directives.js';

const router = express.Router();

router.use(aiRateLimit, requireAuthOrApiKey);

router.get('/status', (_req, res) => {
  res.json({
    ok: true,
    anthropic: false,
    llm: false,
    model: null,
    memoire: true,
    note: 'LLM débranché — jugement via POST /api/directives (Cowork)',
  });
});

async function contexteSemaine() {
  const debut = new Date();
  debut.setDate(debut.getDate() - 7);
  const iso = debut.toISOString();

  const [entrees, quetes, streaks, prospects] = await Promise.all([
    supabase.from('entrees').select('*').gte('cree_le', iso).order('cree_le', { ascending: false }),
    supabase.from('quetes').select('*'),
    supabase.from('streaks').select('*'),
    supabase.from('prospects').select('*'),
  ]);

  return {
    entrees: entrees.data || [],
    quetes: quetes.data || [],
    streaks: streaks.data || [],
    prospects: prospects.data || [],
    memoire: lireMemoire(),
  };
}

router.post('/revue', async (req, res) => {
  try {
    const ctx = await contexteSemaine();
    const debut = new Date();
    debut.setDate(debut.getDate() - 7);
    const { data: apprentissages } = await supabase
      .from('apprentissages')
      .select('*')
      .gte('cree_le', debut.toISOString())
      .order('cree_le', { ascending: false });

    const { data: suggestion } = await supabase
      .from('suggestions_contremaitre')
      .select('*')
      .eq('statut', 'proposee')
      .maybeSingle();

    // Préférence : directive revue_soir Cowork si présente
    const dirRevue = await getActiveDirectives('revue_soir').catch(() => null);
    if (dirRevue?.contenu) {
      const texte = typeof dirRevue.contenu === 'string'
        ? dirRevue.contenu
        : (dirRevue.contenu.texte || dirRevue.contenu.revue || JSON.stringify(dirRevue.contenu));
      return res.json({
        ok: true,
        revue: texte,
        source: 'directive',
        apprentissages: apprentissages || [],
        contremaitre: suggestion || null,
      });
    }

    const heuristic = genererRevueHeuristique({
      entrees: ctx.entrees,
      quetes: ctx.quetes,
      streaks: ctx.streaks,
      apprentissages: apprentissages || [],
      contremaitre: suggestion || null,
    });

    return res.json({
      ok: true,
      revue: heuristic,
      source: 'heuristic',
      apprentissages: apprentissages || [],
      contremaitre: suggestion || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/insights', async (_req, res) => {
  res.status(503).json({
    error: 'LLM débranché — insights via directive Cowork (POST /api/directives type alerte|decision)',
  });
});

const TYPES_FAIT_OK = new Set([
  'commit', 'certif', 'session_prod', 'sport', 'proposal', 'instru', 'projet', 'quete', 'bilan_ere',
]);
const ARCS_OK = new Set(['dev', 'beatmaker', 'croisement']);

async function insererEntreesCheckin(entrees, source = 'checkin') {
  const creees = [];
  const streakParArc = { dev: 'dev', beatmaker: 'miprod' };
  for (const e of (entrees || []).slice(0, 8)) {
    const type_fait = TYPES_FAIT_OK.has(e.type_fait) ? e.type_fait : 'quete';
    const detail = String(e.detail || '').trim();
    if (!detail) continue;
    let arc_id = e.arc_id === 'null' || !e.arc_id ? null : e.arc_id;
    if (arc_id && !ARCS_OK.has(arc_id)) arc_id = null;
    const row = { type_fait, detail, arc_id, source };
    const { data, error } = await supabase.from('entrees').insert(row).select().single();
    if (!error && data) {
      creees.push(data);
      if (type_fait === 'sport') await incrementerStreak('sport');
      else if (streakParArc[arc_id]) await incrementerStreak(streakParArc[arc_id]);
    }
  }
  return creees;
}

router.post('/checkin', async (req, res) => {
  const texte = (req.body?.texte || '').trim();
  if (!texte) return res.status(400).json({ error: 'texte requis' });

  const heuristic = parserCheckinHeuristique(texte);
  const creer = req.body?.creer === true;

  try {
    const creees = creer
      ? await insererEntreesCheckin(heuristic.entrees, 'checkin')
      : [];

    if (heuristic.lecon) appendLecon(heuristic.lecon);

    const brouillons = Array.isArray(heuristic.apprentissages_brouillon)
      ? heuristic.apprentissages_brouillon.slice(0, 2)
      : [];

    res.json({
      ok: true,
      suggestion: heuristic,
      creees,
      apprentissages_brouillon: brouillons,
      source: 'heuristic',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/chapitre-titre', async (req, res) => {
  const chapitreId = req.body?.chapitre_id;
  if (!chapitreId) return res.status(400).json({ error: 'chapitre_id requis' });

  try {
    const { data: chap, error } = await supabase.from('chapitres').select('*').eq('id', chapitreId).single();
    if (error || !chap) return res.status(404).json({ error: 'chapitre introuvable' });

    const { data: entrees } = await supabase
      .from('entrees')
      .select('*')
      .eq('arc_id', chap.arc_id)
      .order('cree_le', { ascending: false })
      .limit(30);

    const { data: quetes } = await supabase
      .from('quetes')
      .select('*')
      .eq('chapitre_id', chapitreId);

    const quetesFaites = (quetes || []).filter((q) => q.statut === 'fait');
    const parsed = genererTitreChapitreHeuristique({
      chapitre: chap,
      quetesFaites,
      entrees: entrees || [],
    });

    if (req.body?.appliquer === true) {
      const { data, error: upErr } = await supabase
        .from('chapitres')
        .update({
          titre: parsed.titre || chap.titre,
          resume_public: parsed.resume_public || chap.resume_public,
          statut: chap.statut === 'en_cours' ? 'clos' : chap.statut,
        })
        .eq('id', chapitreId)
        .select()
        .single();
      if (upErr) return res.status(500).json({ error: upErr.message });
      return res.json({ ok: true, suggestion: parsed, chapitre: data, source: 'heuristic' });
    }

    res.json({ ok: true, suggestion: parsed, source: 'heuristic' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** Génère / complète les quêtes routine du jour (habitudes). */
router.post('/routines-jour', async (req, res) => {
  const jour = new Date().toISOString().slice(0, 10);
  const routines = [
    { type: 'routine', titre: 'Sport — ne pas casser le streak', arc: null },
    { type: 'routine', titre: 'Bloc Dev du jour', arc: 'dev' },
    { type: 'routine', titre: 'Miprod / session courte', arc: 'beatmaker' },
  ];

  try {
    const { data: chapitres } = await supabase
      .from('chapitres')
      .select('id, arc_id')
      .eq('semaine', 'S1');

    const chapDev = (chapitres || []).find((c) => c.arc_id === 'dev');
    const creees = [];

    for (const r of routines) {
      const { data: existRows } = await supabase
        .from('quetes')
        .select('id')
        .eq('titre', r.titre)
        .eq('date_prevue', jour)
        .limit(1);
      if (existRows?.length) continue;

      const chapitreId = r.arc === 'beatmaker'
        ? (chapitres || []).find((c) => c.arc_id === 'beatmaker')?.id
        : chapDev?.id;

      if (!chapitreId) continue;

      const { data, error } = await supabase.from('quetes').insert({
        chapitre_id: chapitreId,
        type: r.type,
        titre: r.titre,
        statut: 'a_faire',
        date_prevue: jour,
      }).select().single();
      if (!error && data) creees.push(data);
    }

    res.json({ ok: true, jour, creees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Message du matin — proxy directives type message_matin (aucune génération).
 * Auth JWT ou x-api-key (n8n cron).
 */
router.post('/message-matin', async (_req, res) => {
  try {
    const directive = await getActiveDirectives('message_matin');
    const { data: suggestion } = await supabase
      .from('suggestions_contremaitre')
      .select('*')
      .eq('statut', 'proposee')
      .maybeSingle();

    const { data: apprentissages } = await supabase
      .from('apprentissages')
      .select('id, titre, type, arc_id')
      .order('cree_le', { ascending: false })
      .limit(3);

    let message = null;
    if (directive?.contenu) {
      message = typeof directive.contenu === 'string'
        ? directive.contenu
        : (directive.contenu.texte || directive.contenu.message || null);
    }

    res.json({
      ok: true,
      message,
      directive: directive || null,
      contremaitre: suggestion || null,
      apprentissages: apprentissages || [],
      ia: false,
      source: directive ? 'directive' : null,
      en_attente: !directive,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
