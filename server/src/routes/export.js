import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuthOrApiKey } from '../middleware/auth.js';
import { authSensitiveRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

router.use(authSensitiveRateLimit, requireAuthOrApiKey);

const TABLES = [
  'saisons', 'arcs', 'chapitres', 'quetes', 'quetes_historique', 'entrees', 'streaks',
  'instrumentaux', 'projets_dev', 'prospects', 'portefeuille_mouvements', 'objectifs_epargne', 'config',
  'apprentissages', 'eres', 'competences', 'competences_preuves',
  'rayonnement_evenements', 'suggestions_contremaitre',
];

router.get('/', async (req, res) => {
  const dump = {};
  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) return res.status(500).json({ error: `${table}: ${error.message}` });
    dump[table] = data;
  }
  res.setHeader('Content-Disposition', `attachment; filename="twiy-export-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(dump);
});

export default router;
