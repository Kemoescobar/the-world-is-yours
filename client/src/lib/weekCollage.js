/**
 * Heuristic collage model from week activity — no IA required.
 * Returns layers for ChroniqueCollage (SVG/CSS).
 */

function dayKey(iso) {
  return String(iso || '').slice(0, 10);
}

function fragment(text, max = 28) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}

/** Activity counts for last 7 days (oldest → newest). */
export function activitySparkline(entrees = [], quetes = []) {
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(dayKey(d.toISOString()));
  }
  const counts = Object.fromEntries(days.map((k) => [k, 0]));
  for (const e of entrees) {
    const k = dayKey(e.cree_le);
    if (k in counts) counts[k] += 1;
  }
  for (const q of quetes) {
    if (q.statut !== 'fait') continue;
    const k = dayKey(q.fait_le || q.maj_le || q.cree_le);
    if (k in counts) counts[k] += 1;
  }
  return days.map((k) => counts[k]);
}

/**
 * @param {{ entrees?: object[], quetes?: object[], titre?: string, corps?: string }} input
 */
export function buildWeekCollage(input = {}) {
  const entrees = input.entrees || [];
  const quetes = input.quetes || [];
  const spark = activitySparkline(entrees, quetes);
  const maxSpark = Math.max(1, ...spark);

  const texts = [];
  for (const e of entrees.slice(0, 8)) {
    const t = fragment(e.detail || e.type_fait);
    if (t) texts.push({ text: t, kind: 'entree', rot: ((texts.length * 17) % 21) - 10 });
  }
  for (const q of quetes.filter((x) => x.statut === 'fait').slice(0, 5)) {
    const t = fragment(q.titre || q.nom || 'quête');
    if (t) texts.push({ text: t, kind: 'quete', rot: ((texts.length * 13) % 19) - 9 });
  }
  if (input.titre) {
    texts.unshift({ text: fragment(input.titre, 36), kind: 'titre', rot: -4 });
  }
  if (!texts.length && input.corps) {
    const first = fragment(String(input.corps).split(/[.!?\n]/)[0], 40);
    if (first) texts.push({ text: first, kind: 'corps', rot: -2 });
  }
  if (!texts.length) {
    texts.push({ text: 'semaine en cours', kind: 'empty', rot: -3 });
  }

  const seed = spark.reduce((a, b) => a + b, 0) + texts.length * 3;
  const stamps = [
    { label: 'TWIY', x: 8, y: 18, rot: -12 },
    { label: 'SHIP', x: 72, y: 78, rot: 8 },
    { label: `${entrees.length}F`, x: 78, y: 22, rot: 6 },
    { label: `${quetes.filter((q) => q.statut === 'fait').length}Q`, x: 12, y: 82, rot: -7 },
  ];

  return {
    spark,
    maxSpark,
    texts: texts.slice(0, 7),
    stamps,
    seed: seed % 97,
    nEntrees: entrees.length,
    nQuetesFaites: quetes.filter((q) => q.statut === 'fait').length,
  };
}
