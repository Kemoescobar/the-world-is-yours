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
5. **Storage** — migration `20260715_…` : plus de listing directory anon sur buckets publics ; SELECT owner unifié.
6. **`is_app_owner()`** — plus d’`EXECUTE` pour `anon` (RPC public fermé).

## Checklist owner

| Étape | Statut |
|-------|--------|
| UUID dans Railway `OWNER_USER_ID` + redeploy | ✅ fait |
| `insert into public.app_owners` | ✅ fait |
| `OWNER_USER_ID` local `server/.env` | ✅ fait |
| Auth → **désactiver signup public** | ⏳ Dashboard **ou** Management API `PATCH .../config/auth` + access token (`disable_signup`) — voir `docs/audit-followups.md` |
| HaveIBeenPwned / leaked passwords | ⏳ Idem (`password_hibp_enabled`) — souvent plan Pro+ |

## Signup public — hors MCP

Le MCP Supabase n’expose **pas** de mutation Auth config. Options :

1. Dashboard (ci-dessous), ou
2. Management API avec un token [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) (commande PowerShell dans `docs/audit-followups.md`).

### Dashboard

1. [Dashboard](https://supabase.com/dashboard/project/gunjokreeewcvlprgljg/auth/providers) → **The World Is Yours**
2. **Authentication** → **Providers** → **Email**
3. Désactiver **Enable sign ups** → Save
4. Activer **Leaked password protection** si disponible → Save

Même doc opérationnelle : `docs/audit-followups.md`.
