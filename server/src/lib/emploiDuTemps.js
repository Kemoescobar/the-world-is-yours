/**
 * Emploi du temps intelligent — heuristique déterministe (pas d'IA requise).
 * Fuseau : Indian/Antananarivo via dates.js.
 */
import { fuseau, heureEntiereLocal, heureLocal, jourLocal } from './dates.js';

export const BLOCS = [
  {
    id: 'matin',
    label: 'Matin',
    fenetre: '05:00–12:00',
    focus: 'Dev',
    debut: 5,
    fin: 12,
    typesPreferes: ['dev', 'freelance'],
  },
  {
    id: 'apres_midi',
    label: 'Après-midi',
    fenetre: '12:00–18:00',
    focus: 'Beatmaker',
    debut: 12,
    fin: 18,
    typesPreferes: ['beatmaker'],
  },
  {
    id: 'soir',
    label: 'Soir',
    fenetre: '18:00–23:00',
    focus: 'Admin / catch-up',
    debut: 18,
    fin: 23,
    typesPreferes: ['routine', 'dev', 'beatmaker', 'freelance'],
  },
];

const STREAK_LABELS = {
  dev: 'Dev',
  miprod: 'Beatmaker',
  sport: 'Sport',
  rayonnement: 'Rayonnement',
};

const STREAK_VERS_TYPE = {
  dev: 'dev',
  miprod: 'beatmaker',
  sport: 'routine',
};

const TYPES_PLANIFIES = new Set(['dev', 'beatmaker', 'freelance', 'routine']);
const MAX_ACTIONS_PAR_BLOC = 2;

export function blocActuelId(date = new Date()) {
  const h = heureEntiereLocal(date);
  if (h >= 5 && h < 12) return 'matin';
  if (h >= 12 && h < 18) return 'apres_midi';
  if (h >= 18 && h < 23) return 'soir';
  return 'nuit';
}

export function quetesActivesPlanifiables(quetes = []) {
  return (quetes || []).filter(
    (q) => TYPES_PLANIFIES.has(q.type) && q.statut !== 'fait' && q.statut !== 'abandonne',
  );
}

export function scoreQuete(q, jour) {
  let s = 0;
  if (q.date_prevue && q.date_prevue < jour) s += 100;
  if (q.statut === 'en_cours') s += 40;
  else if (q.statut === 'a_faire') s += 20;
  // Plus ancienne date_prevue = plus urgent
  if (q.date_prevue) {
    const delta = Math.max(0, Date.parse(`${jour}T12:00:00`) - Date.parse(`${q.date_prevue}T12:00:00`));
    s += Math.min(30, Math.floor(delta / 86400000));
  }
  return s;
}

export function trierQuetes(quetes, jour) {
  return [...quetes].sort((a, b) => {
    const d = scoreQuete(b, jour) - scoreQuete(a, jour);
    if (d !== 0) return d;
    return String(a.titre || '').localeCompare(String(b.titre || ''), 'fr');
  });
}

/**
 * Streak à risque = pas encore touché aujourd'hui (dernier_jour !== jour).
 * Même à 0j on surface sport/dev/miprod pour ne pas laisser un trou silencieux.
 */
export function streaksARisque(streaks = [], jour) {
  return (streaks || [])
    .filter((s) => s && s.id && s.dernier_jour !== jour)
    .map((s) => ({
      id: s.id,
      label: STREAK_LABELS[s.id] || s.id,
      jours: s.jours_consecutifs ?? 0,
      dernier_jour: s.dernier_jour || null,
      raison: s.jours_consecutifs > 0
        ? `streak ${STREAK_LABELS[s.id] || s.id} à toucher aujourd'hui`
        : `piste ${STREAK_LABELS[s.id] || s.id} inactive — un geste suffit`,
    }))
    .sort((a, b) => b.jours - a.jours);
}

function actionDepuisQuete(q, jour, prioriteExtra) {
  const retard = Boolean(q.date_prevue && q.date_prevue < jour);
  const priorite = prioriteExtra || (retard ? 'retard' : q.statut === 'en_cours' ? 'en_cours' : 'active');
  const arc = q.type === 'freelance' || q.type === 'routine' ? 'dev' : q.type;
  return {
    quete_id: q.id,
    titre: q.titre,
    type: q.type,
    priorite,
    deep_link: `/chantier/${arc === 'croisement' ? 'dev' : arc}`,
    date_prevue: q.date_prevue || null,
  };
}

