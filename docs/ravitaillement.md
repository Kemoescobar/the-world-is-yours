# Ravitaillement — design + implémentation

**Statut** : **implemented** (2026-07-16) · Dev + Beatmaker · Croisement **skipped**.  
**Rôle** : remplir le Chantier de quêtes concrètes quand un arc manque d’actifs, à partir de l’arbre compétences / roadmap — jamais en silence.

---

## Problème

Les compétences seedées (Dev + Beatmaker) existent ; les quêtes actives ne sont pas encore systématiquement dérivées de la roadmap. Sans ravitaillement, le Chantier peut se vider ou rester déconnecté de l’arbre.

---

## Déclencheur

- **Condition** : ≤ **1** quête active (`a_faire` / `en_cours`) **par arc** (`type === arc`).
- **Hors scope** : arc **Croisement** — pas de ravitaillement tant que l’arbre Croisement n’est pas peuplé.

---

## Sélection de compétence

1. Parcourir l’arbre de l’arc dans l’**ordre roadmap** (`source_roadmap` / semaine → cours) + **niveaux** Initiation → Pratique → Maîtrise.
2. Si `prerequis` est présent : ne proposer une compétence que si les prérequis ont des **preuves**.
3. Compétence **couverte** (preuve ou quête `fait` liée) / **saturée** (quête active liée) → skip.
4. Choisir **une** compétence cible.

Code : `server/src/lib/ravitaillement.js`.

---

## Génération de quêtes

- Remplir jusqu’à une cible de **4** actifs sur l’arc (3–4).
- Titres **concrets** (templates + ligne `Projet:` roadmap Beatmaker) — pas le titre brut de la compétence.
- Chaque brouillon porte un **`competence_id`**.

---

## Surface UX — toujours brouillon / proposition

- **Jamais** d’injection silencieuse en `quetes`.
- Table `ravitaillement_propositions` (`statut = proposee`) + accepter / refuser.
- UI : bandeau **Contremaître** sur le Chantier (liste des drafts + boutons).

### API

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/ravitaillement/status` | Actifs / besoin / roadmap terminée / props ouvertes |
| GET | `/api/ravitaillement/actif` | Propositions `proposee` |
| POST | `/api/ravitaillement/proposer` | Corps optionnel `{ arc_id?: 'dev'\|'beatmaker' }` → brouillons |
| POST | `/api/ravitaillement/:id/repondre` | `{ action: 'accepter'\|'refuser' }` — accepter **seul** crée les quêtes |

---

## Arbre épuisé

Signal : **`roadmap [arc] terminée`** (ex. `roadmap Dev terminée`) — pas de faux brouillons.

---

## Croisement — aside

**Skipped** en v1. Revisiter après seed / design arbre Croisement.

---

## Dépendances shippées avec

1. Persistance quêtes API (déjà là) + `competence_id` sur drafts.
2. Migration `20260716_ravitaillement` + liens best-effort quêtes existantes (Dev/Beatmaker) — ambigu → `null`.
3. Script : `server/scripts/link-quetes-competences.mjs` (`--dry-run` ok).
4. Dispersion soft : pas de banner si zéro quête a `ere_objectif_id` (« ère pas encore branchée »).

---

## Tests

```powershell
cd C:\twiy\server
npm test
# smoke (WEBHOOK_API_KEY) :
# POST /api/ravitaillement/proposer → Accepter dans l’UI Chantier
```
