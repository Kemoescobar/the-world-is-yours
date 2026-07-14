-- TWIY — owner-scoped RLS (single-owner personal OS) + FK indexes
-- L'API Express utilise service_role (bypass RLS) : le garde OWNER_USER_ID côté API reste obligatoire.
-- Ces policies protègent l'accès direct via anon key + JWT.
--
-- Après migration, insérer ton UUID Auth :
--   insert into public.app_owners (user_id) values ('<ton-uuid>');
-- Dashboard Supabase → Authentication → Users → copier l'id.
-- Puis désactiver le signup public : Auth → Providers → Email → Disable signups.

create table if not exists public.app_owners (
  user_id uuid primary key,
  cree_le timestamptz default now()
);

alter table public.app_owners enable row level security;

drop policy if exists owner_select_app_owners on public.app_owners;
create policy owner_select_app_owners on public.app_owners
  for select to authenticated
  using (auth.uid() = user_id);

-- Helper: auth.uid() est owner déclaré
create or replace function public.is_app_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_owners o where o.user_id = auth.uid()
  );
$$;

revoke all on function public.is_app_owner() from public;
grant execute on function public.is_app_owner() to authenticated, anon;

-- —— Remplacer policies always-true (authenticated) ——

-- chapitres
drop policy if exists auth_select_chapitres on public.chapitres;
drop policy if exists auth_insert_chapitres on public.chapitres;
drop policy if exists auth_update_chapitres on public.chapitres;
drop policy if exists auth_delete_chapitres on public.chapitres;
create policy owner_all_chapitres on public.chapitres
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

-- config
drop policy if exists auth_select_config on public.config;
drop policy if exists auth_insert_config on public.config;
drop policy if exists auth_update_config on public.config;
drop policy if exists auth_delete_config on public.config;
create policy owner_all_config on public.config
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

-- entrees
drop policy if exists auth_select_entrees on public.entrees;
drop policy if exists auth_insert_entrees on public.entrees;
drop policy if exists auth_update_entrees on public.entrees;
drop policy if exists auth_delete_entrees on public.entrees;
create policy owner_all_entrees on public.entrees
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

-- instrumentaux (garder public_read_instrumentaux_showcase)
drop policy if exists auth_select_instrumentaux on public.instrumentaux;
drop policy if exists auth_insert_instrumentaux on public.instrumentaux;
drop policy if exists auth_update_instrumentaux on public.instrumentaux;
drop policy if exists auth_delete_instrumentaux on public.instrumentaux;
create policy owner_all_instrumentaux on public.instrumentaux
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

-- objectifs_epargne
drop policy if exists auth_select_objectifs_epargne on public.objectifs_epargne;
drop policy if exists auth_insert_objectifs_epargne on public.objectifs_epargne;
drop policy if exists auth_update_objectifs_epargne on public.objectifs_epargne;
drop policy if exists auth_delete_objectifs_epargne on public.objectifs_epargne;
create policy owner_all_objectifs_epargne on public.objectifs_epargne
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

-- portefeuille_mouvements
drop policy if exists auth_select_portefeuille_mouvements on public.portefeuille_mouvements;
drop policy if exists auth_insert_portefeuille_mouvements on public.portefeuille_mouvements;
drop policy if exists auth_update_portefeuille_mouvements on public.portefeuille_mouvements;
drop policy if exists auth_delete_portefeuille_mouvements on public.portefeuille_mouvements;
create policy owner_all_portefeuille_mouvements on public.portefeuille_mouvements
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

-- projets_dev (garder public_read_projets_shippe)
drop policy if exists auth_select_projets_dev on public.projets_dev;
drop policy if exists auth_insert_projets_dev on public.projets_dev;
drop policy if exists auth_update_projets_dev on public.projets_dev;
drop policy if exists auth_delete_projets_dev on public.projets_dev;
create policy owner_all_projets_dev on public.projets_dev
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

-- prospects
drop policy if exists auth_select_prospects on public.prospects;
drop policy if exists auth_insert_prospects on public.prospects;
drop policy if exists auth_update_prospects on public.prospects;
drop policy if exists auth_delete_prospects on public.prospects;
create policy owner_all_prospects on public.prospects
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

-- quetes
drop policy if exists auth_select_quetes on public.quetes;
drop policy if exists auth_insert_quetes on public.quetes;
drop policy if exists auth_update_quetes on public.quetes;
drop policy if exists auth_delete_quetes on public.quetes;
create policy owner_all_quetes on public.quetes
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

-- quetes_historique
drop policy if exists auth_select_quetes_historique on public.quetes_historique;
drop policy if exists auth_insert_quetes_historique on public.quetes_historique;
drop policy if exists auth_update_quetes_historique on public.quetes_historique;
drop policy if exists auth_delete_quetes_historique on public.quetes_historique;
create policy owner_all_quetes_historique on public.quetes_historique
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

-- saisons
drop policy if exists auth_select_saisons on public.saisons;
drop policy if exists auth_insert_saisons on public.saisons;
drop policy if exists auth_update_saisons on public.saisons;
drop policy if exists auth_delete_saisons on public.saisons;
create policy owner_all_saisons on public.saisons
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

-- streaks
drop policy if exists auth_select_streaks on public.streaks;
drop policy if exists auth_insert_streaks on public.streaks;
drop policy if exists auth_update_streaks on public.streaks;
drop policy if exists auth_delete_streaks on public.streaks;
create policy owner_all_streaks on public.streaks
  for all to authenticated
  using (public.is_app_owner())
  with check (public.is_app_owner());

-- storage writes : owner only (lectures publiques captures/instrumentaux inchangées)
drop policy if exists auth_write_storage on storage.objects;
drop policy if exists auth_update_storage on storage.objects;
drop policy if exists auth_delete_storage on storage.objects;
drop policy if exists auth_read_projets_bucket on storage.objects;

create policy owner_write_storage on storage.objects
  for insert to authenticated
  with check (
    public.is_app_owner()
    and bucket_id = any (array['instrumentaux'::text, 'projets'::text, 'captures'::text])
  );

create policy owner_update_storage on storage.objects
  for update to authenticated
  using (
    public.is_app_owner()
    and bucket_id = any (array['instrumentaux'::text, 'projets'::text, 'captures'::text])
  )
  with check (
    public.is_app_owner()
    and bucket_id = any (array['instrumentaux'::text, 'projets'::text, 'captures'::text])
  );

create policy owner_delete_storage on storage.objects
  for delete to authenticated
  using (
    public.is_app_owner()
    and bucket_id = any (array['instrumentaux'::text, 'projets'::text, 'captures'::text])
  );

create policy owner_read_projets_bucket on storage.objects
  for select to authenticated
  using (public.is_app_owner() and bucket_id = 'projets'::text);

-- Indexes FK (advisor performance)
create index if not exists idx_entrees_quete_id on public.entrees (quete_id);
create index if not exists idx_quetes_historique_quete_id on public.quetes_historique (quete_id);
