/**
 * Chronique API — récit déterministe (heuristique). LLM débranché.
 */
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { loadChroniqueJour, loadChapitreActif } from '../lib/dashboardData.js';

const router = express.Router();
router.use(requireAuth);

/** GET /api/chronique/jour — récit du jour / 7 derniers jours. */
router.get('/jour', async (_req, res) => {
  try {
    const out = await loadChroniqueJour();
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/chronique/chapitre-actif
 * Query: ?appliquer_titre=1 pour écrire le titre heuristique si générique.
 */
router.get('/chapitre-actif', async (req, res) => {
  try {
    const appliquer = req.query.appliquer_titre === '1' || req.query.appliquer_titre === 'true';
    const out = await loadChapitreActif({ appliquerTitre: appliquer });
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
