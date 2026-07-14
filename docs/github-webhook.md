# GitHub → TWIY Chroniques

## Prérequis
- API déployée (Railway) **ou** tunnel `cloudflared` vers `:4000`
- `GITHUB_WEBHOOK_SECRET` dans `server/.env` **et** sur Railway (Variables)

## URLs prod (Phase 1)

| Rôle | URL |
|------|-----|
| API | `https://the-world-is-yours-production.up.railway.app` |
| Webhook | `https://the-world-is-yours-production.up.railway.app/api/webhooks/github` |
| Client | `https://the-world-is-yours-seven.vercel.app` |

## Brancher 1 repo (`Kemoescobar/the-world-is-yours`)

1. GitHub → repo → **Settings → Secrets and variables → Actions → New repository secret** :
   - `TWIY_WEBHOOK_URL` = `https://the-world-is-yours-production.up.railway.app/api/webhooks/github`
   - `TWIY_WEBHOOK_SECRET` = **exactement** la valeur de `GITHUB_WEBHOOK_SECRET` (local `server/.env` **et** Railway)
2. Le workflow `.github/workflows/twiy-commit-entree.yml` est déjà dans ce repo
3. Push sur `main` → une entrée `commit` doit apparaître dans Chroniques + streak Dev

## Test manuel (prod)

```bash
curl -X POST https://the-world-is-yours-production.up.railway.app/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <GITHUB_WEBHOOK_SECRET>" \
  -d "{\"repo\":\"Kemoescobar/the-world-is-yours\",\"message\":\"test commit\",\"sha\":\"abc1234ffff\"}"
```

- 1er appel → `201`
- même `sha` → `200` (dédup)
- secret faux → `401`

## Ne pas utiliser
`notify-entree.yml` — workflow obsolète / redondant. Garder uniquement `twiy-commit-entree.yml`.
