import { z } from 'zod';

export const TYPE_FAIT = z.enum([
  'commit', 'certif', 'session_prod', 'sport', 'proposal', 'instru', 'projet', 'quete', 'bilan_ere',
]);

export const ARC_ID = z.enum(['dev', 'beatmaker', 'croisement']);

const optionalUrl = z.union([z.string().url(), z.literal('')]).optional().nullable();

export const createEntreeSchema = z.object({
  type_fait: TYPE_FAIT,
  detail: z.string().trim().min(1).max(2000),
  arc_id: ARC_ID.optional().nullable(),
  quete_id: z.string().uuid().optional().nullable(),
});

export const createQueteSchema = z.object({
  chapitre_id: z.string().uuid().optional().nullable(),
  type: z.enum(['dev', 'beatmaker', 'croisement', 'freelance', 'routine']),
  titre: z.string().trim().min(1).max(500),
  statut: z.enum(['a_faire', 'en_cours', 'fait', 'abandonne']).optional(),
  lien_note_obsidian: z.string().max(1000).optional().nullable(),
  date_prevue: z.string().optional().nullable(),
  date_faite: z.string().optional().nullable(),
  ere_objectif_id: z.string().uuid().optional().nullable(),
  competence_id: z.string().uuid().optional().nullable(),
});

export const patchQueteSchema = z.object({
  titre: z.string().trim().min(1).max(500).optional(),
  statut: z.enum(['a_faire', 'en_cours', 'fait', 'abandonne']).optional(),
  lien_note_obsidian: z.string().max(1000).optional().nullable(),
  date_prevue: z.string().optional().nullable(),
  date_faite: z.string().optional().nullable(),
  type: z.enum(['dev', 'beatmaker', 'croisement', 'freelance', 'routine']).optional(),
  ere_objectif_id: z.string().uuid().optional().nullable(),
  competence_id: z.string().uuid().optional().nullable(),
}).strict();

const ereObjectifSchema = z.object({
  id: z.string().uuid().optional(),
  titre: z.string().trim().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  metrique_cible: z.union([z.number(), z.string()]).optional().nullable(),
  metrique_actuelle: z.union([z.number(), z.string()]).optional().nullable(),
});

export const createEreSchema = z.object({
  nom: z.string().trim().min(1).max(300),
  date_debut: z.string().min(4),
  date_fin: z.string().min(4),
  objectifs: z.array(ereObjectifSchema).optional(),
  statut: z.enum(['active', 'cloturee']).optional(),
});

export const patchEreSchema = z.object({
  nom: z.string().trim().min(1).max(300).optional(),
  date_debut: z.string().min(4).optional(),
  date_fin: z.string().min(4).optional(),
  objectifs: z.array(ereObjectifSchema).optional(),
  statut: z.enum(['active', 'cloturee']).optional(),
}).strict();

export const createApprentissageSchema = z.object({
  arc_id: ARC_ID.optional().nullable(),
  entree_id: z.string().uuid().optional().nullable(),
  titre: z.string().trim().min(1).max(300),
  contenu: z.string().trim().min(1).max(8000),
  type: z.enum(['blocage_resolu', 'declic', 'principe']),
  tags: z.array(z.string()).optional(),
  publie: z.boolean().optional(),
  lien_note_obsidian: z.string().max(1000).optional().nullable(),
});

export const patchApprentissageSchema = z.object({
  titre: z.string().trim().min(1).max(300).optional(),
  contenu: z.string().trim().min(1).max(8000).optional(),
  type: z.enum(['blocage_resolu', 'declic', 'principe']).optional(),
  tags: z.array(z.string()).optional(),
  publie: z.boolean().optional(),
  reutilise_count: z.number().int().optional(),
  lien_note_obsidian: z.string().max(1000).optional().nullable(),
}).strict();

export const createCompetenceSchema = z.object({
  arc_id: ARC_ID.optional().nullable(),
  titre: z.string().trim().min(1).max(300),
  description: z.string().max(8000).optional().nullable(),
  prerequis: z.array(z.string().uuid()).optional(),
  niveau_requis: z.enum(['initiation', 'pratique', 'maitrise']).optional().nullable(),
  source_roadmap: z.string().max(200).optional().nullable(),
});

export const patchCompetenceSchema = createCompetenceSchema.partial().strict();

export const createPreuveSchema = z.object({
  type: z.enum(['repo', 'track', 'cert_externe']),
  reference_id: z.string().uuid().optional().nullable(),
  url: z.union([z.string().url(), z.literal('')]).optional().nullable(),
});

export const createRayonnementSchema = z.object({
  type: z.enum(['article', 'repo_etoile', 'ecoute_milestone', 'prise_de_parole', 'contribution_open_source']),
  titre: z.string().trim().min(1).max(300),
  url: optionalUrl,
  arc_id: ARC_ID.optional().nullable(),
  metrique: z.number().int().optional().nullable(),
  date_evenement: z.string().min(4),
}).transform((v) => ({
  ...v,
  url: v.url || null,
  arc_id: v.arc_id || null,
}));

export const createSuggestionSchema = z.object({
  declencheur_type: z.enum([
    'quete_bloquee', 'streak_casse', 'auto_eval_basse', 'correlation_insights', 'mot_friction_checkin',
  ]),
  declencheur_ref: z.string().uuid(),
  competence_id: z.string().uuid().optional().nullable(),
  ressource_titre: z.string().trim().min(1).max(300),
  ressource_url: optionalUrl,
});

