/**
 * Seed competences from docs/roadmaps/ ONLY (no invented rows).
 * Usage: node scripts/seed-competences-from-roadmaps.mjs [--sql-only]
 * Requires SUPABASE_URL + SUPABASE_SERVICE_KEY in env (or server/.env).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const ROADMAPS = path.join(root, 'docs', 'roadmaps');
const HTML = path.join(ROADMAPS, 'roadmap-beatmaker.html');
const sqlOnly = process.argv.includes('--sql-only');

/** Curated from BigFis_LearnByDoing_FINAL_v7.pdf text extract (CERTIFICATION ACTIVE). S13/S15 = sprints projet sans cert nommée → omis. */
const BIGFIS_CERTS = [
  { s: 1, titre: 'fCC — Responsive Web Design', niveau: 'initiation' },
  { s: 2, titre: 'fCC — Responsive Web Design (fin)', niveau: 'initiation' },
  { s: 2, titre: 'Anthropic Claude 101', niveau: 'initiation' },
  { s: 3, titre: 'fCC — JS Algorithms & Data Structures', niveau: 'initiation' },
  { s: 3, titre: 'Building with Claude API', niveau: 'initiation' },
  { s: 4, titre: 'CS50P — psets cœur', niveau: 'initiation' },
  { s: 4, titre: 'DL.AI Prompt Engineering', niveau: 'initiation' },
  { s: 4, titre: 'LangChain', niveau: 'pratique' },
  { s: 4, titre: 'AI Fluency', niveau: 'initiation' },
  { s: 5, titre: 'fCC — Back End Development and APIs (Node+Express)', niveau: 'pratique' },
  { s: 5, titre: 'n8n Academy Beginner', niveau: 'pratique' },
  { s: 6, titre: 'fCC — Relational Database (PostgreSQL+Bash)', niveau: 'pratique' },
  { s: 6, titre: 'n8n Academy Advanced', niveau: 'pratique' },
  { s: 6, titre: 'SQL Murder Mystery', niveau: 'pratique' },
  { s: 7, titre: 'fCC — Front End Libraries (React+Redux)', niveau: 'pratique' },
  { s: 8, titre: 'Docker — Play with Docker + Get Started', niveau: 'pratique' },
  { s: 8, titre: 'Make Academy', niveau: 'pratique' },
  { s: 8, titre: 'Zapier', niveau: 'pratique' },
  { s: 9, titre: 'Microsoft Learn — TypeScript', niveau: 'pratique' },
  { s: 10, titre: 'DL.AI Agentic RAG', niveau: 'maitrise' },
  { s: 10, titre: 'LlamaIndex', niveau: 'maitrise' },
  { s: 10, titre: 'MCP Advanced', niveau: 'maitrise' },
  { s: 11, titre: 'DL.AI LangGraph', niveau: 'maitrise' },
  { s: 11, titre: 'Anthropic Agent Skills', niveau: 'maitrise' },
  { s: 12, titre: 'Anthropic MCP Intro', niveau: 'maitrise' },
  { s: 12, titre: 'DeepLearning.AI CrewAI', niveau: 'maitrise' },
  { s: 14, titre: 'AWS Cloud Practitioner', niveau: 'maitrise' },
  { s: 14, titre: 'Anthropic Bedrock', niveau: 'maitrise' },
  { s: 14, titre: 'Google GenAI', niveau: 'maitrise' },
];

function unescapeJs(s) {
  return s.replace(/\\'/g, "'").replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
}

function extractBracket(src, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < src.length; i += 1) {
    if (src[i] === '[') depth += 1;
    else if (src[i] === ']') {
      depth -= 1;
      if (depth === 0) return src.slice(openIdx, i + 1);
    }
  }
  return null;
}

function parseStringArray(chunk, key) {
  const m = chunk.match(new RegExp(`${key}:\\s*\\[`));
  if (!m) return [];
  const open = chunk.indexOf('[', m.index);
  const arr = extractBracket(chunk, open);
  if (!arr) return [];
  return [...arr.matchAll(/'((?:\\.|[^'\\])*)'/g)].map((x) => unescapeJs(x[1]));
}

function parseResources(chunk) {
  const m = chunk.match(/resources:\s*\[/);
  if (!m) return [];
  const open = chunk.indexOf('[', m.index);
  const arr = extractBracket(chunk, open);
  if (!arr) return [];
  const out = [];
  const re = /\{\s*type:\s*'([^']+)'\s*,\s*name:\s*'((?:\\.|[^'\\])*)'\s*,\s*url:\s*'((?:\\.|[^'\\])*)'\s*\}/g;
  let rm;
  while ((rm = re.exec(arr))) {
    out.push({ type: rm[1], name: unescapeJs(rm[2]), url: unescapeJs(rm[3]) });
  }
  return out;
}

function parseBeatmaker() {
  const html = fs.readFileSync(HTML, 'utf8');
  const m = html.match(/const phases\s*=\s*\[/);
  if (!m) throw new Error('phases array introuvable dans roadmap-beatmaker.html');
  const open = html.indexOf('[', m.index);
  const phasesSrc = extractBracket(html, open);
  const phaseNames = [...phasesSrc.matchAll(/name:\s*'((?:\\.|[^'\\])*)'/g)].map((x) => unescapeJs(x[1]));

  const weekStarts = [...phasesSrc.matchAll(/\{\s*title:\s*'((?:\\.|[^'\\])*)'\s*,\s*label:\s*'([^']+)'/g)];
  const weeks = [];
  for (let i = 0; i < weekStarts.length; i += 1) {
    const wm = weekStarts[i];
    const next = weekStarts[i + 1];
    const chunk = phasesSrc.slice(wm.index, next ? next.index : phasesSrc.length);
    const title = unescapeJs(wm[1]);
    const label = wm[2];
    let phase = 1;
    for (let p = 0; p < phaseNames.length; p += 1) {
      const pos = phasesSrc.indexOf(`name: '${phaseNames[p].replace(/'/g, "\\'")}'`);
      // fallback: find by unescaped name occurrence before week
      const nameIdx = phasesSrc.indexOf(phaseNames[p]);
      if (nameIdx >= 0 && nameIdx < wm.index) phase = p + 1;
    }
    const goals = parseStringArray(chunk, 'goals');
    const skills = parseStringArray(chunk, 'skills');
    const resources = parseResources(chunk);
    const projM = chunk.match(/project:\s*'((?:\\.|[^'\\])*)'/);
    const project = projM ? unescapeJs(projM[1]) : '';
    weeks.push({ phase, phase_name: phaseNames[phase - 1] || '', label, title, goals, skills, resources, project });
  }
  return weeks;
}

