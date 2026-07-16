import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuthOrApiKey } from '../middleware/auth.js';
import { construireEmploiDuTemps } from '../lib/emploiDuTemps.js';
import { askClaude, anthropicConfigured } from '../lib/claude.js';

const router = express.Router();
router.use(requireAuthOrApiKey);

/**
 * GET /api/emploi-du-temps
 * Plan du jour déterministe (Madagascar TZ) depuis quêtes + streaks.
 * Query ?ia=1 → conseil one-liner Claude si clé dispo (slots restent heuristiques).
 */
router.get('/', async (req, res) => {
  try {
    const [{ data: quetes, error: qErr }, { data: streaks, error: sErr }, { data: contre }] = await Promise.all([
      supabase.from('quetes').select('*').neq('statut', 'abandonne'),
      supabase.from('streaks').select('*'),
      supabase
        .from('suggestions_contremaitre')
        .select('id, ressource_titre, ressource_url, statut')
        .eq('statut', 'proposee')
        .order('date_proposition', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (qErr) return res.status(500).json({ error: qErr.message });
    if (sErr) return res.status(500).json({ error: sErr.message });

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

    const wantIa = String(req.query.ia || '') === '1';
    if (wantIa && anthropicConfigured()) {
      try {
        const { text } = await askClaude(
          `TWIY — conseil emploi du temps. Français, 1–2 phrases max, direct, pas de fluff.
Réagis au plan heuristique (ne réinvente pas les quêtes).`,
          JSON.stringify({
            bloc: plan.bloc_actuel,
            streaks_a_risque: plan.streaks_a_risque,
            slots: plan.slots.map((s) => ({
              id: s.id,
              focus: s.focus,
              actions: s.actions.map((a) => a.titre),
            })),
            note: plan.note_contexte,
          }),
          180,
        );
        if (text?.trim()) {
          plan.conseil_ia = text.trim();
          plan.source = 'heuristic+ia';
        }
      } catch {
        // soft — plan heuristique reste valide
      }
    }

    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
