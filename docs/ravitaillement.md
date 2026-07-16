# Ravitaillement — design + implémentation

**Statut** : **implemented** (2026-07-16) · Dev + Beatmaker · Croisement **hidden** (UI) + **skipped** (ravitaillement).  
**Rôle** : remplir le Chantier de quêtes concrètes quand un arc manque d’actifs, à partir de l’arbre compétences / roadmap — jamais en silence.

---

## Problème

Les compétences seedées (Dev + Beatmaker) existent ; les quêtes actives ne sont pas encore systématiquement dérivées de la roadmap. Sans ravitaillement, le Chantier peut se vider ou rester déconnecté de l’arbre.

---

## Déclencheur

- **Condition** : actifs (`a_faire` / `en_cours`) **&lt; 3** **par arc** (`type === arc`).
- **Scan** : **tous** les arcs Dev + Beatmaker en un seul passage (pas un arc à la fois).
- **Hors scope** : arc **Croisement** — pas de ravitaillement ; carte / route Chantier masquées (DB conservée).

---

## Sélection de compétence

1. Parcourir l’arbre de l’arc dans l’**ordre roadmap** (`source_roadmap` / semaine → cours) + **niveaux** Initiation → Pratique → Maîtrise.
2. Si `prerequis` est présent : ne proposer une compétence que si les prérequis ont des **preuves**.
3. Compétence **couverte** (preuve ou quête `fait` liée) / **saturée** (quête active liée) → skip.
4. Remplir le lot en enchaînant les compétences ouvertes si besoin.

Code : `server/src/lib/ravitaillement.js`.

---

## Génération de quêtes — lot ×3

- Cible : **3** actifs par arc (`ACTIVES_TARGET` / `LOT_SIZE`).
- Arc vide → **exactement 3** brouillons ; sinon refill jusqu’à 3.
- Titres **concrets** (templates + ligne `Projet:` roadmap Beatmaker) — pas le titre brut de la compétence.
- Chaque brouillon porte un **`competence_id`**.

---

## Surface UX — toujours brouillon / proposition

- **Jamais** d’injection silencieuse en `quetes`.
- Table `ravitaillement_propositions` (`statut = proposee`) + accepter / refuser.
- UI : bandeau **Contremaître** — **une** carte listant **tous** les arcs needy (lots ×3) + **Accepter tout** / **Refuser**.
- Accepter crée le **lot entier** (3 ou refill) en une action — pas une quête à la fois.

### API

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/ravitaillement/status` | Actifs / besoin / roadmap terminée / props ouvertes |
| GET | `/api/ravitaillement/actif` | Propositions `proposee` |
| POST | `/api/ravitaillement/proposer` | Corps optionnel `{ arc_id?: 'dev'\|'beatmaker' }` → lots pour tous les arcs needy |
| POST | `/api/ravitaillement/repondre-lot` | `{ action: 'accepter'\|'refuser' }` — tous les lots ouverts |
| POST | `/api/ravitaillement/:id/repondre` | `{ action }` — un lot (arc) |

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
4. Dispersion soft : pas de banner si zéro quête a `ere_objectif_id` (« ère pas encore branchée »).

---

## Tests

```powershell
cd C:\twiy\server
npm test
# smoke (WEBHOOK_API_KEY ou session) :
# GET  /api/ravitaillement/status  → besoin sur Dev et/ou Beatmaker
# POST /api/ravitaillement/proposer → lots ×3
# Accepter tout dans l’UI Chantier
```
