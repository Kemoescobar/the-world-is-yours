# TWIY — avancement

## Phase 0 — Sécurisation ✅
## Phase 1 — Boucle quotidienne ✅
## Phase 2 — Vitrine World Poster OS ✅

## Phase 3 — IA + automatisation ✅ (fondations)

## Audit pre-launch — remediation ✅ (code + suivi)

## 5 modules (Apprentissages · Ère · Compétences · Rayonnement · Contremaître) ✅ code+DB

- Migration `20260715_cinq_modules` appliquée (Supabase `gunjokreeewcvlprgljg`) + streak `rayonnement`
- Seed compétences : **29 Dev** (BigFis PDF) + **21 Beatmaker** (HTML) — S13/S15 BigFis = sprints sans cert → non inventés (`docs/roadmaps/`)
- API : `/apprentissages`, `/eres`, `/competences`, `/rayonnement`, `/contremaitre` + `POST /ai/message-matin` + brouillons apprentissages au check-in
- UI : `/ere`, `/rayonnement`, arbre compétences dans ArcDetail, Revue + bandeau Contremaître Chantier, Drops `bilan_ere`
- n8n : workflow `message-matin.json` (à importer/activer)

**Toi** : créer 1ère Ère dans `/ere` · Anthropic Console si drafts IA · désactiver signup Auth si encore ouvert · importer cron matin n8n

### Code
- `POST/GET /api/ai/*` — revue, insights, check-in, titre chapitre, routines-jour, **message-matin**
- Claude via fetch Anthropic (`server/src/lib/claude.js`)
- Mémoire coaching `server/data/coaching-memory.md`
- `POST /chapitres/:id/cloturer` avec titre IA
- UI : Revue, Insights, Capture check-in, Paramètres (statut Claude)

### À activer (toi)
1. Anthropic Console → clé → Railway `ANTHROPIC_API_KEY` → Redeploy (sinon IA soft-off)
2. Tester Revue / Insights / Check-in **après** la clé
3. n8n : importer `message-matin.json` + activer (avec les 4 autres si pas encore)

Doc : `docs/phase-3.md` · roadmaps : `docs/roadmaps/README.md`

## Relancer local
```powershell
cd C:\twiy\server; npm run dev
cd C:\twiy\client; npm run dev
cd C:\twiy\n8n; docker compose up -d
```
