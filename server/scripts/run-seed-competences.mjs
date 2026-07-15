import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const jsonPath = path.join(root, 'tmp', 'competences-seed.json');

if (!fs.existsSync(jsonPath)) {
  console.error('Manque tmp/competences-seed.json — lance d’abord: node scripts/seed-competences-from-roadmaps.mjs --sql-only');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_KEY manquants');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const rows = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
console.log('Seeding', rows.length, 'compétences');

const { data: existing } = await supabase.from('competences').select('id').not('source_roadmap', 'is', null);
if (existing?.length) {
  const ids = existing.map((r) => r.id);
  await supabase.from('competences_preuves').delete().in('competence_id', ids);
  await supabase.from('competences').delete().in('id', ids);
}

const { data, error } = await supabase.from('competences').insert(rows).select('id, source_roadmap');
if (error) {
  console.error(error);
  process.exit(1);
}
console.log('Inserted', data.length);
