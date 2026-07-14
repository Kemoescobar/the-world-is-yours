import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error(`
[TWIY] Variables manquantes au démarrage :
  SUPABASE_URL=${url ? 'ok' : 'VIDE'}
  SUPABASE_SERVICE_KEY=${key ? 'ok' : 'VIDE'}

Sur Railway → service → Variables, ajoute-les depuis server/.env local, puis Redeploy.
`);
  process.exit(1);
}

// Le backend est SEUL autorisé à utiliser la clé service_role.
export const supabase = createClient(url, key);
