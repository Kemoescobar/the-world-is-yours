import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { loadDashboard } from '../lib/dashboardData.js';

const router = express.Router();

/**
 * GET /api/dashboard — agrégat Chantier (Promise.all, sous-échec → null + erreurs).
 */
router.get('/', requireAuth, async (_req, res) => {
  try {
    const payload = await loadDashboard();
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message || 'échec dashboard' });
  }
});

export default router;
