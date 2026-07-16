/**
 * Parse check-in langage naturel → faits Chroniques (sans Anthropic).
 * Ne crée pas d'historique inventé — découpe le texte fourni.
 */

const TYPE_RULES = [
  { re: /\b(commit|push|pr\b|pull request|github|gitlab|merge|auth|jwt|api|deploy|code|dev)\b/i, type_fait: 'commit', arc_id: 'dev' },
  { re: /\b(certif|certification|fcc|freecodecamp|cours|course|dipl[oô]me|aws|llama)\b/i, type_fait: 'certif', arc_id: 'dev' },
  { re: /\b(projet|project|feature|app|saas|twiy)\b/i, type_fait: 'projet', arc_id: 'dev' },
  { re: /\b(session|drum|beat|beatmaker|prod|mix|instru|instrumental|miprod|sample|arrangement)\b/i, type_fait: 'session_prod', arc_id: 'beatmaker' },
  { re: /\b(instru|loop|vinyl)\b/i, type_fait: 'instru', arc_id: 'beatmaker' },
  { re: /\b(sport|run|course|muscu|gym|salle|foot|basket|natation)\b/i, type_fait: 'sport', arc_id: null },
  { re: /\b(proposal|prospect|client|freelance|devis|relanc)\b/i, type_fait: 'proposal', arc_id: null },
  { re: /\b(qu[eê]te|quest)\b/i, type_fait: 'quete', arc_id: null },
];

function decouperPhrases(texte) {
  return String(texte || '')
    .split(/[\n;]+|(?:\s+et\s+)|(?:\s*,\s*(?=[A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜŒ0-9]))/i)
    .map((s) => s.replace(/^[-•›·\s]+/, '').trim())
    .filter((s) => s.length >= 3);
}

function classerPhrase(phrase) {
  for (const rule of TYPE_RULES) {
    if (rule.re.test(phrase)) {
      return { type_fait: rule.type_fait, arc_id: rule.arc_id, detail: phrase };
    }
  }
  // Défaut honnête : quete générique sans inventer un type faux
  return { type_fait: 'quete', arc_id: null, detail: phrase };
}

function extraireApprentissages(texte) {
  const brouillons = [];
  const re = /(?:j['’]ai appris|d[eé]clic|blocage\s+r[eé]solu|le[cç]on)\s*[:\-]?\s*(.+?)(?:[.!]|$)/gi;
  let m;
  while ((m = re.exec(texte)) && brouillons.length < 2) {
    const contenu = (m[1] || '').trim();
    if (contenu.length < 4) continue;
    const type = /blocage/i.test(m[0])
      ? 'blocage_resolu'
      : /d[eé]clic/i.test(m[0])
        ? 'declic'
        : 'principe';
    brouillons.push({
      titre: contenu.slice(0, 80),
      contenu,
      type,
      arc_id: null,
      tags: ['checkin'],
    });
  }
  return brouillons;
}

/**
 * @param {string} texte
 * @returns {{ entrees: Array, lecon: string|null, apprentissages_brouillon: Array }}
 */
export function parserCheckinHeuristique(texte) {
  const raw = String(texte || '').trim();
  const phrases = decouperPhrases(raw);
  const chunks = phrases.length ? phrases : (raw ? [raw] : []);

  const entrees = [];
  const seen = new Set();
  for (const p of chunks.slice(0, 8)) {
    const e = classerPhrase(p);
    const key = `${e.type_fait}|${e.detail.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entrees.push(e);
  }

  // Si une seule phrase longue sans découpe utile, garder 1 entrée
  if (!entrees.length && raw) {
    entrees.push(classerPhrase(raw.slice(0, 500)));
  }

  const apprentissages_brouillon = extraireApprentissages(raw);
  let lecon = null;
  if (apprentissages_brouillon[0]) {
    lecon = apprentissages_brouillon[0].contenu;
  }

  return { entrees, lecon, apprentissages_brouillon };
}
