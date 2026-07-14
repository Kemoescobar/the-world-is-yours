# Auth & isolation données (soft-launch → public)

## Problème

L’API Express utilise `SUPABASE_SERVICE_KEY` (service_role) → **bypass RLS**. Des policies `USING (true)` pour `authenticated` ne suffisent pas : tout JWT Auth valide pouvait lire portefeuille, prospects, export complet.

## Correctifs en place

1. **Allowlist serveur** — après `getUser`, `req.user.id` doit être dans :
   - `OWNER_USER_ID` (un UUID), ou
   - `ALLOWED_USER_IDS` (liste séparée par des virgules, prioritaire si défini)
2. **Catalogues** — `GET /api/instrumentaux` et `/projets` ne lèvent le filtre showcase/shippé qu’après JWT **validé** + owner.
3. **RLS owner** — migration `supabase/migrations/20260714_owner_rls_and_indexes.sql` : table `app_owners` + policies `is_app_owner()` (protège l’accès direct anon+JWT).
4. **Rate limits** — webhooks, `/api/ai/*`, export.

## Checklist owner

1. Copier ton UUID (Supabase → Authentication → Users).
2. Railway : `OWNER_USER_ID=<uuid>` → Redeploy.
3. SQL : `insert into public.app_owners (user_id) values ('<uuid>');`
4. Auth → **désactiver signup public**.
5. Local : même `OWNER_USER_ID` dans `server/.env` (en dev, allowlist absente = warning, accès autorisé).

## Signup public

À fermer dans le Dashboard (non versionnable proprement dans ce repo). Voir `docs/audit-followups.md`.
