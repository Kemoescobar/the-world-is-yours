-- Harden public buckets: remove broad SELECT that allows directory listing.
-- Public object URLs still work for public buckets without a SELECT policy.
-- Owner keeps SELECT on instrumentaux / captures / projets for Studio uploads.

drop policy if exists public_read_captures_bucket on storage.objects;
drop policy if exists public_read_instrumentaux_bucket on storage.objects;

drop policy if exists owner_read_projets_bucket on storage.objects;
drop policy if exists owner_read_storage on storage.objects;

create policy owner_read_storage on storage.objects
  for select to authenticated
  using (
    public.is_app_owner()
    and bucket_id = any (array['instrumentaux'::text, 'projets'::text, 'captures'::text])
  );

-- Limit RPC exposure of SECURITY DEFINER helper (RLS policies still work for authenticated).
revoke execute on function public.is_app_owner() from public;
revoke execute on function public.is_app_owner() from anon;
grant execute on function public.is_app_owner() to authenticated;
grant execute on function public.is_app_owner() to service_role;
