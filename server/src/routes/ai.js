import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuthOrApiKey } from '../middleware/auth.js';
import { aiRateLimit } from '../middleware/rateLimit.js';
import { askClaude, anthropicConfigured } from '../lib/claude.js';
import { lireMemoire, appendLecon } from '../lib/coachingMemory.js';
import {
  genererRevueHeuristique,
  genererTitreChapitreHeuristique,
} from '../lib/chronique.js';
import { parserCheckinHeuristique } from '../lib/checkinHeuristique.js';
import { incrementerStreak } from './streaks.js';

const router = express.Router();

router.use(aiRateLimit, requireAuthOrApiKey);

router.get('/status', (_req, res) => {
  res.json({
    ok: true,
    anthropic: anthropicConfigured(),
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    memoire: true,
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
    const faites = ctx.quetes.filter((q) => q.statut === 'fait');

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

    const heuristic = genererRevueHeuristique({
      entrees: ctx.entrees,
      quetes: ctx.quetes,
      streaks: ctx.streaks,
      apprentissages: apprentissages || [],
      contremaitre: suggestion || null,
    });

    if (!anthropicConfigured()) {
      return res.json({
        ok: true,
        revue: heuristic,
        source: 'heuristic',
        apprentissages: apprentissages || [],
        contremaitre: suggestion || null,
      });
    }

    try {
      const { text } = await askClaude(
        `Tu es le rédacteur des Chroniques TWIY (THE WORLD IS YOURS).
Tone: direct, culturel, pas corporate. Français.
Structure: titre de semaine + récit (pas un dump de stats) + 1 leçon + section "ce que tu as appris" si apprentissages fournis.
Mémoire coaching à respecter:\n${ctx.memoire}`,
        `Données 7 jours:\n${JSON.stringify({
          entrees: ctx.entrees.slice(0, 40),
          quetes_faites: faites.length,
          quetes_total: ctx.quetes.length,
          streaks: ctx.streaks,
          apprentissages: apprentissages || [],
          contremaitre: suggestion || null,
          proposals: (ctx.prospects || []).filter((p) => p.statut === 'proposal_envoye').length,
          brouillon_heuristique: heuristic,
        }, null, 2)}\n\nRédige la revue dominicale en prose.`,
        1100,
      );
      return res.json({
        ok: true,
        revue: text,
        source: 'ia',
        apprentissages: apprentissages || [],
        contremaitre: suggestion || null,
      });
    } catch (err) {
      // Soft: jamais 503 pour absence de récit — heuristique toujours dispo
      return res.json({
        ok: true,
        revue: heuristic,
        source: 'heuristic',
        note: err.message,
        apprentissages: apprentissages || [],
        contremaitre: suggestion || null,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/insights', async (req, res) => {
  try {
    const ctx = await contexteSemaine();
    const parType = {};
    for (const e of ctx.entrees) parType[e.type_fait] = (parType[e.type_fait] || 0) + 1;
    const { text } = await askClaude(
      `Tu analyses les Chroniques TWIY. Français, 4–6 bullets max.
Cherche corrélations Dev ↔ Beatmaker ↔ Sport ↔ Freelance.
Mémoire:\n${lireMemoire()}`,
      `Stats:\n${JSON.stringify({ parType, streaks: ctx.streaks, nEntrees: ctx.entrees.length }, null, 2)}`,
      600,
    );
    res.json({ ok: true, insights: text });
  } catch (err) {
    res.status(err.code === 'NO_KEY' ? 503 : 500).json({ error: err.message });
  }
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
    let parsed = heuristic;
    let source = 'heuristic';

    if (anthropicConfigured()) {
      try {
        const { text } = await askClaude(
          `Tu transformes un check-in libre en faits Chroniques TWIY.
Réponds UNIQUEMENT en JSON valide: {"entrees":[{"type_fait":"commit|session_prod|sport|proposal|instru|projet|certif|quete","detail":"...","arc_id":"dev|beatmaker|croisement|null"}],"lecon":"optionnel","apprentissages_brouillon":[{"titre":"...","contenu":"...","type":"blocage_resolu|declic|principe","arc_id":"dev|beatmaker|croisement|null","tags":[]}]}
Types autorisés stricts. arc_id null si sport/proposal générique.
Si tu detects un blocage résolu ou un déclic, remplis apprentissages_brouillon (max 2) — JAMAIS auto-créés, brouillons seulement.
Mémoire:\n${lireMemoire()}`,
          `Texte:\n${texte}\n\nBrouillon heuristique:\n${JSON.stringify(heuristic)}`,
          900,
        );
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const iaParsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        if (Array.isArray(iaParsed?.entrees) && iaParsed.entrees.length) {
          parsed = iaParsed;
          source = 'ia';
        }
      } catch {
        /* soft — heuristique */
      }
    }

    const creees = creer
      ? await insererEntreesCheckin(parsed.entrees, source === 'ia' ? 'checkin_ia' : 'checkin')
      : [];

    if (parsed.lecon) appendLecon(parsed.lecon);

    const brouillons = Array.isArray(parsed.apprentissages_brouillon)
      ? parsed.apprentissages_brouillon.slice(0, 2)
      : [];

    res.json({
      ok: true,
      suggestion: parsed,
      creees,
      apprentissages_brouillon: brouillons,
      source,
    });
  } catch (err) {
    // Dernier filet : toujours pouvoir créer via heuristique
    try {
      const creees = creer ? await insererEntreesCheckin(heuristic.entrees, 'checkin') : [];
      res.json({
        ok: true,
        suggestion: heuristic,
        creees,
        apprentissages_brouillon: heuristic.apprentissages_brouillon || [],
        source: 'heuristic',
        note: err.message,
      });
    } catch (err2) {
      res.status(500).json({ error: err2.message || err.message });
    }
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
    const heuristic = genererTitreChapitreHeuristique({
      chapitre: chap,
      quetesFaites,
      entrees: entrees || [],
    });

    let parsed = heuristic;
    let source = 'heuristic';

    if (anthropicConfigured()) {
      try {
        const { text } = await askClaude(
          `Tu titres un chapitre Chroniques TWIY (affiche street, Bricolage vibe).
Réponds JSON: {"titre":"...","resume_public":"1-2 phrases"}
Titre court, punchy, pas générique. Basé UNIQUEMENT sur les faits.`,
          JSON.stringify({ chapitre: chap, entrees: entrees || [], quetes_faites: quetesFaites, brouillon: heuristic }),
          400,
        );
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const iaParsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        if (iaParsed?.titre) {
          parsed = {
            titre: iaParsed.titre,
            resume_public: iaParsed.resume_public || heuristic.resume_public,
          };
          source = 'ia';
        }
      } catch {
        /* keep heuristic */
      }
    }

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
      return res.json({ ok: true, suggestion: parsed, chapitre: data, source });
    }

    res.json({ ok: true, suggestion: parsed, source });
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
 * Message du matin : routines + Contremaître (max 1 suggestion) + apprentissages récents.
 * Auth JWT ou x-api-key (n8n cron).
 */
router.post('/message-matin', async (req, res) => {
  try {
    const ctx = await contexteSemaine();
    const { data: activeSug } = await supabase
      .from('suggestions_contremaitre')
      .select('*')
      .eq('statut', 'proposee')
      .maybeSingle();

    let suggestion = activeSug;
    if (!suggestion) {
      // Déclencher scan Contremaître (même règles : max 1, déclencheur réel)
      const { data: quetes } = await supabase
        .from('quetes')
        .select('*')
        .eq('statut', 'en_cours')
        .order('cree_le', { ascending: true })
        .limit(20);
      const auj = new Date().toISOString().slice(0, 10);
      const bloquee = (quetes || []).find((q) => q.date_prevue && q.date_prevue < auj);

      if (bloquee) {
        let competenceId = bloquee.competence_id;
        let ressourceTitre = null;
        let ressourceUrl = null;
        if (competenceId) {
          const { data: comp } = await supabase.from('competences').select('*').eq('id', competenceId).maybeSingle();
          if (comp?.description) {
            const urlM = comp.description.match(/<([^>\s]+)>/) || comp.description.match(/(https?:\/\/[^\s;]+)/);
            const nameM = comp.description.match(/Ressources:\s*([^;<]+)/);
            ressourceUrl = urlM ? urlM[1] : null;
            ressourceTitre = nameM ? nameM[1].trim() : comp.titre;
          }
        }
        if (!ressourceTitre) {
          const { data: comps } = await supabase
            .from('competences')
            .select('*')
            .not('source_roadmap', 'is', null)
            .limit(30);
          const withUrl = (comps || []).find((c) => /https?:\/\//.test(c.description || ''));
          if (withUrl) {
            competenceId = withUrl.id;
            const urlM = withUrl.description.match(/<([^>\s]+)>/) || withUrl.description.match(/(https?:\/\/[^\s;]+)/);
            const nameM = withUrl.description.match(/Ressources:\s*([^;<]+)/);
            ressourceUrl = urlM ? urlM[1] : null;
            ressourceTitre = nameM ? nameM[1].trim() : withUrl.titre;
          }
        }
        if (ressourceTitre) {
          const { data: created } = await supabase
            .from('suggestions_contremaitre')
            .insert({
              declencheur_type: 'quete_bloquee',
              declencheur_ref: bloquee.id,
              competence_id: competenceId || null,
              ressource_titre: ressourceTitre,
              ressource_url: ressourceUrl,
              statut: 'proposee',
            })
            .select()
            .single();
          suggestion = created || null;
        }
      }
    }

    const { data: apprentissages } = await supabase
      .from('apprentissages')
      .select('id, titre, type, arc_id')
      .order('cree_le', { ascending: false })
      .limit(3);

    const { data: dispersion } = await supabase
      .from('eres')
      .select('id, nom')
      .eq('statut', 'active')
      .limit(1)
      .maybeSingle();

    let message = null;
    if (anthropicConfigured()) {
      try {
        const { text } = await askClaude(
          `Message du matin TWIY — Contremaître. Français, 4–6 lignes max, direct.
Inclure : focus du jour, 1 rappel streak si pertinent, Contremaître s'il y a une suggestion (utile/pas utile plus tard).
Pas de motivational fluff.
Mémoire:\n${lireMemoire()}`,
          JSON.stringify({
            streaks: ctx.streaks,
            suggestion,
            apprentissages: apprentissages || [],
            ere: dispersion,
          }),
          400,
        );
        message = text;
      } catch {
        message = null;
      }
    }

    if (!message) {
      const parts = ['Contremaître — matin.'];
      if (suggestion) {
        parts.push(`Suggestion : ${suggestion.ressource_titre}${suggestion.ressource_url ? ` → ${suggestion.ressource_url}` : ''}`);
      } else {
        parts.push('Aucune friction détectée — pas de suggestion.');
      }
      if ((apprentissages || []).length) {
        parts.push(`Apprentissages récents : ${(apprentissages || []).map((a) => a.titre).join(' · ')}`);
      }
      message = parts.join('\n');
    }

    res.json({
      ok: true,
      message,
      contremaitre: suggestion || null,
      apprentissages: apprentissages || [],
      ia: Boolean(anthropicConfigured() && message),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
