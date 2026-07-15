import { z } from 'zod';

export const TYPE_FAIT = z.enum([
  'commit', 'certif', 'session_prod', 'sport', 'proposal', 'instru', 'projet', 'quete',
]);

export const ARC_ID = z.enum(['dev', 'beatmaker', 'croisement']);

export const createEntreeSchema = z.object({
  type_fait: TYPE_FAIT,
  detail: z.string().trim().min(1).max(2000).optional().nullable(),
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
});

export const patchQueteSchema = z.object({
  titre: z.string().trim().min(1).max(500).optional(),
  statut: z.enum(['a_faire', 'en_cours', 'fait', 'abandonne']).optional(),
  lien_note_obsidian: z.string().max(1000).optional().nullable(),
  date_prevue: z.string().optional().nullable(),
  date_faite: z.string().optional().nullable(),
  type: z.enum(['dev', 'beatmaker', 'croisement', 'freelance', 'routine']).optional(),
}).strict();

const optionalUrl = z.union([z.string().url(), z.literal('')]).optional().nullable();

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
