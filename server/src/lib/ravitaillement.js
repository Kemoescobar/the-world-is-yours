/**
 * Ravitaillement — sélection compétence + drafts de quêtes (Dev / Beatmaker).
 * Chemin normal : insert auto en quetes (pas de proposition Accepter/Refuser).
 * Croisement hors scope.
 */

export const ARCS_RAVITAILLEMENT = ['dev', 'beatmaker'];
/** Besoin de refill si actifs < cible (lot de 3). */
export const ACTIVES_TARGET = 3;
/** Taille d’un lot proposé (exactement 3 quand l’arc est vide). */
export const LOT_SIZE = 3;

export function roadmapSortKey(comp) {
  const src = String(comp.source_roadmap || '');
  const learn = src.match(/LearnByDoing-S(\d+)(?:-C(\d+))?/i);
  if (learn) {
    return [Number(learn[1]), Number(learn[2] || 0)];
  }
  // Beatmaker-P{n}-SS{week} — trier par semaine (SS), pas seulement par phase P
  const beat = src.match(/Beatmaker-P(\d+)(?:-SS?(\d+(?:-\d+)?))?/i);
  if (beat) {
    const weekPart = String(beat[2] || '0').split('-')[0];
    return [Number(weekPart) || Number(beat[1]), Number(beat[1])];
  }
  const ss = src.match(/SS(\d+)/i);
  if (ss) return [Number(ss[1]), 0];
  return [9999, 0];
}

/** Ordre exact roadmap (source_roadmap) — pas de niveau-first qui casse S4-C3 / S4-C4. */
export function sortCompetencesRoadmap(comps) {
  return [...comps].sort((a, b) => {
    const ka = roadmapSortKey(a);
    const kb = roadmapSortKey(b);
    return ka[0] - kb[0] || ka[1] - kb[1] || String(a.titre).localeCompare(String(b.titre));
  });
}

/**
 * Chapitre « ouvert » pour un arc — même heuristique que Chantier.chapitrePourArc :
 * le plus récent par date_debut.
 */
export function chapitreCourantArc(chapitres, arcId) {
  return (chapitres || [])
    .filter((c) => c.arc_id === arcId)
    .sort((a, b) => String(b.date_debut).localeCompare(String(a.date_debut)))[0] || null;
}

/**
 * Types affichés sur la carte Chantier pour un arc (même filtre que `quetesPourArc`).
 * Dev regroupe routine + freelance + dev ; les autres arcs = type === arcId.
 */
export function typesAffichesArc(arcId) {
  if (arcId === 'dev') return ['dev', 'routine', 'freelance'];
  return [arcId];
}

/**
 * Actifs pour refill = quêtes non faites / non abandonnées visibles sur la carte arc.
 * Si `chapitreId` est fourni, ignore les a_faire hors chapitre (orphelins / anciens).
 * Aligné Chantier : refill quand la carte montre &lt; 3 non-fait.
 */
export function quetesActivesArc(quetes, arcId, opts = {}) {
  const chapitreId = opts.chapitreId;
  const types = new Set(typesAffichesArc(arcId));
  return (quetes || []).filter((q) => {
    if (!types.has(q.type)) return false;
    if (q.statut === 'fait' || q.statut === 'abandonne') return false;
    if (chapitreId != null) return q.chapitre_id === chapitreId;
    return true;
  });
}

export function preuveSetFromRows(preuves) {
  return new Set((preuves || []).map((p) => p.competence_id));
}

function prereqCouvertParQueteFaite(prereqId, quetes) {
  return (quetes || []).some((q) => q.competence_id === prereqId && q.statut === 'fait');
}

/**
 * Prérequis OK. Mode soft (ravitaillement) : preuve OU quête liée `fait`.
 * Mode strict (défaut) : preuve seulement.
 */
