/**
 * Chronique + titres + revue — heuristiques déterministes (pas d'IA requise).
 * Ne invente pas d'historique : s'appuie uniquement sur titres/faits fournis.
 */

const TITRES_GENERIQUES = [
  /^chapitre\s*0/i,
  /amor[cç]age/i,
  /^s\d+\s*[—–-]/i,
  /^chapitre\s+\d+\s*[—–-]\s*amor/i,
  /^sans titre$/i,
  /^untitled$/i,
];

const ARC_LABEL = {
  dev: 'Dev',
  beatmaker: 'Beatmaker',
  croisement: 'Croisement',
  freelance: 'Freelance',
  routine: 'Routine',
};

/** Titre seed / placeholder à remplacer dès qu'il y a assez de faits. */
export function estTitreGenerique(titre) {
  if (!titre || !String(titre).trim()) return true;
  const t = String(titre).trim();
  return TITRES_GENERIQUES.some((re) => re.test(t));
}

export function assezDeFaitsPourTitre({ quetesFaites = [], entrees = [], apprentissages = [] } = {}) {
  return quetesFaites.length >= 2
    || entrees.length >= 3
    || (quetesFaites.length >= 1 && entrees.length >= 1)
    || apprentissages.length >= 1;
}

function nettoyerTitreCourt(s, max = 56) {
  const t = String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s›>·-]+/, '')
    .trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function extraireMotsCles(textes = [], max = 4) {
  const stop = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'à', 'au', 'aux',
    'pour', 'avec', 'sans', 'sur', 'dans', 'par', 'en', 'ce', 'cette', 'the', 'a',
    'session', 'bloc', 'quête', 'quete', 'jour', 'du', 'ne', 'pas', 'court', 'courte',
  ]);
  const scores = new Map();
  for (const raw of textes) {
    const words = String(raw || '')
      .split(/[\s/|·,—–-]+/)
      .map((w) => w.replace(/[^\p{L}\p{N}+#.-]/gu, ''))
      .filter((w) => w.length >= 3 && !stop.has(w.toLowerCase()));
    for (const w of words.slice(0, 6)) {
      const key = w;
      scores.set(key, (scores.get(key) || 0) + 1);
    }
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([w]) => w);
}

function streakPhrase(streaks = []) {
  const actifs = (streaks || [])
    .filter((s) => (s.jours_consecutifs || 0) > 0)
    .sort((a, b) => (b.jours_consecutifs || 0) - (a.jours_consecutifs || 0));
  if (!actifs.length) return null;
  const top = actifs.slice(0, 2).map((s) => {
    const label = s.id === 'miprod' ? 'Beatmaker' : s.id === 'dev' ? 'Dev' : s.id;
    return `${label} ${s.jours_consecutifs}j`;
  });
  return `Les streaks tiennent : ${top.join(' · ')}.`;
}

function listerTitresFaits(quetesFaites = [], entrees = [], limit = 3) {
  const fromQuetes = quetesFaites
    .map((q) => q.titre)
    .filter(Boolean);
  const fromEntrees = entrees
    .map((e) => e.detail || e.titre)
    .filter(Boolean);
  const merged = [...fromQuetes, ...fromEntrees];
  const uniq = [];
  for (const t of merged) {
    const n = nettoyerTitreCourt(t, 72);
    if (n && !uniq.includes(n)) uniq.push(n);
    if (uniq.length >= limit) break;
  }
  return uniq;
}

/**
 * Titre de chapitre à partir des faits réels (jamais inventé).
 * @returns {{ titre: string, resume_public: string }}
 */
export function genererTitreChapitreHeuristique({
  chapitre = null,
  quetesFaites = [],
  entrees = [],
  apprentissages = [],
} = {}) {
  const titres = listerTitresFaits(quetesFaites, entrees, 5);
  const mots = extraireMotsCles(titres, 3);
  const arc = chapitre?.arc_id ? (ARC_LABEL[chapitre.arc_id] || chapitre.arc_id) : null;
  const semaine = chapitre?.semaine || null;

  let titre;
  if (titres.length >= 2) {
    const a = nettoyerTitreCourt(titres[0], 28);
    const b = nettoyerTitreCourt(titres[1], 28);
    titre = `${a} / ${b}`;
  } else if (titres.length === 1) {
    titre = nettoyerTitreCourt(titres[0], 52);
  } else if (mots.length) {
    titre = mots.join(' · ');
  } else if (apprentissages.length) {
    titre = nettoyerTitreCourt(apprentissages[0].titre || 'Déclic', 52);
  } else {
    titre = arc && semaine ? `${arc} — ${semaine}` : (arc || 'Chapitre en cours');
  }

  if (arc && !String(titre).toLowerCase().includes(String(arc).toLowerCase()) && titre.length < 40) {
    titre = `${arc} — ${titre}`;
  }

  const resumeParts = [];
  if (quetesFaites.length) {
    resumeParts.push(`${quetesFaites.length} quête(s) close(s)`);
  }
  if (entrees.length) {
    resumeParts.push(`${entrees.length} fait(s) capturé(s)`);
  }
  if (titres[0]) {
    resumeParts.push(`dont « ${nettoyerTitreCourt(titres[0], 40)} »`);
  }

  return {
    titre: nettoyerTitreCourt(titre, 72),
    resume_public: resumeParts.length
      ? `${resumeParts.join(' · ')}.`
      : 'Chapitre nourri par les faits du chantier.',
  };
}

/**
 * Chronique du jour / chapitre actif — 2 à 5 phrases récit, pas un dump de stats.
 * @returns {{ titre: string, corps: string }}
 */
export function genererChroniqueHeuristique({
  mode = 'jour',
  quetesFaites = [],
  quetesActives = [],
  entrees = [],
  streaks = [],
  apprentissages = [],
  chapitre = null,
  ere = null,
} = {}) {
  const faits = listerTitresFaits(quetesFaites, entrees, 3);
  const phrases = [];

  const titreBase = chapitre && !estTitreGenerique(chapitre.titre)
    ? chapitre.titre
    : (faits[0]
      ? nettoyerTitreCourt(faits[0], 48)
      : (mode === 'chapitre' ? 'Chapitre en cours' : 'Chronique du jour'));

  if (faits.length) {
    if (faits.length === 1) {
      phrases.push(`Cette séquence s’écrit autour de « ${faits[0]} » — un vrai jalon, pas un compteur.`);
    } else {
      phrases.push(
        `La semaine tient sur quelques gestes concrets : ${faits.slice(0, 2).map((f) => `« ${f} »`).join(' puis ')}${faits[2] ? `, et encore « ${faits[2]} »` : ''}.`,
      );
    }
  } else if (quetesActives.length) {
    const prochaines = quetesActives
      .slice(0, 2)
      .map((q) => q.titre)
      .filter(Boolean);
    if (prochaines.length) {
      phrases.push(
        `Pas encore de clôture marquante — le chantier avance sur ${prochaines.map((t) => `« ${nettoyerTitreCourt(t, 40)} »`).join(' et ')}.`,
      );
    } else {
      phrases.push('Le chantier est ouvert : les quêtes attendent d’être tranchées.');
    }
  } else {
    phrases.push('Silence relatif sur le chantier — aucune quête close récente à raconter.');
  }

  if (quetesFaites.length && quetesActives.length) {
    phrases.push(
      `${quetesFaites.length} close(s), ${quetesActives.length} encore en jeu — l’arc ne se juge pas au volume, mais à ce qui reste à tenir.`,
    );
  } else if (quetesFaites.length >= 3) {
    phrases.push(`Le rythme est là : ${quetesFaites.length} quêtes déjà placées dans le récit.`);
  }

  const streak = streakPhrase(streaks);
  if (streak) phrases.push(streak);

  if (apprentissages.length) {
    const a = apprentissages[0];
    phrases.push(
      `Ce que ça change : ${a.type || 'déclic'} — « ${nettoyerTitreCourt(a.titre || a.contenu, 60)} ».`,
    );
  }

  if (ere?.nom) {
    phrases.push(`Ça nourrit l’ère « ${nettoyerTitreCourt(ere.nom, 40)} » — chaque fait doit servir l’objectif, pas juste remplir la grille.`);
  } else if (chapitre?.arc_id) {
    const arc = ARC_LABEL[chapitre.arc_id] || chapitre.arc_id;
    phrases.push(`Sur l’arc ${arc}, le chapitre ${chapitre.semaine || 'ouvert'} se construit a posteriori — le titre suivra les faits.`);
  }

  const corps = phrases.slice(0, 5).join(' ');

  return {
    titre: nettoyerTitreCourt(titreBase, 64),
    corps,
  };
}

/**
 * Revue hebdo en prose (fallback sans Anthropic).
 * @returns {string}
 */
export function genererRevueHeuristique({
  entrees = [],
  quetes = [],
  streaks = [],
  apprentissages = [],
  contremaitre = null,
} = {}) {
  const faites = (quetes || []).filter((q) => q.statut === 'fait');
  const faits = listerTitresFaits(faites, entrees, 4);
  const lines = [];

  lines.push('Revue — récit de la semaine');
  lines.push('');

  if (faits.length) {
    lines.push(
      `Cette semaine ne se résume pas à un tableau : elle a des scènes. ${faits.map((f) => `« ${f} »`).join(', ')}${faits.length > 1 ? ' — autant de preuves que le chantier a bougé.' : ' a marqué le tempo.'}`,
    );
  } else {
    lines.push(
      'Peu de faits capturés cette semaine. Le récit est mince — ce n’est pas un échec de dashboard, c’est un signal : soit tu n’as pas agi, soit tu n’as pas documenté.',
    );
  }

  lines.push('');
  lines.push(
    `Quêtes closes : ${faites.length} sur ${quetes.length || 0}. ${faites.length === 0 ? 'Rien à clôturer n’est pas un badge de sagesse — c’est souvent de l’évitement.' : 'Chaque clôture est une phrase du chapitre, pas un point XP.'}`,
  );

  const streak = streakPhrase(streaks);
  if (streak) {
    lines.push('');
    lines.push(streak);
  }

  if ((apprentissages || []).length) {
    lines.push('');
    lines.push('Ce que tu as appris');
    for (const a of apprentissages.slice(0, 4)) {
      lines.push(`› ${a.type || 'note'} — ${a.titre || a.contenu || '…'}`);
    }
  } else {
    lines.push('');
    lines.push('Aucun apprentissage nommé cette semaine — un déclic non écrit disparaît.');
  }

  if (contremaitre?.ressource_titre) {
    lines.push('');
    lines.push(`Contremaître encore ouvert : « ${contremaitre.ressource_titre} ». Utile ou pas — tranche.`);
  }

  lines.push('');
  lines.push('Prochaine étape : une quête qui prouve le chapitre, pas une intention.');

  return lines.join('\n');
}