export const feedbackSuggestionSchema = z.object({
  statut: z.enum(['utile', 'pas_utile']),
});

export const ravitaillementProposerSchema = z.object({
  arc_id: z.enum(['dev', 'beatmaker']).optional(),
}).strict();

/** Auto-ravitaillement (insert direct quetes) — même corps que proposer. */
export const ravitaillementAutoSchema = ravitaillementProposerSchema;

export const ravitaillementRepondreSchema = z.object({
  action: z.enum(['accepter', 'refuser']),
});

/** Legacy : accepter / refuser lots (UI n’utilise plus). */
export const ravitaillementRepondreLotSchema = z.object({
  action: z.enum(['accepter', 'refuser']),
});

export const createInstrumentalSchema = z.object({
  titre: z.string().trim().min(1).max(300),
  bpm: z.number().int().positive().optional().nullable(),
  tonalite: z.string().max(50).optional().nullable(),
  genre: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  statut: z.enum(['showcase', 'prive']).optional(),
  fichier_url: z.string().url(),
  cover_url: optionalUrl,
  waveform_data: z.any().optional().nullable(),
}).transform((v) => ({
  ...v,
  cover_url: v.cover_url || null,
}));

export const patchInstrumentalSchema = z.object({
  titre: z.string().trim().min(1).max(300).optional(),
  bpm: z.number().int().positive().optional().nullable(),
  tonalite: z.string().max(50).optional().nullable(),
  genre: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  statut: z.enum(['showcase', 'prive']).optional(),
  cover_url: optionalUrl,
  waveform_data: z.any().optional().nullable(),
}).strict().transform((v) => {
  const out = { ...v };
  if ('cover_url' in out) out.cover_url = out.cover_url || null;
  return out;
});

export const createProjetSchema = z.object({
  titre: z.string().trim().min(1).max(300),
  description: z.string().max(5000).optional().nullable(),
  lien_github: optionalUrl,
  lien_live: optionalUrl,
  capture_url: optionalUrl,
  captures: z.array(z.string().url()).max(12).optional().nullable(),
  fichier_url: optionalUrl,
  stack: z.array(z.string()).optional().nullable(),
  statut: z.string().max(50).optional(),
}).transform((v) => {
  const captures = Array.isArray(v.captures)
    ? v.captures.filter(Boolean)
    : (v.capture_url ? [v.capture_url] : undefined);
  const capture_url = captures?.length ? captures[0] : (v.capture_url || null);
  return {
    ...v,
    lien_github: v.lien_github || null,
    lien_live: v.lien_live || null,
    fichier_url: v.fichier_url || null,
    captures: captures ?? [],
    capture_url,
  };
});

export const patchProjetSchema = z.object({
  titre: z.string().trim().min(1).max(300).optional(),
  description: z.string().max(5000).optional().nullable(),
  lien_github: optionalUrl,
  lien_live: optionalUrl,
  capture_url: optionalUrl,
  captures: z.array(z.string().url()).max(12).optional().nullable(),
  fichier_url: optionalUrl,
  stack: z.array(z.string()).optional().nullable(),
  statut: z.string().max(50).optional(),
}).strict().transform((v) => {
  const out = { ...v };
  if ('lien_github' in out) out.lien_github = out.lien_github || null;
  if ('lien_live' in out) out.lien_live = out.lien_live || null;
  if ('fichier_url' in out) out.fichier_url = out.fichier_url || null;
  if ('captures' in out) {
    const captures = (out.captures || []).filter(Boolean);
    out.captures = captures;
    out.capture_url = captures[0] || null;
  } else if ('capture_url' in out) {
    out.capture_url = out.capture_url || null;
  }
  return out;
});

export const createProspectSchema = z.object({
  nom: z.string().trim().min(1).max(300),
  statut: z.enum(['prospect', 'proposal_envoye', 'client', 'paye', 'perdu']).optional(),
  lien_note_obsidian: z.string().max(1000).optional().nullable(),
  montant: z.number().optional().nullable(),
});

export const patchProspectSchema = z.object({
  nom: z.string().trim().min(1).max(300).optional(),
  statut: z.enum(['prospect', 'proposal_envoye', 'client', 'paye', 'perdu']).optional(),
  lien_note_obsidian: z.string().max(1000).optional().nullable(),
  montant: z.number().optional().nullable(),
}).strict();

export const createMouvementSchema = z.object({
  montant: z.number(),
  devise: z.enum(['MGA', 'USD']).optional(),
  categorie: z.string().max(100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  date_mouvement: z.string().optional(),
});

export const createObjectifSchema = z.object({
  nom: z.string().trim().min(1).max(300),
  montant_cible: z.number().positive(),
  devise: z.enum(['MGA', 'USD']).optional(),
  montant_actuel: z.number().optional(),
  date_cible: z.string().optional().nullable(),
  statut: z.enum(['en_cours', 'atteint', 'abandonne']).optional(),
});

export const patchObjectifSchema = z.object({
  nom: z.string().trim().min(1).max(300).optional(),
  montant_cible: z.number().positive().optional(),
  devise: z.enum(['MGA', 'USD']).optional(),
  montant_actuel: z.number().optional(),
  date_cible: z.string().optional().nullable(),
  statut: z.enum(['en_cours', 'atteint', 'abandonne']).optional(),
}).strict();

export const webhookEntreeSchema = z.object({
  type_fait: TYPE_FAIT,
  detail: z.string().max(2000).optional().nullable(),
  arc_id: ARC_ID.optional().nullable(),
  source: z.string().max(50).optional(),
});
