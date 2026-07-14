# Déploiement TWIY — Phase 1

## Prérequis
- Compte [Railway](https://railway.app) (API)
- Compte [Vercel](https://vercel.com) (client)
- Projet déjà sur `C:\twiy`

## 1. API → Railway

1. New Project → Deploy from GitHub repo `the-world-is-yours`
2. **Root Directory** = `server` (obligatoire — monorepo)
3. **Config as Code** (Settings) = `/server/railway.json` si demandé
4. **Start Command** (si besoin) = `npm start`
5. Variable utile : `RAILPACK_NO_SPA=1` (évite une mauvaise détection site statique)
6. Variables d'environnement — copier depuis `server/.env` :
   - `TZ` = `Indian/Antananarivo`
   - `CLIENT_URL` = `https://<ton-app>.vercel.app` (après Vercel)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `WEBHOOK_API_KEY`
   - `GITHUB_WEBHOOK_SECRET`
7. Deploy → **Networking → Generate Domain**
8. Test : `https://xxxx.up.railway.app/health`

Si erreur `railpack process exited` : presque toujours **Root Directory ≠ server**.
## 2. Client → Vercel

1. Import projet / dossier `client`
2. Framework : Vite
3. Root : `client`
4. Variables :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` = `https://xxxx.up.railway.app/api`
5. Deploy → noter l'URL Vercel
6. **Revenir sur Railway** : mettre `CLIENT_URL` = URL Vercel (CORS)

## 3. GitHub Actions (1 repo)

Voir `docs/github-webhook.md` (URLs prod déjà remplies).

Secrets du repo `Kemoescobar/the-world-is-yours` :
- `TWIY_WEBHOOK_URL` = `https://the-world-is-yours-production.up.railway.app/api/webhooks/github`
- `TWIY_WEBHOOK_SECRET` = même valeur que `GITHUB_WEBHOOK_SECRET` (Railway + `server/.env`)

Le workflow `.github/workflows/twiy-commit-entree.yml` est déjà dans ce repo.

## Alternative locale (sans Railway)

Tunnel vers le port 4000 :
```bash
cloudflared tunnel --url http://localhost:4000
```
Utiliser l'URL HTTPS fournie comme `TWIY_WEBHOOK_URL` / base API temporaire.
