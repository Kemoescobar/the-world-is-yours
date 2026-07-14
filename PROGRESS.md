# TWIY — avancement

## Phase 0 — Sécurisation ✅
JWT, `lib/api.js`, layouts public/privé, Zod, idempotence quêtes, dédup GitHub, TZ Madagascar, CORS.

## Phase 1 — Boucle quotidienne ✅

### Code
- Seed Chapitre 0 + quêtes amorçage (Saison 1)
- Streak rompu → chapitres `rompu` ; reprise → `reprise`
- `enRetard` + badge rompu/reprise sur Chantier
- Configs : `server/railway.json`, `client/vercel.json`
- Docs : `docs/deploy.md`, `docs/github-webhook.md`
- Workflow `twiy-commit-entree.yml` ; normalisation `VITE_API_URL` (https)

### Déploiement
| Élément | URL / note |
|---------|------------|
| API Railway | `https://the-world-is-yours-production.up.railway.app` |
| Client Vercel | `https://the-world-is-yours-seven.vercel.app` |
| `CLIENT_URL` | Vercel URL (CORS) |
| `VITE_API_URL` | Railway `/api` **avec** `https://` |

### GitHub → Chroniques
Workflow prêt. Secrets repo à confirmer une fois :
- `TWIY_WEBHOOK_URL`
- `TWIY_WEBHOOK_SECRET` (= `GITHUB_WEBHOOK_SECRET`)

Voir `docs/github-webhook.md`.

### Usage
Vivre la boucle : Capture + Chantier + commits (streak Dev auto si secrets OK).

## Relancer local
```powershell
cd C:\twiy\server; npm run dev
cd C:\twiy\client; npm run dev
```
→ http://localhost:5173/login

## Suite
- **Phase 2** — vitrine / polish public
- **Phase 3** — IA + 1 flux n8n
