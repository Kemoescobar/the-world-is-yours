import express from 'express';
import { requireApiKey } from '../middleware/apiKey.js';
import { webhookRateLimit } from '../middleware/rateLimit.js';
import {
  loadQuetes,
  loadStreaks,
  loadEntrees7j,
  loadChapitreActif,
} from '../lib/dashboardData.js';

const router = express.Router();

/**
 * GET /api/coach/etat — lecture seule pour Claude Cowork (X-API-Key).
 * Agrège faits ouverts depuis les loaders dashboard (chantier 1).
 */
router.get('/etat', webhookRateLimit, requireApiKey, async (_req, res) => {
  try {
    const [quetes, streaks, entrees, chapitreActif] = await Promise.all([
      loadQuetes(),
      loadStreaks(),
      loadEntrees7j(),
      loadChapitreActif({ appliquerTitre: false }),
    ]);

    const quetesOuvertes = (quetes || [])
      .filter((q) => q.statut === 'a_faire' || q.statut === 'en_cours')
      .map((q) => ({
        id: q.id,
        titre: q.titre,
        type: q.type,
        statut: q.statut,
      }));

    res.json({
      quetes_ouvertes: quetesOuvertes,
      streaks: streaks || [],
      entrees: entrees || [],
      chapitre_actif: chapitreActif?.chapitre || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'échec coach/etat' });
  }
});

export default router;
