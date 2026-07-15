import express from 'express';
import { supabase } from '../supabaseClient.js';
import { requireAuthOrApiKey } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { feedbackSuggestionSchema } from '../schemas.js';

const router = express.Router();
router.use(requireAuthOrApiKey);

/** Extraire 1ère URL ressource depuis description compétence (roadmap). */
export function extraireRessourceDepuisCompetence(comp) {
  if (!comp) return null;
  const desc = comp.description || '';
  const m = desc.match(/<([^>\s]+)>/) || desc.match(/(https?:\/\/[^\s;]+)/);
  const url = m ? m[1] : null;
  const nameM = desc.match(/Ressources:\s*([^;<]+)/);
  const titre = nameM
    ? nameM[1].trim()
    : (comp.titre || 'Ressource roadmap');
  if (!url && !titre) return null;
  return { ressource_titre: titre.slice(0, 300), ressource_url: url };
}

async function suggestionActive() {
  const { data } = await supabase
    .from('suggestions_contremaitre')
    .select('*')
    .eq('statut', 'proposee')
    .order('date_proposition', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function bloqueeParFeedbackNegatif(declencheurType, competenceId) {
  if (!competenceId) return false;
  const { data } = await supabase
    .from('suggestions_contremaitre')
    .select('id')
    .eq('declencheur_type', declencheurType)
    .eq('competence_id', competenceId)
    .eq('statut', 'pas_utile');
  return (data || []).length >= 2;
}

router.get('/active', async (req, res) => {
  const active = await suggestionActive();
  res.json(active);
});

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('suggestions_contremaitre')
    .select('*')
    .order('date_proposition', { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/**
 * Propose max 1 suggestion. Corps optionnel ; sinon scan signaux (quête bloquée / streak).
 * Priorité ressources competences.source_roadmap.
 */
router.post('/proposer', async (req, res) => {
  const existante = await suggestionActive();
  if (existante) {
    return res.json({ ok: true, suggestion: existante, deja: true });
  }

  let {
    declencheur_type: declencheurType,
    declencheur_ref: declencheurRef,
    competence_id: competenceId,
    ressource_titre: ressourceTitre,
    ressource_url: ressourceUrl,
  } = req.body || {};

  // Scan auto si pas de déclencheur fourni
  if (!declencheurType || !declencheurRef) {
    const { data: quetes } = await supabase
      .from('quetes')
      .select('*')
      .eq('statut', 'en_cours')
      .order('cree_le', { ascending: true })
      .limit(20);

    const auj = new Date().toISOString().slice(0, 10);
    const bloquee = (quetes || []).find((q) => q.date_prevue && q.date_prevue < auj);
    if (bloquee) {
      declencheurType = 'quete_bloquee';
      declencheurRef = bloquee.id;
      competenceId = competenceId || bloquee.competence_id || null;
    } else {
      const { data: streaks } = await supabase.from('streaks').select('*');
      const casse = (streaks || []).find((s) => s.id !== 'rayonnement' && s.jours_consecutifs === 0 && s.dernier_jour);
      if (casse) {
        // declencheur_ref doit être uuid — pas d'uuid streak. Chercher dernière entrée liée.
        const { data: entree } = await supabase
          .from('entrees')
          .select('id')
          .order('cree_le', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!entree) {
          return res.json({ ok: true, suggestion: null, note: 'aucun déclencheur réel' });
        }
        declencheurType = 'streak_casse';
        declencheurRef = entree.id;
      }
    }
  }

  if (!declencheurType || !declencheurRef) {
    return res.json({ ok: true, suggestion: null, note: 'aucun déclencheur réel' });
  }

  if (await bloqueeParFeedbackNegatif(declencheurType, competenceId)) {
    return res.json({ ok: true, suggestion: null, note: 'declencheur+compétence ignorés (2× pas_utile)' });
  }

  if (!ressourceTitre) {
    let comp = null;
    if (competenceId) {
      const r = await supabase.from('competences').select('*').eq('id', competenceId).maybeSingle();
      comp = r.data;
    }
    if (!comp) {
      // Prefer roadmap resources for matching arc of quete
      const { data: comps } = await supabase
        .from('competences')
        .select('*')
        .not('source_roadmap', 'is', null)
        .order('source_roadmap', { ascending: true })
        .limit(40);
      comp = (comps || []).find((c) => (c.description || '').includes('http')) || (comps || [])[0] || null;
      competenceId = comp?.id || null;
    }
    const extracted = extraireRessourceDepuisCompetence(comp);
    if (!extracted) {
      return res.json({ ok: true, suggestion: null, note: 'aucune ressource roadmap' });
    }
    ressourceTitre = extracted.ressource_titre;
    ressourceUrl = extracted.ressource_url;
  }

  const { data, error } = await supabase
    .from('suggestions_contremaitre')
    .insert({
      declencheur_type: declencheurType,
      declencheur_ref: declencheurRef,
      competence_id: competenceId || null,
      ressource_titre: ressourceTitre,
      ressource_url: ressourceUrl || null,
      statut: 'proposee',
    })
    .select()
    .single();

  if (error) {
    if (String(error.message || '').includes('uniq_suggestion_active')) {
      const active = await suggestionActive();
      return res.json({ ok: true, suggestion: active, deja: true });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({ ok: true, suggestion: data });
});

router.post('/:id/feedback', validateBody(feedbackSuggestionSchema), async (req, res) => {
  const statut = req.body.statut;
  const { data: before } = await supabase
    .from('suggestions_contremaitre')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (!before) return res.status(404).json({ error: 'suggestion introuvable' });

  let finalStatut = statut;
  if (statut === 'pas_utile') {
    const { data: prev } = await supabase
      .from('suggestions_contremaitre')
      .select('id')
      .eq('declencheur_type', before.declencheur_type)
      .eq('competence_id', before.competence_id)
      .eq('statut', 'pas_utile');
    if ((prev || []).length >= 1) finalStatut = 'ignoree_2x';
  }

  const { data, error } = await supabase
    .from('suggestions_contremaitre')
    .update({ statut: finalStatut, date_feedback: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
