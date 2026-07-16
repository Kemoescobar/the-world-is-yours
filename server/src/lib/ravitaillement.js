/**
 * Ravitaillement — sélection compétence + brouillons de quêtes (Dev / Beatmaker).
 * Croisement hors scope.
 */

export const ARCS_RAVITAILLEMENT = ['dev', 'beatmaker'];
/** Besoin de refill si actifs < cible (lot de 3). */
export const ACTIVES_TARGET = 3;
/** Taille d’un lot proposé (exactement 3 quand l’arc est vide). */
export const LOT_SIZE = 3;

const NIVEAU_ORDER = { initiation: 0, pratique: 1, maitrise: 2 };

export function roadmapSortKey(comp) {
  const src = String(comp.source_roadmap || '');
  const learn = src.match(/LearnByDoing-S(\d+)(?:-C(\d+))?/i);
  if (learn) {
    return [Number(learn[1]), Number(learn[2] || 0)];
  }
  const beatP = src.match(/Beatmaker-P(\d+)/i);
  if (beatP) return [Number(beatP[1]), 0];
  const ss = src.match(/SS(\d+)/i);
  if (ss) return [Number(ss[1]), 0];
  return [9999, 0];
}

export function sortCompetencesRoadmap(comps) {
  return [...comps].sort((a, b) => {
    const na = NIVEAU_ORDER[a.niveau_requis] ?? 9;
    const nb = NIVEAU_ORDER[b.niveau_requis] ?? 9;
    if (na !== nb) return na - nb;
    const ka = roadmapSortKey(a);
    const kb = roadmapSortKey(b);
    return ka[0] - kb[0] || ka[1] - kb[1] || String(a.titre).localeCompare(String(b.titre));
  });
}

export function quetesActivesArc(quetes, arcId) {
  return (quetes || []).filter(
    (q) => q.type === arcId && q.statut !== 'fait' && q.statut !== 'abandonne',
  );
}

export function preuveSetFromRows(preuves) {
  return new Set((preuves || []).map((p) => p.competence_id));
}

export function prerequisSatisfaits(comp, preuvesIds) {
  const prereqs = Array.isArray(comp.prerequis) ? comp.prerequis : [];
  if (!prereqs.length) return true;
  return prereqs.every((id) => preuvesIds.has(id));
}

export function competenceCouverture(comp, quetes, preuvesIds) {
  if (preuvesIds.has(comp.id)) return 'prouvee';
  const linked = (quetes || []).filter((q) => q.competence_id === comp.id);
  if (linked.some((q) => q.statut === 'fait')) return 'quete_faite';
  if (linked.some((q) => q.statut === 'a_faire' || q.statut === 'en_cours')) return 'en_cours';
  return 'ouverte';
}

/**
 * Prochaine compétence éligible : ordre roadmap + niveau, prereqs OK, non couverte / non saturée.
 */
export function choisirCompetence(comps, quetes, preuvesIds, opts = {}) {
  const skipIds = new Set(opts.skipCompetenceIds || []);
  const ordered = sortCompetencesRoadmap(comps || []);
  for (const c of ordered) {
    if (skipIds.has(c.id)) continue;
    if (!prerequisSatisfaits(c, preuvesIds)) continue;
    const cov = competenceCouverture(c, quetes, preuvesIds);
    if (cov === 'ouverte') return c;
  }
  return null;
}

function extraireProjet(description) {
  if (!description) return null;
  const m = String(description).match(/Projet:\s*([^\n]+)/i);
  if (!m) return null;
  return m[1].trim().replace(/\.\s*$/, '').slice(0, 200);
}

function titreCourt(titre) {
  return String(titre || '')
    .replace(/^S\d+\s*[—–-]\s*/i, '')
    .replace(/^fCC\s*[—–-]\s*/i, '')
    .trim()
    .slice(0, 80);
}

/**
 * Génère N titres concrets pour une compétence (pas le titre brut seul).
 */
