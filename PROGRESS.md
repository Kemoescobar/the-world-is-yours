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
| Dispersion gate | Banner **uniquement** si Ère `active` **et** au moins 1 quête déjà liée à un `ere_objectif_id` **et** ≥50 % hors objectif (≥2) — sinon « pas encore branchée » |
| Dispersion UI lien | ArcDetail : select objectif d’ère par quête (`PATCH /quetes/:id`) · soft prompt HorizonFil / Ère (pas d’alarme si 0 lien) |
| Drops spiral | Vue spiral / liste |
| Insights sans IA | **Supersédé** — page retirée ; `/insights` → `/chantier` (onde remplace Insights) |
| **Partie 2 deferred** | Collage SVG hebdo Chronique/Revue · `.globe-hand-vivant` Drop · AnalyserNode tint catalogue · Insights redirect |
| Demo freelance | Prospect seedé retiré (migration) |
| Compétences interactives | Expand + preuves + prérequis roadmap (`66402fe`, migration appliquée) |
| Contremaître | Bandeau Chantier OK en LIVE |
| **Ravitaillement** | Auto-fill Dev/Beatmaker (cible 3 actifs / chapitre courant) · Croisement skipped |
| **Emploi du temps** | Plan du jour heuristique (pas d’IA requise) · slots liés aux quêtes réelles · HUD Chantier |
| **Chronique** | Bloc récit hero Chantier · `GET /api/chronique/jour` + `/chapitre-actif` · heuristique toujours, Claude soft |
| **Titres chapitre** | Heuristique sur faits réels · clôture + auto-remplace seed générique · header Chantier |
| **Revue récit** | `POST /ai/revue` prose heuristique sans 503 · stats secondaires |
| **Capture +** | FAB z-index fixé · crée `entrees` · events refresh Chronique/quetes · toast |
| **Check-in soir** | `POST /ai/checkin` heuristique sans Claude · modes FAB / Contremaître / Chronique |
| **Horizon fil** | Aujourd’hui → Chapitre → Ère + accumulation sur ArcCards |

### OPEN

| Item | Notes |
|---|---|
| Auth signup public | Dashboard Supabase / Management API — `audit-followups.md` |
| `ANTHROPIC_API_KEY` | Soft-off volontaire tant que pas posé |
| Clearance assets / samples | `clearance-checklist.md` |
| Ravitaillement Croisement | Aside jusqu’à seed arbre Croisement |

### NEXT

1. ~~Ravitaillement Dev/Beatmaker~~ ✅
2. ~~Emploi du temps intelligent~~ ✅
3. ~~Chronique / Capture / Horizon~~ ✅ — sang dans le système (entrees → récit → fil Ère)
4. ~~UI Dispersion / `ere_objectif_id`~~ ✅ — ArcDetail + soft prompts (décision 2026-07-20)
5. Toi : clé Anthropic + signup fermé + clearance si ouverture publique large
6. Croisement ravitaillement après peuplement compétences (aside jusqu’à décision contraire)
7. ~~Partie 2 oxblood / onde / Cmd+K~~ ✅
8. ~~Partie 2 deferred~~ ✅ (2026-07-20) — collage Chronique/Revue · main-globe vivant Drop · AnalyserNode deck instrus · Insights → `/chantier`
9. ~~Partie 3 images registre fort~~ ✅ — patchwork moodboard (`brand/moodboard/` ×12) sur Gate / Home / Drop / Instrus ; palette charcoal+wine+cobalt ; SoundGate `globe-hand` conservé ; Chantier calme

---

## Relancer local
```powershell
cd C:\twiy\server; npm run dev
cd C:\twiy\client; npm run dev
cd C:\twiy\n8n; docker compose up -d
```
