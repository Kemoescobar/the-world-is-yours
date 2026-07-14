# TWIY — avancement

## Phase 0 — Sécurisation ✅
## Phase 1 — Boucle quotidienne ✅
## Phase 2 — Vitrine World Poster OS ✅

## Phase 3 — IA + automatisation ✅ (fondations)

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
