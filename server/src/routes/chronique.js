/**
 * Chronique API — récit déterministe (+ Claude soft si clé présente).
 */
import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';
import { askClaude, anthropicConfigured } from '../lib/claude.js';
import {
  assezDeFaitsPourTitre,
  estTitreGenerique,
  genererChroniqueHeuristique,
  genererTitreChapitreHeuristique,
} from '../lib/chronique.js';

const router = express.Router();
router.use(requireAuth);

async function chargerContexteChronique({ jours = 7, chapitreId = null, arcId = null } = {}) {
  const debut = new Date();
  debut.setDate(debut.getDate() - jours);
  const iso = debut.toISOString();

  let quetesQ = supabase.from('quetes').select('*');
  if (chapitreId) quetesQ = quetesQ.eq('chapitre_id', chapitreId);

  let entreesQ = supabase.from('entrees').select('*').gte('cree_le', iso).order('cree_le', { ascending: false }).limit(40);
  if (arcId) entreesQ = entreesQ.eq('arc_id', arcId);

  const [quetesRes, entreesRes, streaksRes, appRes, ereRes] = await Promise.all([
    quetesQ,
    entreesQ,
    supabase.from('streaks').select('*'),
    supabase.from('apprentissages').select('*').gte('cree_le', iso).order('cree_le', { ascending: false }).limit(8),
    supabase.from('eres').select('id, nom, statut').eq('statut', 'active').limit(1).maybeSingle(),
  ]);

  const quetes = quetesRes.data || [];
  const faites = quetes.filter((q) => q.statut === 'fait');
  const actives = quetes.filter((q) => q.statut === 'a_faire' || q.statut === 'en_cours');

  return {
    quetes,
    quetesFaites: faites,
    quetesActives: actives,
    entrees: entreesRes.data || [],
    streaks: streaksRes.data || [],
    apprentissages: appRes.data || [],
    ere: ereRes.data || null,
  };
}

async function enrichirClaude(heuristic, ctxLabel) {
  if (!anthropicConfigured()) return null;
  try {
    const { text } = await askClaude(
      `Tu es le chroniqueur TWIY (THE WORLD IS YOURS). Français, 2–5 phrases, ton street/direct, pas corporate.
Réponds JSON only: {"titre":"...","corps":"..."}.
Le corps raconte une histoire (arcs/ère), PAS un dump de stats.
Base-toi UNIQUEMENT sur les faits fournis — n'invente rien.`,
      `${ctxLabel}\n\nBrouillon heuristique:\n${JSON.stringify(heuristic, null, 2)}`,
      450,
    );
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : text);
    if (parsed?.corps) {
      return {
        titre: parsed.titre || heuristic.titre,
        corps: parsed.corps,
      };
    }
  } catch {
    /* soft fallback */
  }
  return null;
}

/** GET /api/chronique/jour — récit du jour / 7 derniers jours. */
router.get('/jour', async (_req, res) => {
  try {
    const ctx = await chargerContexteChronique({ jours: 7 });
    const heuristic = genererChroniqueHeuristique({
      mode: 'jour',
      quetesFaites: ctx.quetesFaites,
      quetesActives: ctx.quetesActives,
      entrees: ctx.entrees,
      streaks: ctx.streaks,
      apprentissages: ctx.apprentissages,
      ere: ctx.ere,
    });

    const ia = await enrichirClaude(heuristic, 'Chronique du jour (7j)');
    const out = ia || heuristic;

    res.json({
      ok: true,
      titre: out.titre,
      corps: out.corps,
      source: ia ? 'ia' : 'heuristic',
      meta: {
        quetes_faites: ctx.quetesFaites.length,
        entrees: ctx.entrees.length,
        apprentissages: ctx.apprentissages.length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/chronique/chapitre-actif
 * Récit du chapitre ouvert (Dev prioritaire) + titre réel si assez de faits.
 * Query: ?appliquer_titre=1 pour écrire le titre heuristique/IA si générique.
 */
router.get('/chapitre-actif', async (req, res) => {
  try {
    const { data: chapitres, error } = await supabase
      .from('chapitres')
      .select('*')
      .in('statut', ['en_cours', 'reprise', 'rompu'])
      .order('date_debut', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const liste = chapitres || [];
    const chap = liste.find((c) => c.arc_id === 'dev')
      || liste.find((c) => c.arc_id === 'beatmaker')
      || liste[0]
      || null;

    if (!chap) {
      const empty = genererChroniqueHeuristique({ mode: 'chapitre' });
      return res.json({
        ok: true,
        titre: empty.titre,
        corps: empty.corps,
        source: 'heuristic',
        chapitre: null,
        titre_mis_a_jour: false,
      });
    }

    const ctx = await chargerContexteChronique({
      jours: 21,
      chapitreId: chap.id,
      arcId: chap.arc_id,
    });

    // Faits du chapitre : quêtes liées + entrees récentes de l'arc
    const quetesChapFait = ctx.quetesFaites;
    const quetesChapActives = ctx.quetesActives;

    let chapitreCourant = chap;
    let titreMisAJour = false;
    let sourceTitre = null;

    const appliquer = req.query.appliquer_titre === '1' || req.query.appliquer_titre === 'true';
    if (
      appliquer
      && estTitreGenerique(chap.titre)
      && assezDeFaitsPourTitre({
        quetesFaites: quetesChapFait,
        entrees: ctx.entrees,
        apprentissages: ctx.apprentissages,
      })
    ) {
      let suggestion = genererTitreChapitreHeuristique({
        chapitre: chap,
        quetesFaites: quetesChapFait,
        entrees: ctx.entrees,
        apprentissages: ctx.apprentissages,
      });
      sourceTitre = 'heuristic';

      if (anthropicConfigured()) {
        try {
          const { text } = await askClaude(
            'Titre de chapitre Chroniques TWIY. JSON only: {"titre":"...","resume_public":"..."}. Court, punchy, basé UNIQUEMENT sur les faits.',
            JSON.stringify({
              chapitre: chap,
              quetes_faites: quetesChapFait.slice(0, 12),
              entrees: ctx.entrees.slice(0, 15),
              brouillon: suggestion,
            }),
            350,
          );
          const m = text.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(m ? m[0] : text);
          if (parsed?.titre) {
            suggestion = {
              titre: parsed.titre,
              resume_public: parsed.resume_public || suggestion.resume_public,
            };
            sourceTitre = 'ia';
          }
        } catch {
          /* keep heuristic */
        }
      }

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
      quetesFaites: quetesChapFait,
      quetesActives: quetesChapActives,
      entrees: ctx.entrees,
      streaks: ctx.streaks,
      apprentissages: ctx.apprentissages,
      chapitre: chapitreCourant,
      ere: ctx.ere,
    });

    // Prefer real chapter titre in the Chronique header when available
    if (chapitreCourant?.titre && !estTitreGenerique(chapitreCourant.titre)) {
      heuristic.titre = chapitreCourant.titre;
    }

    const ia = await enrichirClaude(heuristic, `Chapitre actif ${chapitreCourant.id}`);
    const out = ia || heuristic;

    res.json({
      ok: true,
      titre: out.titre,
      corps: out.corps,
      source: ia ? 'ia' : 'heuristic',
      chapitre: chapitreCourant,
      titre_mis_a_jour: titreMisAJour,
      source_titre: sourceTitre,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
