-- Directives « Cerveau Claude » (Cowork) — jugement écrit de l'extérieur.
-- Écriture : service_role uniquement (aucune policy INSERT/UPDATE/DELETE client).

create table if not exists public.directives (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('message_matin','priorites_jour','revue_soir','alerte','decision')),
  contenu jsonb not null,
  source text not null default 'cowork',
  valide_jusqua timestamptz,
  cree_le timestamptz default now()
);

alter table public.directives enable row level security;

drop policy if exists owner_select_directives on public.directives;
create policy owner_select_directives on public.directives
  for select to authenticated
  using ((select public.is_app_owner()));

-- Pas de policy d'écriture client : seul le backend (service_role) insère.

create index if not exists idx_directives_type_validite
  on public.directives (type, cree_le desc);

-- Chantier 3 — restreindre is_app_owner()
-- Les policies owner_* (tables + storage) appellent is_app_owner() sous le rôle
-- authenticated : GRANT execute TO authenticated est donc requis pour que le RLS
-- puisse évaluer la fonction. Anon n'a aucune policy owner_* → revoke.
revoke execute on function public.is_app_owner() from anon;
revoke execute on function public.is_app_owner() from public;
grant execute on function public.is_app_owner() to authenticated;
grant execute on function public.is_app_owner() to service_role;
