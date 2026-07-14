# Audit pre-launch — suivi humain (hors code)

Actions à faire toi-même avant une ouverture publique large. Le code a déjà traité les bloquants automatisables (owner allowlist API, bypass Bearer catalogues, rate-limit, pages légales, fonts self-host, lazy routes, a11y motion/focus).

## Sécurité (Dashboard Supabase)

- [ ] **Désactiver le signup public** — Authentication → Providers → Email → *Disable new user signups* (ou équivalent). Un seul compte owner.
- [ ] **Insérer ton UUID dans `app_owners`** après la migration :
  ```sql
  insert into public.app_owners (user_id) values ('<uuid-auth>');
  ```
  UUID : Authentication → Users → copier l’id. Même valeur que `OWNER_USER_ID` sur Railway.
- [ ] **HaveIBeenPwned** — Auth → settings → activer leaked password protection (advisor).
- [ ] **Storage listing** — vérifier que les buckets publics (`instrumentaux`, `captures`) n’exposent pas un listing directory trop large (advisor `public_bucket_allows_listing`). Les lectures objet individuelles restent OK pour la vitrine.

## Railway / Vercel

- [ ] `OWNER_USER_ID=<ton-uuid>` (ou `ALLOWED_USER_IDS=uuid1,uuid2`) sur Railway — **obligatoire en production** (sinon 503 sur routes privées).
- [ ] `CLIENT_URL` = URL Vercel exacte (CORS).
- [ ] Confirmer présence / absence de `ANTHROPIC_API_KEY` selon ton choix soft-launch.

## Légal / assets (hors repo)

- [ ] Clearance samples audio avant showcase public large des instrumentaux.
- [ ] Confirmer droits sur `globe-hand.png` et captures uploadées.
- [ ] Si monetisation plus tard : CGV + enrichir privacy.

## Accessibilité / qualité

- [ ] Mesurer contraste `--text-muted` (#8a95b8) sur `--bg-0` (#060a1a) avec un outil WCAG ; remonter la luminosité si &lt; 4.5:1.
- [ ] Parcourir au clavier (Tab) les pages publiques après deploy — outlines `:focus-visible` jaunes.
- [ ] Tester `prefers-reduced-motion` (OS) : halftone/grain/scanlines calmes.

## SEO / PWA

- [ ] Remplacer les URLs relatives du `sitemap.xml` par l’URL absolue de prod quand le domaine final est fixe.
- [ ] Clarifier mentalement : PWA installable ≠ offline métier (pas de cache API Chroniques).

## Appliquer la migration SQL

Fichier versionné : `supabase/migrations/20260714_owner_rls_and_indexes.sql`

- Via MCP / SQL Editor Supabase, ou CLI `supabase db push` si configuré.
- Puis `insert into app_owners` + `OWNER_USER_ID` Railway + redeploy.
