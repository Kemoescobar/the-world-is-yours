# Plan réparations Partie 1 — 2026-07-20

> **Statut** : Partie 1 restante **validée + exécutée** (Dispersion DONE).  
> **Partie 2** : **exécutée** (oxblood + dual register + onde Chantier + Cmd+K + Chronique reveal).  
> **Partie 3** : brief image user-facing, hors Cursor.  
> Sources de vérité shippées : `PROGRESS.md`, `docs/audit-reconcile-2026-07.md`, `docs/ravitaillement.md`, commits `fec7fa2` · `66402fe` · `f5b2687` (+ suite auto `59ce9a1`).

---

## A. Réconciliation audit → réalité

| # | Item master prompt | Statut | Preuve / nuance |
|---|---|---|---|
| 1 | Brancher pages privées + probes Paramètres | **DONE** | `fec7fa2` — JWT gate Chantier ; `Parametres.jsx` probes health/streaks/webhook/`ai/status` (OK ou —) ; Insights/Analytics/Revue via `apiGet` |
| 2 | Réparer `/instrus` · `/projets` (pages blanches) | **DONE** | Redirects → `/catalogue/instrus` · `/catalogue/projets` ; catalogues éditoriaux shippés |
| 3 | Capture + check-in soir | **DONE** | `87da67e` — FAB `QuickCapture` → `entrees` ; `POST /ai/checkin` heuristique ; refresh Chronique |
| 4 | Revue IA en prose narrative | **DONE** *(soft)* | `POST /ai/revue` prose heuristique toujours ; Claude si clé — sinon soft, pas 503 |
| 5 | `competence_id` + Ravitaillement (brouillons) | **CHANGED** + **DONE** *(override)* | **Décision 2026-07-20** : garder **AUTO** (pas de restauration Accept/Refuse). Dev/Beatmaker auto-inject. Croisement **aside** |
| 6 | Preuves + prérequis compétences | **DONE** | `66402fe` + migrations `competences_preuves` / `prerequis` |
| 7 | Dispersion seulement si Ère active | **DONE** | Gate API + UI attach `ere_objectif_id` (ArcDetail) ; soft prompt HorizonFil ; banner seulement ≥50 % hors + ≥2 **et** ≥1 lien déjà posé |
| 8 | Spiral `/drops` | **DONE** | `Drops.jsx` spiral + CSS ; polish LIVE optionnel si chevauchement résiduel |
| 9 | Prospect démo Freelance | **DONE** | Migration `20260716_remove_demo_prospect.sql` |
| 10 | Bouton Corrélations IA grisé | **DONE** | Insights : `disabled` + opacity si `!anthropic` |
| 11 | SoundGate session (pas par onglet) | **DONE** | `sessionStorage twiy_gate` dans `App.jsx` |

### Décisions produit (validées 2026-07-20)

1. **Ravitaillement** — garder **AUTO** (état actuel). Ne pas restaurer le flow brouillon Accept/Refuse.
2. **Croisement** — garder **hidden/aside**. Pas de seed, pas de UI.
3. **Dispersion** — fermer PARTIAL → **DONE** (UI lien objectif + soft prompts + gates vérifiés).

---

## B. Plan Partie 1 restant — exécuté

### Étape 0 — Décisions produit ✅

- [x] Ravitaillement : **auto** (état actuel)
- [x] Croisement : **aside** (état actuel)

### Étape 1 — Fermer Dispersion (PARTIAL → DONE) ✅

| Quoi | Fichiers / routes | Migration ? |
|---|---|---|
| UI attacher `ere_objectif_id` depuis ArcDetail + soft prompt | `ArcDetail.jsx`, `HorizonFil.jsx`, `Chantier.jsx`, `Ere.jsx` ; `PATCH /quetes/:id` | Non |
| Gates LIVE : banner absente sans Ère ; absente si 0 lien ; présente seulement ≥50 % hors + ≥2 | `GET /api/eres/dispersion` | Non |

### Étape 2 — Croisement — **skip** (décision aside)

Rien à coder.

### Étape 3 — Ravitaillement — **skip** (décision auto)

Rien à coder — override documenté dans `docs/ravitaillement.md`.

### Étape 4 — Vérifs smoke (pas de feature)

1. Cycle Capture → Chronique → Revue (heuristique) sur LIVE/local  
2. Spiral Drops : chevauchement résiduel ? polish CSS si besoin  
3. Relancer `link-quetes-competences.mjs --dry-run` pour orphelins `competence_id`  
4. Owner ops (hors code Cursor) : signup Auth, `ANTHROPIC_API_KEY`, clearance assets — `docs/audit-followups.md` / `clearance-checklist.md`

### Hors scope Partie 1 code

- Emploi du temps, Chronique panel, Horizon — déjà shippés  
- Partie 2 palette / onde / collage — **interdit** tant que non validée explicitement

---

## C. Partie 2 — exécutée (2026-07-20)

Ship : oxblood daily palette · dual register (`.registre-quotidien` / `.registre-fort`) · onde Chantier Dev/Beatmaker · Chronique typewriter · Cmd/Ctrl+K · bonus Web Audio tint deck + Drop export carte + `lien_note_obsidian` apprentissages.  
DA : `docs/art-direction.md`.

---

## D. Partie 3 — hors Cursor

Brief DA pour outil de génération d’image (user) : marbre liquide iridescent, mains vers le centre (écho motif), magenta+cyan réservés, pas de copie de la référence (pas 3ᵉ œil / lune / fleur). Alimente uniquement le registre « moments forts » de la Partie 2.
