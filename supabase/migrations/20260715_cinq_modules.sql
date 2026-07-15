-- TWIY — 5 modules : Apprentissages, Ère, Compétences, Rayonnement, Contremaître
-- Corrections vs master prompt : arcs.id = text ; streak id='rayonnement' ; cree_le ; bilan_drop_id → entrees

-- 1) Apprentissages
create table if not exists public.apprentissages (
  id uuid primary key default gen_random_uuid(),
  arc_id text references public.arcs(id),
  entree_id uuid references public.entrees(id),
  titre text not null,
  contenu text not null,
  type text not null check (type in ('blocage_resolu','declic','principe')),
  tags text[] default '{}',
  reutilise_count int default 0,
  publie boolean default false,
  cree_le timestamptz default now()
);

-- 2) Ères
create table if not exists public.eres (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  date_debut date not null,
  date_fin date not null,
  -- chaque objectif: {id uuid, titre, description, metrique_cible, metrique_actuelle}
  objectifs jsonb not null default '[]'::jsonb,
  statut text not null default 'active' check (statut in ('active','cloturee')),
  bilan_drop_id uuid references public.entrees(id),
  cree_le timestamptz default now()
);

alter table public.chapitres
  add column if not exists ere_id uuid references public.eres(id);

alter table public.quetes
  add column if not exists ere_objectif_id uuid;

-- 3) Compétences (+ preuves)
create table if not exists public.competences (
  id uuid primary key default gen_random_uuid(),
  arc_id text references public.arcs(id),
  titre text not null,
  description text,
  prerequis uuid[] default '{}',
  niveau_requis text check (niveau_requis in ('initiation','pratique','maitrise')),
  source_roadmap text,
  cree_le timestamptz default now()
);

create table if not exists public.competences_preuves (
  id uuid primary key default gen_random_uuid(),
  competence_id uuid not null references public.competences(id) on delete cascade,
  type text not null check (type in ('repo','track','cert_externe')),
  reference_id uuid,
  url text,
  date_validation timestamptz default now()
);

alter table public.quetes
  add column if not exists competence_id uuid references public.competences(id);

-- 4) Rayonnement
create table if not exists public.rayonnement_evenements (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in (
    'article','repo_etoile','ecoute_milestone','prise_de_parole','contribution_open_source'
  )),
  titre text not null,
  url text,
  arc_id text references public.arcs(id),
  metrique int,
  date_evenement date not null,
  cree_le timestamptz default now()
);

insert into public.streaks (id, jours_consecutifs, record)
values ('rayonnement', 0, 0)
on conflict (id) do nothing;

-- 5) Contremaître
create table if not exists public.suggestions_contremaitre (
  id uuid primary key default gen_random_uuid(),
  declencheur_type text not null check (declencheur_type in (
    'quete_bloquee','streak_casse','auto_eval_basse','correlation_insights','mot_friction_checkin'
  )),
  declencheur_ref uuid not null,
  competence_id uuid references public.competences(id),
  ressource_titre text not null,
  ressource_url text,
  statut text not null default 'proposee'
    check (statut in ('proposee','utile','pas_utile','ignoree_2x')),
  date_proposition timestamptz default now(),
  date_feedback timestamptz
);

-- Max 1 suggestion active
create unique index if not exists uniq_suggestion_active
  on public.suggestions_contremaitre ((1))
  where statut = 'proposee';

create index if not exists idx_apprentissages_arc on public.apprentissages(arc_id);
create index if not exists idx_chapitres_ere on public.chapitres(ere_id);
create index if not exists idx_quetes_competence on public.quetes(competence_id);
create index if not exists idx_quetes_ere_objectif on public.quetes(ere_objectif_id);
create index if not exists idx_competences_arc on public.competences(arc_id);
create index if not exists idx_competences_source on public.competences(source_roadmap);
create index if not exists idx_rayonnement_date on public.rayonnement_evenements(date_evenement);

-- RLS owner (même pattern que 20260714)
alter table public.apprentissages enable row level security;
alter table public.eres enable row level security;
alter table public.competences enable row level security;
alter table public.competences_preuves enable row level security;
alter table public.rayonnement_evenements enable row level security;
alter table public.suggestions_contremaitre enable row level security;

drop policy if exists owner_all_apprentissages on public.apprentissages;
create policy owner_all_apprentissages on public.apprentissages
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

drop policy if exists owner_all_eres on public.eres;
create policy owner_all_eres on public.eres
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

drop policy if exists owner_all_competences on public.competences;
create policy owner_all_competences on public.competences
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

drop policy if exists owner_all_competences_preuves on public.competences_preuves;
create policy owner_all_competences_preuves on public.competences_preuves
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

drop policy if exists owner_all_rayonnement_evenements on public.rayonnement_evenements;
create policy owner_all_rayonnement_evenements on public.rayonnement_evenements
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

drop policy if exists owner_all_suggestions_contremaitre on public.suggestions_contremaitre;
create policy owner_all_suggestions_contremaitre on public.suggestions_contremaitre
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());
