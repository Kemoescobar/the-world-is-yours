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
  waveform_data jsonb,
  cree_le timestamptz default now()
);

-- Catalogue projets dev
create table projets_dev (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  lien_github text,
  lien_live text,
  capture_url text,                   -- bucket 'captures'
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
