import express from 'express';
import { requireAuthOrApiKey } from '../middleware/auth.js';
import { loadEmploiDuTemps } from '../lib/dashboardData.js';

const router = express.Router();
router.use(requireAuthOrApiKey);

/**
 * GET /api/emploi-du-temps
 * Plan du jour déterministe (Madagascar TZ). Query ?ia=1 ignorée (LLM débranché).
 */
router.get('/', async (_req, res) => {
  try {
    const plan = await loadEmploiDuTemps();
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