export function prerequisSatisfaits(comp, preuvesIds, opts = {}) {
  const prereqs = Array.isArray(comp.prerequis) ? comp.prerequis : [];
  if (!prereqs.length) return true;
  if (opts.softUnlockViaQueteFaite) {
    return prereqs.every(
      (id) => preuvesIds.has(id) || prereqCouvertParQueteFaite(id, opts.quetes),
    );
  }
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
 * Prochaine compétence éligible : ordre source_roadmap, prereqs OK, non couverte / non saturée.
 * opts.softUnlockViaQueteFaite — pour ravitaillement uniquement.
 */
export function choisirCompetence(comps, quetes, preuvesIds, opts = {}) {
  const skipIds = new Set(opts.skipCompetenceIds || []);
  const soft = Boolean(opts.softUnlockViaQueteFaite);
  const ordered = sortCompetencesRoadmap(comps || []);
  for (const c of ordered) {
    if (skipIds.has(c.id)) continue;
    if (!prerequisSatisfaits(c, preuvesIds, soft ? { softUnlockViaQueteFaite: true, quetes } : {})) {
      continue;
    }
    const cov = competenceCouverture(c, quetes, preuvesIds);
    if (cov === 'ouverte') return c;
  }
  return null;
}

/** Diagnostique pourquoi aucun draft : roadmap terminée vs bloqué prereqs. */
export function diagnostiquerAbsenceDrafts(comps, quetes, preuvesIds, opts = {}) {
  const soft = Boolean(opts.softUnlockViaQueteFaite);
  const ordered = sortCompetencesRoadmap(comps || []);
  if (!ordered.length) {
    return { roadmap_terminee: true, bloque_prereqs: false };
  }

  let ouverteBloquee = false;
  let ouverteEligible = false;
  let touteCouverte = true;

  for (const c of ordered) {
    const cov = competenceCouverture(c, quetes, preuvesIds);
    if (cov === 'ouverte') {
      touteCouverte = false;
      const ok = prerequisSatisfaits(c, preuvesIds, soft ? { softUnlockViaQueteFaite: true, quetes } : {});
      if (ok) ouverteEligible = true;
      else ouverteBloquee = true;
    }
  }

  if (ouverteEligible) {
    return { roadmap_terminee: false, bloque_prereqs: false };
  }
  if (ouverteBloquee) {
    return { roadmap_terminee: false, bloque_prereqs: true };
  }
  return { roadmap_terminee: touteCouverte || true, bloque_prereqs: false };
}

function extraireProjet(description) {
  if (!description) return null;
  const m = String(description).match(/Projet:\s*([^\n]+)/i);
  if (!m) return null;
  return m[1].trim().replace(/\.\s*$/, '').slice(0, 200);
}

function extrairePremierObjectif(description) {
  if (!description) return null;
  const m = String(description).match(/Objectifs:\s*([^\n]+)/i);
  if (!m) return null;
  const first = m[1].split(';').map((s) => s.trim()).find(Boolean);
  if (!first) return null;
  return first.replace(/\.\s*$/, '').slice(0, 200);
}

function titreCourt(titre) {
  return String(titre || '')
    .replace(/^S\d+\s*[—–-]\s*/i, '')
    .replace(/^fCC\s*[—–-]\s*/i, '')
    .trim()
    .slice(0, 80);
}

/** Préfixe un verbe d’action si la phrase n’en a pas déjà un. */
function avecVerbeAction(texte, verbe = 'Livrer') {
  const t = String(texte || '').trim();
  if (!t) return null;
  if (/^(terminer|livrer|uploader|compléter|completer|valider|exporterer|créer|creer|importer|appliquer|masteriser|designer|produire|exporterer|exporterer)/i.test(t)) {
    return t.slice(0, 200);
  }
  return `${verbe} — ${t}`.slice(0, 200);
}

/**
 * Génère N titres directs pour une compétence (verbe + livrable / certif).
 * Préfère Projet: / Objectifs: roadmap ; sinon « Terminer {titre} ».
 */
export function genererDrafts(comp, besoin) {
  const n = Math.max(0, Math.min(LOT_SIZE, besoin));
  if (!n || !comp) return [];

  const fullTitre = String(comp.titre || '').trim();
  const short = titreCourt(comp.titre) || fullTitre;
  const projet = extraireProjet(comp.description);
  const objectif = extrairePremierObjectif(comp.description);
  const estCertif = /certification|fCC|DL\.AI|CS50|n8n|Anthropic|AWS|Microsoft Learn|Claude|LangChain|LlamaIndex|CrewAI|Docker|Zapier|Make Academy/i.test(
    `${comp.titre} ${comp.description || ''}`,
  );

  const candidats = [];

  if (projet) {
    candidats.push(avecVerbeAction(projet, 'Livrer'));
  }
  if (objectif) {
    candidats.push(avecVerbeAction(objectif, 'Terminer'));
  }

  if (estCertif) {
    candidats.push(`Terminer ${fullTitre}`);
    candidats.push(`Uploader la preuve — ${short}`);
    candidats.push(`Valider le checkpoint — ${short}`);
  } else {
    candidats.push(`Livrer : ${short}`);
    candidats.push(`Terminer ${fullTitre}`);
    candidats.push(`Exporter + noter — ${short}`);
  }

  const seen = new Set();
  const out = [];
  for (const titre of candidats) {
    const t = String(titre || '').trim().slice(0, 200);
    if (!t || seen.has(t.toLowerCase())) continue;
    // Ne jamais proposer uniquement le titre brut de la compétence
    if (t.toLowerCase() === fullTitre.toLowerCase()) continue;
    seen.add(t.toLowerCase());
    out.push({
      titre: t,
      competence_id: comp.id,
      type: comp.arc_id,
    });
    if (out.length >= n) break;
  }

  while (out.length < n) {
    const titre = `Terminer ${short} — étape ${out.length + 1}`;
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
 * Message honnête à partir des signaux /auto (jamais « actifs ≥ 3 » si actives=0).
 */
export function messageDepuisSignaux(signaux, totalAjoutees) {
  if (totalAjoutees > 0) {
    return `Ravitaillement auto · ${totalAjoutees} quête${totalAjoutees > 1 ? 's' : ''} ajoutée${totalAjoutees > 1 ? 's' : ''}`;
  }
  const parts = [];
  for (const s of signaux || []) {
    const arc = labelArc(s.arc_id);
    if (s.created > 0) {
      parts.push(`${arc}: +${s.created}`);
      continue;
    }
    if (s.debounce) {
      parts.push(`${arc}: debounce (${s.note || '< 10 s'})`);
      continue;
    }
    if (s.bloque_prereqs) {
      parts.push(`${arc}: bloqué prereqs`);
      continue;
    }
    if (s.roadmap_terminee) {
      parts.push(s.message || `roadmap ${arc} terminée`);
      continue;
    }
    if (s.trigger === false) {
      parts.push(`${arc}: assez d'actifs (${s.actives ?? '?'})`);
      continue;
    }
    if (s.skip) {
      parts.push(`${arc}: hors scope`);
      continue;
    }
    if (s.note) parts.push(`${arc}: ${s.note}`);
  }
  return parts.length ? `Ravitaillement auto · ${parts.join(' · ')}` : 'Ravitaillement auto · rien à faire';
}

/**
 * Construit une proposition pour un arc (ou signal roadmap terminée / bloqué).
 * Lot : remplit jusqu’à ACTIVES_TARGET (exactement LOT_SIZE si arc vide).
 * Parcourt plusieurs compétences si besoin pour compléter le lot.
 * Soft-unlock prereqs via quête faite (ravitaillement).
 */
export function preparerPropositionArc({
  arcId,
  competences,
  quetes,
  preuves,
  chapitres = [],
  skipCompetenceIds = [],
}) {
  const chap = chapitreCourantArc(chapitres, arcId);
  const chapitreId = chap?.id ?? null;
  const actives = quetesActivesArc(quetes, arcId, { chapitreId });
  if (actives.length >= ACTIVES_TARGET) {
    return {
      trigger: false,
      actives: actives.length,
      chapitre_id: chapitreId,
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
      softUnlockViaQueteFaite: true,
    });
    if (!competence) break;

    // Une quête claire par compétence — ordre roadmap (S1 → S2 → …)
    const batch = genererDrafts(competence, 1);
    if (!batch.length) {
      skip.add(competence.id);
      continue;
    }

    drafts.push(...batch);
    competencesUtilisees.push(competence);
    skip.add(competence.id);
    // Saturation + déblocage soft du suivant dans le lot seulement (pas en DB)
    for (const d of batch) {
      quetesVirtuelles.push({
        competence_id: d.competence_id,
        type: d.type,
        statut: 'fait',
        chapitre_id: chapitreId,
      });
    }
  }

  if (!drafts.length) {
    const diag = diagnostiquerAbsenceDrafts(compsArc, quetes, preuvesIds, {
      softUnlockViaQueteFaite: true,
    });
    if (diag.bloque_prereqs) {
      return {
        trigger: true,
        actives: actives.length,
        chapitre_id: chapitreId,
        roadmap_terminee: false,
        bloque_prereqs: true,
        message: `${labelArc(arcId)}: bloqué prereqs`,
        competence: null,
        drafts: [],
      };
    }
    return {
      trigger: true,
      actives: actives.length,
      chapitre_id: chapitreId,
      roadmap_terminee: true,
      bloque_prereqs: false,
      message: `roadmap ${labelArc(arcId)} terminée`,
      competence: null,
      drafts: [],
    };
  }

  const primary = competencesUtilisees[0];
  return {
    trigger: true,
    actives: actives.length,
    chapitre_id: chapitreId,
    roadmap_terminee: false,
    bloque_prereqs: false,
    competence: primary,
    drafts,
    cible: ACTIVES_TARGET,
    lot: drafts.length,
  };
}