function actionStreak(streak) {
  const type = STREAK_VERS_TYPE[streak.id] || null;
  const arc = type === 'routine' ? 'dev' : type;
  return {
    quete_id: null,
    streak_id: streak.id,
    titre: `Toucher streak ${streak.label} (${streak.jours}j)`,
    type: type || 'streak',
    priorite: 'streak',
    deep_link: arc ? `/chantier/${arc}` : '/streaks',
    date_prevue: null,
  };
}

/**
 * Répartit les quêtes actives dans Matin / Après-midi / Soir.
 * Priorité : retard → types préférés du bloc → reste au soir.
 */
export function repartirSlots({ quetes = [], streaks = [], jour, maintenant = new Date(), noteContexte = null }) {
  const actives = trierQuetes(quetesActivesPlanifiables(quetes), jour);
  const risques = streaksARisque(streaks, jour);
  const actuel = blocActuelId(maintenant);
  const utilisees = new Set();

  function prendrePourBloc(bloc, max = MAX_ACTIONS_PAR_BLOC) {
    const actions = [];
    // 1) Retards du type préféré
    for (const q of actives) {
      if (actions.length >= max) break;
      if (utilisees.has(q.id)) continue;
      if (!bloc.typesPreferes.includes(q.type)) continue;
      if (!(q.date_prevue && q.date_prevue < jour)) continue;
      utilisees.add(q.id);
      actions.push(actionDepuisQuete(q, jour, 'retard'));
    }
    // 2) Autres du type préféré
    for (const q of actives) {
      if (actions.length >= max) break;
      if (utilisees.has(q.id)) continue;
      if (!bloc.typesPreferes.includes(q.type)) continue;
      utilisees.add(q.id);
      actions.push(actionDepuisQuete(q, jour));
    }
    return actions;
  }

  const slots = BLOCS.map((bloc) => {
    const actions = prendrePourBloc(bloc);
    return {
      id: bloc.id,
      label: bloc.label,
      fenetre: bloc.fenetre,
      focus: bloc.focus,
      actuel: actuel === bloc.id,
      actions,
    };
  });

  // Soir récupère le reste (catch-up)
  const soir = slots.find((s) => s.id === 'soir');
  if (soir) {
    for (const q of actives) {
      if (soir.actions.length >= MAX_ACTIONS_PAR_BLOC) break;
      if (utilisees.has(q.id)) continue;
      utilisees.add(q.id);
      soir.actions.push(actionDepuisQuete(q, jour));
    }
    // Streaks à risque sans quête déjà planifiée du même type
    for (const st of risques) {
      if (soir.actions.length >= MAX_ACTIONS_PAR_BLOC) break;
      const typeLie = STREAK_VERS_TYPE[st.id];
      const dejaCouvert = [...utilisees].some((id) => {
        const q = actives.find((x) => x.id === id);
        return q && typeLie && q.type === typeLie;
      }) || soir.actions.some((a) => a.streak_id === st.id);
      if (dejaCouvert) continue;
      // Aussi : si une action d'un autre slot couvre déjà ce type, skip
      const couvertAilleurs = slots.some((sl) =>
        sl.actions.some((a) => (a.type === typeLie && a.quete_id) || a.streak_id === st.id),
      );
      if (couvertAilleurs) continue;
      soir.actions.push(actionStreak(st));
    }
  }

  // Si un bloc préféré est vide mais qu'il reste des quêtes non assignées → glisser 1
  for (const slot of slots) {
    if (slot.actions.length > 0) continue;
    const reste = actives.find((q) => !utilisees.has(q.id));
    if (!reste) continue;
    utilisees.add(reste.id);
    slot.actions.push(actionDepuisQuete(reste, jour));
  }

  const totalActions = slots.reduce((n, s) => n + s.actions.length, 0);

  return {
    jour,
    tz: fuseau(),
    heure: heureLocal(maintenant),
    bloc_actuel: actuel,
    source: 'heuristic',
    streaks_a_risque: risques,
    note_contexte: noteContexte || null,
    slots,
    vide: totalActions === 0,
    message_vide: totalActions === 0
      ? 'Aucune quête active Dev/Beatmaker — capture un fait ou lance le ravitaillement.'
      : null,
  };
}

/**
 * Construit le plan du jour (entrée pure pour tests + route).
 */
export function construireEmploiDuTemps({
  quetes = [],
  streaks = [],
  maintenant = new Date(),
  noteContexte = null,
} = {}) {
  const jour = jourLocal(maintenant);
  return repartirSlots({ quetes, streaks, jour, maintenant, noteContexte });
}