export function genererDrafts(comp, besoin) {
  const n = Math.max(0, Math.min(LOT_SIZE, besoin));
  if (!n || !comp) return [];

  const short = titreCourt(comp.titre);
  const projet = extraireProjet(comp.description);
  const candidats = [];

  if (projet) candidats.push(projet);

  if (/certification|fCC|DL\.AI|CS50|n8n|Anthropic|AWS|Microsoft Learn/i.test(
    `${comp.titre} ${comp.description || ''}`,
  )) {
    candidats.push(`Avancer le parcours ${short} — session du jour`);
    candidats.push(`Valider un checkpoint ${short}`);
    candidats.push(`Documenter ${short} — note + preuve`);
  } else {
    candidats.push(`Pratiquer : ${short} — livrable concret`);
    candidats.push(`Appliquer ${short} sur un beat / projet en cours`);
    candidats.push(`Documenter ${short} — capture + note`);
  }

  if (comp.niveau_requis === 'initiation') {
    candidats.push(`Premier pas — ${short}`);
  } else if (comp.niveau_requis === 'maitrise') {
    candidats.push(`Peaufiner ${short} — version publiable`);
  }

  const seen = new Set();
  const out = [];
  for (const titre of candidats) {
    const t = String(titre).trim().slice(0, 200);
    if (!t || seen.has(t.toLowerCase())) continue;
    // Ne jamais proposer uniquement le titre brut de la compétence
    if (t.toLowerCase() === String(comp.titre).trim().toLowerCase()) continue;
    seen.add(t.toLowerCase());
    out.push({
      titre: t,
      competence_id: comp.id,
      type: comp.arc_id,
    });
    if (out.length >= n) break;
  }

  // Fallback si trop peu de variantes
  while (out.length < n) {
    const titre = `${short} — étape ${out.length + 1}`;
    if (seen.has(titre.toLowerCase())) break;
    seen.add(titre.toLowerCase());
    out.push({ titre, competence_id: comp.id, type: comp.arc_id });
  }

  return out;
}

export function labelArc(arcId) {
  if (arcId === 'dev') return 'Dev';
  if (arcId === 'beatmaker') return 'Beatmaker';
  return arcId;
}

/**
 * Construit une proposition pour un arc (ou signal roadmap terminée).
 * Lot : remplit jusqu’à ACTIVES_TARGET (exactement LOT_SIZE si arc vide).
 * Parcourt plusieurs compétences si besoin pour compléter le lot.
 */
export function preparerPropositionArc({
  arcId,
  competences,
  quetes,
  preuves,
  skipCompetenceIds = [],
}) {
  const actives = quetesActivesArc(quetes, arcId);
  if (actives.length >= ACTIVES_TARGET) {
    return {
      trigger: false,
      actives: actives.length,
      note: `assez d'actifs (${actives.length})`,
    };
  }

  const besoin = Math.max(1, Math.min(LOT_SIZE, ACTIVES_TARGET - actives.length));
  const preuvesIds = preuveSetFromRows(preuves);
  const compsArc = (competences || []).filter((c) => c.arc_id === arcId && c.source_roadmap);

  const drafts = [];
  const competencesUtilisees = [];
  const skip = new Set(skipCompetenceIds);
  // Quêtes virtuelles pour éviter de resaturer la même compétence dans le lot
  const quetesVirtuelles = [...(quetes || [])];

  while (drafts.length < besoin) {
    const competence = choisirCompetence(compsArc, quetesVirtuelles, preuvesIds, {
      skipCompetenceIds: [...skip],
    });
    if (!competence) break;

    const remaining = besoin - drafts.length;
    const batch = genererDrafts(competence, remaining);
    if (!batch.length) {
      skip.add(competence.id);
      continue;
    }

    drafts.push(...batch);
    competencesUtilisees.push(competence);
    skip.add(competence.id);
    // Marque la compétence comme saturée pour la suite du lot
    for (const d of batch) {
      quetesVirtuelles.push({
        competence_id: d.competence_id,
        type: d.type,
        statut: 'a_faire',
      });
    }
  }

  if (!drafts.length) {
    return {
      trigger: true,
      actives: actives.length,
      roadmap_terminee: true,
      message: `roadmap ${labelArc(arcId)} terminée`,
      competence: null,
      drafts: [],
    };
  }

  const primary = competencesUtilisees[0];
  return {
    trigger: true,
    actives: actives.length,
    roadmap_terminee: false,
    competence: primary,
    drafts,
    cible: ACTIVES_TARGET,
    lot: drafts.length,
  };
}
