import express from 'express';
import crypto from 'crypto';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { aiRateLimit } from '../middleware/rateLimit.js';
import { askClaude, anthropicConfigured } from '../lib/claude.js';
import { lireMemoire, appendLecon } from '../lib/coachingMemory.js';

const router = express.Router();

function timingSafeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** JWT utilisateur OU clé n8n (x-api-key = WEBHOOK_API_KEY). */
export function requireAuthOrApiKey(req, res, next) {
  const cle = req.header('x-api-key');
  if (cle && timingSafeEqualString(cle, process.env.WEBHOOK_API_KEY || '')) {
    req.authMode = 'apiKey';
    return next();
  }
  return requireAuth(req, res, next);
}

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
    const { text } = await askClaude(
      `Tu es le rédacteur des Chroniques TWIY (THE WORLD IS YOURS).
Tone: direct, culturel, pas corporate. Français.
Structure: titre de semaine + 6 points (cert/commit, Dev, Beatmaker, freelance proposals, LinkedIn/post, délais) + 1 leçon.
Mémoire coaching à respecter:\n${ctx.memoire}`,
      `Données 7 jours:\n${JSON.stringify({
        entrees: ctx.entrees.slice(0, 40),
        quetes_faites: faites.length,
        quetes_total: ctx.quetes.length,
        streaks: ctx.streaks,
        proposals: (ctx.prospects || []).filter((p) => p.statut === 'proposal_envoye').length,
      }, null, 2)}\n\nRédige la revue dominicale.`,
      1000,
    );
    res.json({ ok: true, revue: text });
  } catch (err) {
    res.status(err.code === 'NO_KEY' ? 503 : 500).json({ error: err.message });
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

router.post('/checkin', async (req, res) => {
  const texte = (req.body?.texte || '').trim();
  if (!texte) return res.status(400).json({ error: 'texte requis' });

  try {
    const { text } = await askClaude(
      `Tu transformes un check-in libre en faits Chroniques TWIY.
Réponds UNIQUEMENT en JSON valide: {"entrees":[{"type_fait":"commit|session_prod|sport|proposal|instru|projet|certif|quete","detail":"...","arc_id":"dev|beatmaker|croisement|null"}],"lecon":"optionnel"}
Types autorisés stricts. arc_id null si sport/proposal générique.
Mémoire:\n${lireMemoire()}`,
      texte,
      700,
    );

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return res.status(502).json({ error: 'réponse IA non JSON', brut: text });
    }

    const creer = req.body?.creer === true;
    const creees = [];
    if (creer && Array.isArray(parsed.entrees)) {
      for (const e of parsed.entrees.slice(0, 8)) {
        const row = {
          type_fait: e.type_fait,
          detail: e.detail,
          arc_id: e.arc_id === 'null' || !e.arc_id ? null : e.arc_id,
          source: 'checkin_ia',
        };
        const { data, error } = await supabase.from('entrees').insert(row).select().single();
        if (!error && data) creees.push(data);
      }
    }

    if (parsed.lecon) appendLecon(parsed.lecon);

    res.json({ ok: true, suggestion: parsed, creees });
  } catch (err) {
    res.status(err.code === 'NO_KEY' ? 503 : 500).json({ error: err.message });
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

    const { text } = await askClaude(
      `Tu titres un chapitre Chroniques TWIY (affiche street, Bricolage vibe).
Réponds JSON: {"titre":"...","resume_public":"1-2 phrases"}
Titre court, punchy, pas générique.`,
      JSON.stringify({ chapitre: chap, entrees: entrees || [] }),
      400,
    );

    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return res.status(502).json({ error: 'réponse IA non JSON', brut: text });
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
      return res.json({ ok: true, suggestion: parsed, chapitre: data });
    }

    res.json({ ok: true, suggestion: parsed });
  } catch (err) {
    res.status(err.code === 'NO_KEY' ? 503 : 500).json({ error: err.message });
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

export default router;