function buildRows() {
  const rows = [];

  const byWeek = new Map();
  for (const c of BIGFIS_CERTS) {
    if (!byWeek.has(c.s)) byWeek.set(c.s, []);
    byWeek.get(c.s).push(c);
  }
  for (const [s, list] of [...byWeek.entries()].sort((a, b) => a[0] - b[0])) {
    list.forEach((c, idx) => {
      const src = list.length === 1 ? `LearnByDoing-S${s}` : `LearnByDoing-S${s}-C${idx + 1}`;
      rows.push({
        arc_id: 'dev',
        titre: c.titre,
        description: `Certification active semaine S${s} (BigFis Learn By Doing v7). Source: docs/roadmaps/BigFis_LearnByDoing_FINAL_v7.pdf`,
        prerequis: [],
        niveau_requis: c.niveau,
        source_roadmap: src,
      });
    });
  }

  // Note gap: S13 / S15 = sprints projet (P3 / MadaAI) — pas de cert nommée dans le PDF → non seedées.

  const weeks = parseBeatmaker();
  for (const w of weeks) {
    const parts = [];
    if (w.phase_name) parts.push(`Phase: ${w.phase_name}`);
    if (w.goals.length) parts.push(`Objectifs: ${w.goals.join('; ')}`);
    if (w.skills.length) parts.push(`Skills: ${w.skills.join(', ')}`);
    if (w.project) parts.push(`Projet: ${w.project}`);
    if (w.resources.length) {
      parts.push(`Ressources: ${w.resources.map((r) => `${r.name} <${r.url}>`).join('; ')}`);
    }
    const niveau = w.phase <= 1 ? 'initiation' : w.phase <= 3 ? 'pratique' : 'maitrise';
    rows.push({
      arc_id: 'beatmaker',
      titre: `${w.label} — ${w.title}`,
      description: parts.join('\n').slice(0, 4000),
      prerequis: [],
      niveau_requis: niveau,
      source_roadmap: `Beatmaker-P${w.phase}-S${w.label}`,
    });
  }

  return rows;
}

function toSql(rows) {
  const esc = (s) => String(s ?? '').replace(/'/g, "''");
  const values = rows.map((r) => {
    return `(gen_random_uuid(), '${esc(r.arc_id)}', '${esc(r.titre)}', '${esc(r.description)}', '{}', '${esc(r.niveau_requis)}', '${esc(r.source_roadmap)}', now())`;
  });
  return `-- Seed compétences (idempotent sur source_roadmap)
delete from public.competences_preuves
where competence_id in (select id from public.competences where source_roadmap is not null);
delete from public.competences where source_roadmap is not null;

insert into public.competences (id, arc_id, titre, description, prerequis, niveau_requis, source_roadmap, cree_le)
values
${values.join(',\n')};
`;
}

async function main() {
  if (!fs.existsSync(HTML)) {
    console.error('Manque', HTML);
    process.exit(1);
  }
  const rows = buildRows();
  console.log(`Rows: ${rows.length} (dev=${rows.filter((r) => r.arc_id === 'dev').length}, beatmaker=${rows.filter((r) => r.arc_id === 'beatmaker').length})`);
  const sqlPath = path.join(root, 'supabase', 'seeds', 'competences_roadmaps.sql');
  fs.mkdirSync(path.dirname(sqlPath), { recursive: true });
  fs.writeFileSync(sqlPath, toSql(rows), 'utf8');
  console.log('Wrote', sqlPath);

  const jsonPath = path.join(root, 'tmp', 'competences-seed.json');
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2), 'utf8');
  console.log('Wrote', jsonPath);

  const note = path.join(ROADMAPS, 'README.md');
  fs.writeFileSync(note, `# Roadmaps TWIY

- \`BigFis_LearnByDoing_FINAL_v7.pdf\` — Dev / Learn By Doing (15 sem., certifs seedées via \`scripts/seed-competences-from-roadmaps.mjs\`)
- \`roadmap-beatmaker.html\` — Beatmaker (5 phases / semaines S1–S21-24)

## Seed gaps (BigFis)

- **S13** et **S15** : sprints projet (P3 RAG / MadaAI) **sans certification nommée** dans le PDF → **aucune ligne inventée**.
- Re-seed : \`node scripts/seed-competences-from-roadmaps.mjs\` (nécessite \`SUPABASE_SERVICE_KEY\`).
`, 'utf8');

  if (sqlOnly) return;

  const { config } = await import('dotenv');
  config({ path: path.join(root, 'server', '.env') });
  config({ path: path.join(root, '.env') });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.warn('Pas de SUPABASE_* — SQL écrit seulement. Appliquer seeds/competences_roadmaps.sql via MCP ou psql.');
    return;
  }
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Idempotent: delete previous roadmap seeds then insert
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
  console.log('Inserted', data?.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
