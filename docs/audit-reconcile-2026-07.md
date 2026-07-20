# Audit reconcile — 2026-07

Cartographie **claims d’audit humains / sessions récentes** → état **réel** sur `main` (HEAD `fec7fa2`, compétences `66402fe`).  
Ne pas répéter comme « cassé » ce qui est déjà shippé.

| Claim / observation | Statut | Preuve |
|---|---|---|
| Chantier fetch sans session → 401 / Network spam | **DONE** | `fec7fa2` — fetches gated sur JWT (`Chantier.jsx`, slices) |
| Paramètres « fake » / toujours OK | **DONE** | `fec7fa2` — probes réels health / streaks / webhook / `ai/status` → OK ou — |
| Claude affiché OK sans clé | **DONE** | LIVE : Claude reste **—** (honnête) tant que pas `ANTHROPIC_API_KEY` |
| `/instrus` / `/projets` hors sitemap catalogue | **DONE** | redirects → `/catalogue/instrus` · `/catalogue/projets` |
| Dispersion sans Ère active | **DONE** (gate code) | API + UI : pas de banner si `ere === null` |
| Dispersion encore visible sur Chantier LIVE | **DONE** | Soft : pas de banner si zéro `ere_objectif_id` (« pas encore branchée ») ; sinon ≥50 % hors objectif et ≥2 ; UI attach ArcDetail |
| Drops spiral | **DONE** | `Drops.jsx` spiral / liste |
| Insights cliquable sans IA | **DONE** | disabled si `ai/status.anthropic` faux |
| Prospect freelance démo | **DONE** | migration `20260716_remove_demo_prospect.sql` |
| Compétences non interactives / pas de preuves | **DONE** | `66402fe` — expand, preuves, prérequis, migration appliquée |
| Chantier LIVE instable / compteurs faux | **DONE** (vérif LIVE) | loading puis 13/13 stable ; Contremaître OK |
| « Tout est statique / Paramètres fake / compétences sans preuves » (audit ancien) | **OUTDATED** | Remplacé par les lignes DONE ci-dessus |
| Ravitaillement (remplir quêtes depuis roadmap) | **DONE** | Dev + Beatmaker — [`ravitaillement.md`](./ravitaillement.md) ; Croisement skipped |
| Signup public Auth encore ouvert | **OPEN** (toi / Dashboard) | hors code — voir `audit-followups.md` |
| Clé Anthropic Console | **OPEN** (toi) | soft-off IA volontaire |
| Clearance assets / samples | **OPEN** | `clearance-checklist.md` |

## Jarvis / Pennyworth (fichier Desktop)

Lu pour contexte perso. Objectifs duals (freelance IA/dev + beatmaker **sans IA dans la musique**) et besoin d’ordre / tâches quotidiennes → déjà alignés avec TWIY (Chantier, Contremaître, Ravitaillement). **Jarvis n’est pas un module TWIY** ; pas de doc d’intégration ici.
