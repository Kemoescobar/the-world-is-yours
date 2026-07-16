# Ravitaillement — design (pas encore implémenté)

**Statut** : design figé · code **non shippé** · dépendances listées en bas.  
**Date** : 2026-07-16  
**Rôle** : remplir le Chantier de quêtes concrètes quand un arc manque d’actifs, à partir de l’arbre compétences / roadmap — jamais en silence.

---

## Problème

Les compétences seedées (Dev + Beatmaker) existent ; les quêtes actives ne sont pas encore systématiquement dérivées de la roadmap. Sans ravitaillement, le Chantier peut se vider ou rester déconnecté de l’arbre.

---

## Déclencheur

- **Condition** : ≤ **1** quête active par arc concerné.
- **Hors scope pour l’instant** : arc **Croisement** — pas de ravitaillement tant que l’arbre Croisement n’est pas peuplé.

---

## Sélection de compétence

1. Parcourir l’arbre de l’arc dans l’**ordre roadmap** (`source_roadmap` / semaine → cours).
2. Respecter les **niveaux** : Initiation → Pratique → Maîtrise.
3. Si `prerequis` est présent : ne proposer une compétence que si les prérequis sont satisfaits (preuves / statut acquis — même logique que le gate preuves déjà shippé).
4. Choisir **une** compétence cible (la prochaine non couverte / non saturée).

---

## Génération de quêtes

- À partir de **cette** compétence, proposer de **remplir jusqu’à une cible de 3–4 quêtes actives** sur l’arc (pas un tirage aléatoire « 1–3 seulement »).
- Titres de quêtes **concrets** (action + livrable), **pas** le titre brut de la compétence.
- Chaque quête proposée porte un **`competence_id`** (lien obligatoire).

Exemple d’esprit (indicatif) :

| Compétence (arbre) | Quêtes proposées (brouillon) |
|---|---|
| Initiation — Git & GitHub | « Créer le repo du projet X » · « Premier push avec README » · « Ouvrir une PR de polish » |

---

## Surface UX — toujours brouillon / proposition

Aligné Contremaître et apprentissages check-in :

- **Jamais** d’injection silencieuse en base comme quêtes `a_faire` actives.
- Toujours un **brouillon / proposition** à accepter ou rejeter.
- Surfaces prévues :
  - bandeau **Contremaître** (Chantier), et/ou
  - **message matin**, et/ou
  - **Revue** (section dédiée ou rappel).

Pattern de référence déjà en prod : `suggestions_contremaitre.statut = 'proposee'` + feedback utile / pas utile ; apprentissages en `apprentissages_brouillon` sans auto-insert.

---

## Arbre épuisé

Quand plus aucune compétence éligible sur l’arc :

- Signal clair, non ambigu : **« roadmap [arc] terminée »** (ex. `roadmap Dev terminée`).
- Pas de faux ravitaillement ni de quêtes inventées hors arbre.

---

## Croisement — aside

Pas de ravitaillement sur **Croisement** tant que l’arbre compétences Croisement n’est pas peuplé. Revisiter après seed / design arbre.

---

## Dépendances (avant code produit)

1. **Persistance API réelle** des quêtes (déjà là) + usage systématique de `quetes.competence_id`.
2. **Lier les quêtes existantes** à un `competence_id` (migration / script / édition manuelle) — sinon le ravitaillement double ou ignore l’existant.
3. Règles de statut « compétence couverte » (preuves attachées, quêtes faites liées) — s’appuyer sur `competences_preuves` + quêtes liées déjà en place depuis `66402fe`.

---

## Hors périmètre (v1)

- Génération IA obligatoire des titres (peut être templates déterministes d’abord).
- Auto-acceptation.
- Ravitaillement multi-arcs en une passe.
- Croisement.

---

## Ordre d’implémentation suggéré

1. Audit data : combien de quêtes actives ont déjà `competence_id` ?
2. Script / UI pour rattacher les orphelines.
3. Endpoint `POST /ravitaillement/proposer` (ou extension Contremaître) → brouillons seulement.
4. UI accept / reject → insert quêtes avec `competence_id`.
5. Signal « roadmap terminée ».
