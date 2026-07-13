# GitHub → TWIY Chroniques
#
# 1. GITHUB_WEBHOOK_SECRET est généré dans server/.env
# 2. Dans chaque repo à tracker, Settings → Secrets and variables → Actions :
#      TWIY_WEBHOOK_URL    = https://<host-api>/api/webhooks/github
#      TWIY_WEBHOOK_SECRET = (copier depuis server/.env)
# 3. Copier `.github/workflows/twiy-commit-entree.yml` dans le repo
# 4. En local (dev), l'URL peut être un tunnel (cloudflared / ngrok) vers :4000
#
# Test manuel :
#   curl -X POST http://localhost:4000/api/webhooks/github \
#     -H "Content-Type: application/json" \
#     -H "x-webhook-secret: <GITHUB_WEBHOOK_SECRET>" \
#     -d '{"repo":"toi/demo","message":"test commit","sha":"abc1234"}'
