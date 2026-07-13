# Déploiement TWIY — Phase 1

## Prérequis
- Compte [Railway](https://railway.app) (API)
- Compte [Vercel](https://vercel.com) (client)
- Projet déjà sur `C:\twiy`

## 1. API → Railway

1. New Project → Deploy from local folder **ou** GitHub repo
2. Root directory : `server`
3. Variables d'environnement (Settings → Variables) — copier depuis `server/.env` :
   - `PORT` = `4000` (Railway injecte souvent `$PORT` automatiquement)
   - `TZ` = `Indian/Antananarivo`
   - `CLIENT_URL` = `https://<ton-app>.vercel.app` (mettre à jour après Vercel)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `WEBHOOK_API_KEY`
   - `GITHUB_WEBHOOK_SECRET`
4. Deploy → noter l'URL publique : `https://xxxx.up.railway.app`

Test :
```bash
curl https://xxxx.up.railway.app/health
```

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

Voir `docs/github-webhook.md`.

Secrets du repo :
- `TWIY_WEBHOOK_URL` = `https://xxxx.up.railway.app/api/webhooks/github`
- `TWIY_WEBHOOK_SECRET` = même valeur que `GITHUB_WEBHOOK_SECRET`

Copier `.github/workflows/twiy-commit-entree.yml` dans ce repo.

## Alternative locale (sans Railway)

Tunnel vers le port 4000 :
```bash
cloudflared tunnel --url http://localhost:4000
```
Utiliser l'URL HTTPS fournie comme `TWIY_WEBHOOK_URL` / base API temporaire.
