-- Apprentissages: optional Obsidian note URL (link only — no vault duplication)
alter table public.apprentissages
  add column if not exists lien_note_obsidian text;
