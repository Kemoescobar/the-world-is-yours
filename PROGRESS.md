# TWIY — avancement

## Phase 0 — Sécurisation ✅
## Phase 1 — Boucle quotidienne ✅
## Phase 2 — Vitrine World Poster OS ✅

## Phase 3 — IA + automatisation ✅ (fondations)

## Audit pre-launch — remediation ✅ (code)

- Allowlist `OWNER_USER_ID` / `ALLOWED_USER_IDS` sur routes privées + export
- Catalogues : JWT vérifié avant levée filtre showcase/shippé
- Rate-limit webhooks + `/api/ai` + export ; cooldown login client
- Mentions légales + confidentialité (`/mentions`, `/confidentialite`)
- Fonts self-host (@fontsource), lazy routes, `prefers-reduced-motion`, `:focus-visible`
- Migration RLS owner + indexes FK (`supabase/migrations/20260714_…`)
- Suivi humain : `docs/audit-followups.md` · détail auth : `docs/auth-hardening.md`

**À faire côté toi** : poser `OWNER_USER_ID` sur Railway, insert `app_owners`, fermer signup Auth.

### Code
- `POST/GET /api/ai/*` — revue, insights, check-in, titre chapitre, routines-jour
- Claude via fetch Anthropic (`server/src/lib/claude.js`)
- Mémoire coaching `server/data/coaching-memory.md`
- `POST /chapitres/:id/cloturer` avec titre IA
- UI : Revue, Insights, Capture check-in, Paramètres (statut Claude)

### À activer (toi)
1. Railway → `ANTHROPIC_API_KEY` → Redeploy  
2. Tester Revue / Insights / Check-in  
3. (Optionnel) Importer workflows `n8n/` + crons  

Doc : `docs/phase-3.md`

## Relancer local
```powershell
cd C:\twiy\server; npm run dev
cd C:\twiy\client; npm run dev
```
