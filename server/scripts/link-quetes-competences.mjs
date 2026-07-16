/**
 * Best-effort : rattache competence_id aux quêtes Dev/Beatmaker
 * dont le titre croise clairement une compétence. Ne force rien d'ambigu.
 *
 * Usage: cd server && node scripts/link-quetes-competences.mjs [--dry-run]
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const dry = process.argv.includes('--dry-run');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_KEY manquants');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

/** Correspondances explicites titre-quête → source_roadmap (évite les faux positifs). */
const EXPLICITES = [
  { type: 'dev', titreIncludes: ['API', 'Supabase'], source_roadmap: 'LearnByDoing-S5-C1' },
  { type: 'dev', titreIncludes: ['webhook', 'GitHub'], source_roadmap: 'LearnByDoing-S5-C2' },
  { type: 'dev', titreIncludes: ['Auth', 'routes'], source_roadmap: 'LearnByDoing-S7' },
  { type: 'beatmaker', titreIncludes: ['showcase'], source_roadmap: 'Beatmaker-P64-SS17' },
  { type: 'beatmaker', titreIncludes: ['Uploader', 'instrumental'], source_roadmap: 'Beatmaker-P64-SS17' },
];

function scoreTokens(queteTitre, compTitre) {
  const norm = (s) => String(s).toLowerCase()
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const qTokens = new Set(norm(queteTitre).split(/\s+/).filter((t) => t.length >= 4));
  const cTokens = norm(compTitre).split(/\s+/).filter((t) => t.length >= 4);
  if (!qTokens.size || !cTokens.length) return 0;
  let hit = 0;
  for (const t of cTokens) {
    if (qTokens.has(t)) hit += 1;
  }
  return hit / cTokens.length;
}

const { data: comps, error: cErr } = await supabase
  .from('competences')
  .select('id, arc_id, titre, source_roadmap')
  .in('arc_id', ['dev', 'beatmaker']);
if (cErr) {
  console.error(cErr);
  process.exit(1);
}

const byRoadmap = Object.fromEntries((comps || []).map((c) => [c.source_roadmap, c]));

const { data: quetes, error: qErr } = await supabase
  .from('quetes')
  .select('id, type, titre, competence_id, statut')
  .in('type', ['dev', 'beatmaker'])
  .is('competence_id', null);
if (qErr) {
  console.error(qErr);
  process.exit(1);
}

const updates = [];
for (const q of quetes || []) {
  let match = null;

  for (const rule of EXPLICITES) {
    if (rule.type !== q.type) continue;
    if (rule.titreIncludes.every((k) => q.titre.includes(k))) {
      match = byRoadmap[rule.source_roadmap] || null;
      break;
    }
  }

  if (!match) {
    const sameArc = (comps || []).filter((c) => c.arc_id === q.type);
    let best = null;
    let bestScore = 0;
    for (const c of sameArc) {
      const s = scoreTokens(q.titre, c.titre);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }
    // Seuil strict — mieux vaut null qu'un faux lien
    if (best && bestScore >= 0.45) match = best;
  }

  if (match) {
    updates.push({ id: q.id, titre: q.titre, competence_id: match.id, via: match.source_roadmap || match.titre });
  } else {
    console.log('skip (pas de match clair):', q.titre);
  }
}

console.log(dry ? '[dry-run]' : '[apply]', updates.length, 'liens');
for (const u of updates) {
  console.log(' →', u.titre, '⇒', u.via);
  if (!dry) {
    const { error } = await supabase
      .from('quetes')
      .update({ competence_id: u.competence_id })
      .eq('id', u.id);
    if (error) console.error(error.message, u.id);
  }
}
