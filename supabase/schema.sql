-- THE WORLD IS YOURS — schéma complet
-- À exécuter dans l'éditeur SQL Supabase (Postgres)

create extension if not exists "pgcrypto";

-- Saisons continues (structure au-delà de la roadmap S1-S15)
create table saisons (
  id uuid primary key default gen_random_uuid(),
  nom text not null,                 -- 'Saison 1', 'Saison 2'...
  date_debut date not null,
  date_fin date
);

-- Arcs fixes
create table arcs (
  id text primary key,               -- 'dev' | 'beatmaker' | 'croisement'
  nom text not null
);

insert into arcs (id, nom) values
  ('dev', 'Dev'),
  ('beatmaker', 'Beatmaker'),
  ('croisement', 'Croisement');

-- Chapitres (une semaine, rattachés à une saison)
create table chapitres (
  id uuid primary key default gen_random_uuid(),
  arc_id text references arcs(id),
  saison_id uuid references saisons(id),
  semaine text not null,              -- 'S1'...'S15' (relatif à la saison)
  titre text,                         -- généré a posteriori par Claude
  date_debut date not null,
  date_fin date,
  statut text default 'en_cours',     -- en_cours | complet | rompu | reprise
  resume_public text
);

-- Quêtes
create table quetes (
  id uuid primary key default gen_random_uuid(),
  chapitre_id uuid references chapitres(id),
  type text not null,                 -- dev | beatmaker | freelance | routine
  titre text not null,
  statut text default 'a_faire',      -- a_faire | en_cours | fait | abandonne
  lien_note_obsidian text,
  date_prevue date,
  date_faite date,
  cree_le timestamptz default now()
);

