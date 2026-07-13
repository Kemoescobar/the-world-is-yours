# GitHub → TWIY Chroniques

## Prérequis
- API déployée (Railway) **ou** tunnel `cloudflared` vers `:4000`
- `GITHUB_WEBHOOK_SECRET` dans `server/.env` (déjà généré en Phase 0)

## Brancher 1 repo

1. Ouvre le repo GitHub à tracker (idéalement celui de TWIY ou ton repo principal)
2. **Settings → Secrets and variables → Actions → New repository secret** :
   - `TWIY_WEBHOOK_URL` = `https://<api>/api/webhooks/github`
   - `TWIY_WEBHOOK_SECRET` = valeur de `GITHUB_WEBHOOK_SECRET` dans `server/.env`
3. Copie le fichier `.github/workflows/twiy-commit-entree.yml` à la racine du repo
4. Push sur `main` / `master` → une entrée `commit` doit apparaître dans Chroniques + streak Dev

## Test manuel (local)

```bash
curl -X POST http://localhost:4000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: <GITHUB_WEBHOOK_SECRET>" \
  -d "{\"repo\":\"toi/demo\",\"message\":\"test commit\",\"sha\":\"abc1234ffff\"}"
```

- 1er appel → `201`
- même `sha` → `200` (dédup)

## Ne pas utiliser
`notify-entree.yml` — workflow obsolète / redondant. Garder uniquement `twiy-commit-entree.yml`.
