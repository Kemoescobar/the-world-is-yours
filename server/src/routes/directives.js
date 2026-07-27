import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireApiKey } from '../middleware/apiKey.js';
import { validateBody } from '../middleware/validate.js';
import { createDirectiveSchema } from '../schemas.js';
import { webhookRateLimit } from '../middleware/rateLimit.js';
import { getActiveDirectives, insertDirective } from '../lib/directives.js';

const router = express.Router();

/**
 * POST /api/directives — Cowork / n8n (clé API).
 * Body { type, contenu, valide_jusqua? }
 */
router.post(
  '/',
  webhookRateLimit,
  requireApiKey,
  validateBody(createDirectiveSchema),
  async (req, res) => {
    try {
      const { type, contenu, valide_jusqua: valideJusqua } = req.body;
      const data = await insertDirective({
        type,
        contenu,
        valide_jusqua: valideJusqua || null,
        source: 'cowork',
      });
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

/**
 * GET /api/directives/active — auth user.
 * Query ?type= optionnel → une directive ou map par type.
 */
router.get('/active', requireAuth, async (req, res) => {
  try {
    const type = req.query.type ? String(req.query.type) : undefined;
    const data = await getActiveDirectives(type);
    res.json(data);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

export default router;
