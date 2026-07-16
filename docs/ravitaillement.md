# Ravitaillement — design + implémentation

**Statut** : **auto** (2026-07-16) · Dev + Beatmaker · Croisement **hidden** (UI) + **skipped** (ravitaillement).  
**Rôle** : remplir le Chantier de quêtes concrètes quand un arc manque d’actifs, à partir de l’arbre compétences / roadmap.

> **Override produit (2026-07-16)** : l’ancien principe « jamais d’injection silencieuse » est **abandonné**. Le chemin normal crée les quêtes **directement** (pas de carte Accepter / Refuser). L’UI informe seulement (`Ravitaillement auto · N quêtes ajoutées`).

---

## Problème

Les compétences seedées (Dev + Beatmaker) existent ; les quêtes actives ne sont pas encore systématiquement dérivées de la roadmap. Sans ravitaillement, le Chantier peut se vider ou rester déconnecté de l’arbre.

---

## Déclencheur

- **Condition** : actifs (`a_faire` / `en_cours`) **&lt; 3** **par arc** dans le **chapitre ouvert** (même filtre que Chantier `quetesPourArc`) — les `a_faire` hors chapitre / orphelins sont **ignorés** pour le compte.
- **Types** : Dev = `dev` + `routine` + `freelance` (comme la carte) ; Beatmaker = `beatmaker` seulement. Les quêtes auto créées restent `type = arc_id`.
- **Carte ArcCard** : affiche **toutes** les non-fait d’abord (plus de `slice(0,4)` qui masquait les actifs derrière le seed `fait`).
- **Scan** : **tous** les arcs Dev + Beatmaker en un seul passage (pas un arc à la fois).
- **Quand** : chargement Chantier → bandeau Contremaître appelle `POST /api/ravitaillement/auto` puis `twiy:quetes-changed`.
- **Hors scope** : arc **Croisement** — pas de ravitaillement ; carte / route Chantier masquées (DB conservée).

---

## Sélection de compétence

1. Parcourir l’arbre de l’arc dans l’**ordre roadmap exact** (`source_roadmap` / semaine → cours). Les niveaux ne réordonnent plus (évite S4-C4 avant S4-C3).
2. Si `prerequis` est présent (**ravitaillement soft-unlock**) : OK si prérequis a une **preuve** **ou** une quête liée `fait` (pas preuve-only). Croisement toujours skip.
3. Compétence **couverte** (preuve ou quête `fait` liée) / **saturée** (quête active liée) → skip.
4. Remplir le lot en enchaînant les compétences ouvertes si besoin.
5. **Ne jamais inventer** de compétences hors DB / hors `source_roadmap`.
6. Absence de drafts : distinguer **`bloqué prereqs`** vs **`roadmap [arc] terminée`**.

Code : `server/src/lib/ravitaillement.js`.

---

## Génération de quêtes — lot ×3 (insert direct)

- Cible : **3** actifs par arc (`ACTIVES_TARGET` / `LOT_SIZE`) dans le chapitre courant.
- Arc vide → **exactement 3** quêtes `a_faire` ; sinon refill jusqu’à 3.
- Titres **directs** (verbe d’action) : ligne `Projet:` / premier Objectif (Beatmaker), sinon `Terminer {titre}` (Dev/certifs) — pas « Avancer le parcours… ». Une quête par compétence dans le lot (ordre roadmap).
- Chaque quête porte un **`competence_id`** + **`chapitre_id`** du chapitre ouvert.
- **Idempotence** : si actifs (chapitre) ≥ 3 → no-op. Debounce in-memory **10 s** par arc **uniquement après create réussi** (attempt vide ne bloque pas).

---

## Surface UX — info only (plus de proposition)

- **Plus** de carte Accepter / Refuser sur le chemin normal.
- Contremaître : message **honnête** — `N quêtes ajoutées` / `assez d'actifs (n)` / `debounce` / `bloqué prereqs` / `roadmap terminée`. Jamais « actifs ≥ 3 » si actives = 0.
- Table `ravitaillement_propositions` : **non écrite** par le chemin auto ; propositions `proposee` restantes sont archivées (`refusee` + note obsolète) au passage. Routes legacy `/repondre*` conservées mais inutilisées par l’UI.

### API

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/ravitaillement/status` | Actifs / besoin / roadmap terminée |
| POST | `/api/ravitaillement/auto` | **Principal** — refill auto tous les arcs needy → insert `quetes` |
| POST | `/api/ravitaillement/proposer` | Alias de `/auto` (compat) |
| GET | `/api/ravitaillement/actif` | Legacy propositions `proposee` (attendu vide) |
| POST | `/api/ravitaillement/repondre-lot` | Legacy accepter/refuser lots |
| POST | `/api/ravitaillement/:id/repondre` | Legacy un lot |

---

## Arbre épuisé

Signal : **`roadmap [arc] terminée`** (ex. `roadmap Dev terminée`) — pas de faux brouillons.

---

## Croisement — aside

**Hidden** en UI Chantier / ArcDetail ; **skipped** en ravitaillement. Revisiter après seed / design arbre Croisement.

---

## Dépendances shippées avec

1. Persistance quêtes API (déjà là) + `competence_id` sur drafts.
2. Migration `20260716_ravitaillement` + liens best-effort quêtes existantes (Dev/Beatmaker) — ambigu → `null`.
3. Script : `server/scripts/link-quetes-competences.mjs` (`--dry-run` ok).
4. Dispersion soft : pas de banner Contremaître « suggestion » si zéro quête a `ere_objectif_id` (« ère pas encore branchée »).

---

## Tests

```powershell
cd C:\twiy\server
npm test
# smoke (WEBHOOK_API_KEY ou session) :
# GET  /api/ravitaillement/status  → besoin sur Dev et/ou Beatmaker
# POST /api/ravitaillement/auto    → quetes créées (ou rien à faire / roadmap terminée)
# Recharger Chantier → note info, pas de boutons Accepter/Refuser
```
