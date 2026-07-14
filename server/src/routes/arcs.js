import express from 'express';
import { supabase } from '../supabaseClient.js';
const router = express.Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('arcs').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json(data);
});

export default router;
