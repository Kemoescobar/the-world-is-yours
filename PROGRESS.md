# TWIY — avancement

## Phase 0 — Sécurisation ✅
JWT, `lib/api.js`, layouts public/privé, Zod, idempotence quêtes, dédup GitHub, TZ Madagascar, CORS.

## Phase 1 — Boucle quotidienne (en cours)

### Fait (code)
- Seed Chapitre 0 + quêtes amorçage (Saison 1)
- Streak rompu → chapitres `rompu` ; reprise → `reprise`
- `enRetard` + badge rompu/reprise sur Chantier
- Configs : `server/railway.toml`, `client/vercel.json`
- Docs : `docs/deploy.md`, `docs/github-webhook.md`
- Workflow obsolète `notify-entree.yml` supprimé

### À faire (toi)
1. **Déployer l'API** — Railway, voir `docs/deploy.md`
2. **Déployer le client** — Vercel, `VITE_API_URL` = URL Railway `/api`
3. Mettre à jour `CLIENT_URL` sur Railway = URL Vercel
4. **Brancher 1 repo GitHub** — secrets + workflow `twiy-commit-entree.yml`
5. Vivre **7 jours** : Capture + Chantier + commits

### Usage quotidien possible
**Oui, dès maintenant en local** (`C:\twiy`).  
**En ligne** dès que Railway + Vercel sont up.

## Relancer local
```powershell
cd C:\twiy\server; npm run dev
cd C:\twiy\client; npm run dev
```
→ http://localhost:5173/login
