# Audit pre-launch — suivi

Le code a déjà traité les bloquants automatisables (owner allowlist API, bypass Bearer catalogues, rate-limit, pages légales, fonts self-host, lazy routes, a11y motion/focus, sitemap absolu, OG absolus, policies storage listing).

## Fait (infra / code / SQL)

- [x] `OWNER_USER_ID` sur Railway + redeploy
- [x] `insert into app_owners` (UUID owner)
- [x] `OWNER_USER_ID` local dans `server/.env`
- [x] Migration RLS owner + indexes (`20260714_…`)
- [x] Sitemap + robots avec base absolue `https://the-world-is-yours-seven.vercel.app`
- [x] Meta OG / Twitter / canonical en URLs absolues (`client/index.html`)
- [x] Storage : policies SELECT publiques trop larges retirées + SELECT owner unifié (`20260715_…`)
- [x] `REVOKE EXECUTE` de `is_app_owner()` pour `anon` / `public` (RPC anon fermé)

## Bloqué côté Dashboard (MCP / API Management non dispo)

Ces réglages Auth ne passent **pas** par le MCP Supabase ni un outil versionné dans ce repo. À faire dans le Dashboard :

### 1. Désactiver le signup public

1. Ouvre [Supabase Dashboard](https://supabase.com/dashboard) → projet **The World Is Yours**
2. **Authentication** → **Providers** → **Email**
3. Désactive **Enable sign ups** / *Allow new users to sign up* (libellé selon UI)
4. Save

Un seul compte owner : `fisandratajohnson@gmail.com`.

### 2. HaveIBeenPwned (leaked password protection)

1. Même projet → **Authentication** → **Settings** (ou **Password**)
2. Active **Leaked password protection** (HaveIBeenPwned)
3. Save

Advisor : `auth_leaked_password_protection`.

## Toi seulement (hors code — ne pas confondre avec « fait »)

### Railway / IA

- [ ] `ANTHROPIC_API_KEY` — **non posé** (Claude Pro ≠ clé API). Poser seulement si tu prends une clé Anthropic Console ; sinon Revue / Insights restent soft-disabled.
- [ ] Confirmer `CLIENT_URL` = `https://the-world-is-yours-seven.vercel.app` (CORS)

### n8n (optionnel)

- [ ] Lancer n8n (Docker ou cloud) + importer `n8n/*.json` — voir **`n8n/README.md`** (étapes copy-paste). Pas obligatoire pour la vitrine.

### Légal / assets

- [ ] Clearance samples audio avant showcase public large des instrumentaux
- [ ] Confirmer droits sur `globe-hand.png` et captures uploadées
- [ ] Si monetisation plus tard : CGV + enrichir privacy

### Accessibilité / qualité

- [ ] Mesurer contraste `--text-muted` (#8a95b8) sur `--bg-0` (#060a1a) (WCAG) ; remonter la luminosité si &lt; 4.5:1
- [ ] Parcourir au clavier (Tab) les pages publiques après deploy — outlines `:focus-visible` jaunes
- [ ] Tester `prefers-reduced-motion` (OS) : halftone/grain/scanlines calmes

### SEO mental

- [ ] PWA installable ≠ offline métier (pas de cache API Chroniques)
