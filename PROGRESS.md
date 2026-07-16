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

**Toi** : Anthropic Console si drafts IA · désactiver signup Auth si encore ouvert · importer/activer cron matin n8n si pas fait

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

---

## Fondation audit runtime — ✅ shippé `main` (`fec7fa2` + `66402fe`)

> Les claims d’audit plus anciens du type « tout statique / Paramètres fake / compétences sans preuves » sont **outdatés** là où le code a corrigé. Cartographie : [`docs/audit-reconcile-2026-07.md`](docs/audit-reconcile-2026-07.md).

### DONE (vérifié code + LIVE)

| Item | Notes |
|---|---|
| Chantier session-gated | Pas de fetch API sans JWT ; loading puis compteurs stables (LIVE 13/13) |
| Paramètres probes réels | health / streaks / webhook / AI → **OK** ou **—** (Claude honnêtement — sans clé) |
| Routes catalogue | `/instrus` → `/catalogue/instrus`, `/projets` → `/catalogue/projets` |
| Dispersion gate | Banner **uniquement** si Ère `active` (API + UI) |
| Drops spiral | Vue spiral / liste |
| Insights sans IA | Bouton désactivé si Anthropic soft-off |
| Demo freelance | Prospect seedé retiré (migration) |
| Compétences interactives | Expand + preuves + prérequis roadmap (`66402fe`, migration appliquée) |
| Contremaître | Bandeau Chantier OK en LIVE |

### OPEN

| Item | Notes |
|---|---|
| **Dispersion banner LIVE** | Gate code OK ; banner encore visible dès qu’une Ère est active et que des quêtes n’ont pas `ere_objectif_id` (cas courant). Affiner le signal ou rattacher les quêtes aux objectifs d’ère. |
| Auth signup public | Dashboard Supabase / Management API — `audit-followups.md` |
| `ANTHROPIC_API_KEY` | Soft-off volontaire tant que pas posé |
| Clearance assets / samples | `clearance-checklist.md` |

### NEXT — Ravitaillement

Design figé (pas de code encore) : [`docs/ravitaillement.md`](docs/ravitaillement.md).

Ordre de travail unifié :

1. ~~Fondation audit runtime (session, Paramètres, routes, compétences/preuves)~~ ✅
2. **Ravitaillement** — proposer 3–4 quêtes actives depuis la roadmap (brouillon Contremaître / matin / Revue) ; Croisement aside
3. Affiner Dispersion (seuils / `ere_objectif_id`) si le bruit LIVE gêne encore
4. Toi : clé Anthropic + signup fermé + clearance si ouverture publique large

---

## Relancer local
```powershell
cd C:\twiy\server; npm run dev
cd C:\twiy\client; npm run dev
cd C:\twiy\n8n; docker compose up -d
```
