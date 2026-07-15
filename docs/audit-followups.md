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
- [x] n8n Docker local (`n8n/docker-compose.yml`, `.env` gitignored) + Obsidian via `host.docker.internal`
- [x] 4 workflows importés + publiés (`publish:workflow`) — IDs `twiy-*`
- [x] API : `requireAuthOrApiKey` sur `/streaks`, `/export`, `/quetes` (n8n `x-api-key`)

## Bloqué côté Dashboard (MCP sans mutation Auth)

Le MCP Supabase **n’expose pas** `disable_signup` / HaveIBeenPwned. Alternative : [Management API](https://supabase.com/docs/reference/api/v1-update-auth-service-config) avec un [access token](https://supabase.com/dashboard/account/tokens) personnel :

```powershell
$PROJECT_REF = "gunjokreeewcvlprgljg"
# Token depuis https://supabase.com/dashboard/account/tokens — ne pas committer
$env:SUPABASE_ACCESS_TOKEN = "sbp_..."

Invoke-RestMethod -Method PATCH `
  -Uri "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" `
  -Headers @{ Authorization = "Bearer $env:SUPABASE_ACCESS_TOKEN"; "Content-Type" = "application/json" } `
  -Body '{"disable_signup":true,"password_hibp_enabled":true}'
```

Sans token : Dashboard uniquement.

### 1. Désactiver le signup public

1. Ouvre [Supabase Dashboard](https://supabase.com/dashboard/project/gunjokreeewcvlprgljg/auth/providers) → projet **The World Is Yours**
2. **Authentication** → **Providers** → **Email**
3. Désactive **Enable sign ups** / *Allow new users to sign up*
4. Save

Un seul compte owner : `fisandratajohnson@gmail.com`.

### 2. HaveIBeenPwned (leaked password protection)

1. Même projet → **Authentication** → **Providers** → **Email** (ou **Password** / Security selon UI)
2. Active **Leaked password protection** (HaveIBeenPwned)
3. Save

Note : HIBP est souvent réservé au **plan Pro** et plus. Advisor : `auth_leaked_password_protection`.

## Toi seulement (hors code — ne pas confondre avec « fait »)

### Railway / IA

- [ ] `ANTHROPIC_API_KEY` — **non posé** (Claude Pro ≠ clé API). Poser seulement si tu prends une clé Anthropic Console ; sinon Revue / Insights restent soft-disabled.
- [ ] Confirmer `CLIENT_URL` = `https://the-world-is-yours-seven.vercel.app` (CORS)

### n8n

- [x] Docker compose local + `.env` (`TWIY_API_URL` + `TWIY_WEBHOOK_KEY`)
- [x] Workflows JSON (Obsidian → `host.docker.internal`)
- [ ] Premier compte owner n8n UI si pas encore créé → http://localhost:5678
- [x] Toggle **Active** / `publish:workflow` (4/4 actifs dans n8n local)
- [ ] Obsidian Local REST API + `OBSIDIAN_API_KEY` pour sync/backup/revue écriture vault
- [ ] Attendre redeploy Railway après push (pour que `/streaks`+`/export`+`/quetes` acceptent `x-api-key`) puis valider alerte-streak

### Légal / assets

Checklist détaillée (à cocher) : [`clearance-checklist.md`](./clearance-checklist.md)

- [ ] Clearance samples audio avant showcase public large des instrumentaux
- [ ] Confirmer droits sur `globe-hand.png` / `globe-youth.png` / `vinyl-chrome.png` et captures uploadées
- [ ] Si monetisation plus tard : CGV + enrichir privacy

### Accessibilité / qualité

- [ ] Mesurer contraste `--text-muted` (#8a95b8) sur `--bg-0` (#060a1a) (WCAG) ; remonter la luminosité si &lt; 4.5:1
- [ ] Parcourir au clavier (Tab) les pages publiques après deploy — outlines `:focus-visible` jaunes
- [ ] Tester `prefers-reduced-motion` (OS) : halftone/grain/scanlines calmes

### SEO mental

- [ ] PWA installable ≠ offline métier (pas de cache API Chroniques)
