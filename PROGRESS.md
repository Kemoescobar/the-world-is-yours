# Phase 0 — Sécurisation (terminée 2026-07-13)

## Livré
1. **JWT** — middleware `requireAuth` sur routes privées ; webhooks gardent leur auth dédiée
2. **Client `lib/api.js`** — Bearer injecté partout
3. **Layouts** — `LayoutPublic` (vitrine) vs `Layout` privé + QuickCapture ; catalogues publics en lecture seule ; écriture via `/studio/*`
4. **Zod** — allowlist sur tous les POST/PATCH
5. **Idempotence quête `fait`** — entrée/streak seulement à la transition
6. **Dédup GitHub** — colonne `source_ref` + index unique
7. **Timezone** — `TZ=Indian/Antananarivo` pour les streaks
8. **CORS** — whitelist `CLIENT_URL`
9. **Export** — auth + tables portefeuille/config incluses

## Pour tester
1. Créer un user Auth Supabase (si pas encore)
2. `cd W:\server && npm run dev` · `cd W:\client && npm run dev`
3. Sans login : `/catalogue/*` OK, `/api/quetes` → 401
4. Avec login : `/chantier`, capture `+`, studio

## Ensuite
**Phase 1** — usage quotidien (deploy, GitHub réel, seed, streak rompu)