-- Historique des quêtes modifiées (préserve l'intégrité du récit)
create table quetes_historique (
  id uuid primary key default gen_random_uuid(),
  quete_id uuid references quetes(id),
  champ_modifie text not null,
  ancienne_valeur text,
  nouvelle_valeur text,
  modifie_le timestamptz default now()
);

-- Entrées (unité de base des Chroniques)
create table entrees (
  id uuid primary key default gen_random_uuid(),
  quete_id uuid references quetes(id),
  arc_id text references arcs(id),
  type_fait text not null,            -- commit | certif | session_prod | sport | proposal | instru | projet
  detail text,
  source text,                        -- github | manuel | n8n | webhook
  source_ref text,                    -- dédup webhooks (ex. github:<sha>)
  cree_le timestamptz default now()
);

create unique index if not exists entrees_source_ref_unique
  on entrees (source_ref)
  where source_ref is not null;

-- Streaks
create table streaks (
  id text primary key,                -- 'dev' | 'miprod' | 'sport'
  jours_consecutifs int default 0,
  dernier_jour date,
  record int default 0
);

insert into streaks (id, jours_consecutifs, record) values
  ('dev', 0, 0),
  ('miprod', 0, 0),
  ('sport', 0, 0);

-- Catalogue instrumentaux
create table instrumentaux (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  bpm int,
  tonalite text,
  genre text,
  tags text[],
  statut text default 'showcase',     -- showcase | prive
  fichier_url text not null,          -- Supabase Storage, bucket 'instrumentaux'
  cover_url text,                     -- sleeve art, bucket 'captures' (public)
  waveform_data jsonb,
  cree_le timestamptz default now()
);

-- Catalogue projets dev
create table projets_dev (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,                   -- presentation / lookbook text
  lien_github text,
  lien_live text,
  capture_url text,                   -- legacy primary shot; mirrors captures[0]
  captures text[] default '{}',       -- screenshots, bucket 'captures'
  fichier_url text,                   -- bucket 'projets', optionnel
  stack text[],
  statut text default 'shippe',
  cree_le timestamptz default now()
);

-- Pipeline freelance
create table prospects (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  statut text default 'prospect',     -- prospect | proposal_envoye | client | paye | perdu
  lien_note_obsidian text,
  montant numeric,
  date_maj timestamptz default now()
);

-- Index utiles
create index idx_entrees_arc on entrees(arc_id);
create index idx_entrees_date on entrees(cree_le);
create index idx_quetes_chapitre on quetes(chapitre_id);
create index idx_chapitres_arc on chapitres(arc_id);
create index idx_chapitres_saison on chapitres(saison_id);

-- Portefeuille — solde global, saisie manuelle, MGA principal / USD secondaire (ajout ultérieur)
create table portefeuille_mouvements (
  id uuid primary key default gen_random_uuid(),
  montant numeric not null,          -- positif = entrée, négatif = sortie
  devise text default 'MGA',         -- 'MGA' | 'USD'
  categorie text,                    -- freelance | vente_instru | materiel | abonnement | epargne | autre
  description text,
  date_mouvement date not null default current_date,
  cree_le timestamptz default now()
);

create table objectifs_epargne (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  montant_cible numeric not null,
  devise text default 'MGA',
  montant_actuel numeric default 0,
  date_cible date,
  statut text default 'en_cours'     -- en_cours | atteint | abandonne
);

-- Taux de conversion manuel, modifiable dans /parametres (affichage MGA <-> USD)
create table config (
  cle text primary key,
  valeur text
);
insert into config (cle, valeur) values ('taux_usd_mga', '4500');

create index idx_portefeuille_date on portefeuille_mouvements(date_mouvement);

-- —— 5 modules (2026-07-15) — voir aussi migrations/20260715_cinq_modules.sql ——

create table if not exists apprentissages (
  id uuid primary key default gen_random_uuid(),
  arc_id text references arcs(id),
  entree_id uuid references entrees(id),
  titre text not null,
  contenu text not null,
  type text not null check (type in ('blocage_resolu','declic','principe')),
  tags text[] default '{}',
  reutilise_count int default 0,
  publie boolean default false,
  cree_le timestamptz default now()
);

create table if not exists eres (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  date_debut date not null,
  date_fin date not null,
  objectifs jsonb not null default '[]'::jsonb,
  statut text not null default 'active' check (statut in ('active','cloturee')),
  bilan_drop_id uuid references entrees(id),
  cree_le timestamptz default now()
);

alter table chapitres add column if not exists ere_id uuid references eres(id);
alter table quetes add column if not exists ere_objectif_id uuid;
alter table quetes add column if not exists competence_id uuid;

create table if not exists competences (
  id uuid primary key default gen_random_uuid(),
  arc_id text references arcs(id),
  titre text not null,
  description text,
  prerequis uuid[] default '{}',
  niveau_requis text check (niveau_requis in ('initiation','pratique','maitrise')),
  source_roadmap text,
  cree_le timestamptz default now()
);

create table if not exists competences_preuves (
  id uuid primary key default gen_random_uuid(),
  competence_id uuid not null references competences(id) on delete cascade,
  type text not null check (type in ('repo','track','cert_externe')),
  reference_id uuid,
  url text,
  date_validation timestamptz default now()
);

alter table quetes
  drop constraint if exists quetes_competence_id_fkey;
alter table quetes
  add constraint quetes_competence_id_fkey
  foreign key (competence_id) references competences(id);

create table if not exists rayonnement_evenements (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in (
    'article','repo_etoile','ecoute_milestone','prise_de_parole','contribution_open_source'
  )),
  titre text not null,
  url text,
  arc_id text references arcs(id),
  metrique int,
  date_evenement date not null,
  cree_le timestamptz default now()
);

insert into streaks (id, jours_consecutifs, record)
values ('rayonnement', 0, 0)
on conflict (id) do nothing;

create table if not exists suggestions_contremaitre (
  id uuid primary key default gen_random_uuid(),
  declencheur_type text not null check (declencheur_type in (
    'quete_bloquee','streak_casse','auto_eval_basse','correlation_insights','mot_friction_checkin'
  )),
  declencheur_ref uuid not null,
  competence_id uuid references competences(id),
  ressource_titre text not null,
  ressource_url text,
  statut text not null default 'proposee'
    check (statut in ('proposee','utile','pas_utile','ignoree_2x')),
  date_proposition timestamptz default now(),
  date_feedback timestamptz
);

