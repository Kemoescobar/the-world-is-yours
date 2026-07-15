# Phase 3 — IA + automatisation

## Objectif
Faire tourner Chroniques **sans tout saisir à la main** : Claude côté serveur, n8n, routines du jour, mémoire coaching.

## Prérequis Railway
Ajouter la variable :

```
ANTHROPIC_API_KEY=sk-ant-...
```

Optionnel :

```
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

Redeploy le service `server` après.

## API (`/api/ai/*`)
Auth : JWT Bearer **ou** header `x-api-key: WEBHOOK_API_KEY` (n8n).

| Endpoint | Rôle |
|----------|------|
| `GET /ai/status` | Clé Anthropic présente ? |
| `POST /ai/revue` | Revue dominicale |
| `POST /ai/insights` | Corrélations |
| `POST /ai/checkin` | `{ texte, creer?: true }` → faits structurés |
| `POST /ai/chapitre-titre` | `{ chapitre_id, appliquer?: true }` |
| `POST /ai/routines-jour` | Quêtes routine du jour |

Aussi : `POST /api/chapitres/:id/cloturer` génère titre + clos.

## UI
- **Revue** → bouton Générer IA
- **Insights** → Corrélations IA
- **Capture +** → onglet Check-in IA
- **Paramètres** → statut Claude + Routines du jour

## Mémoire coaching
Fichier : `server/data/coaching-memory.md` (relu à chaque appel IA).  
Les check-ins peuvent y appendre une leçon.

## n8n
Workflows dans `n8n/` — variables :

| Variable | Valeur |
|----------|--------|
| `TWIY_API_URL` | `https://the-world-is-yours-production.up.railway.app/api` |
| `TWIY_WEBHOOK_KEY` | = `WEBHOOK_API_KEY` Railway |
| `ANTHROPIC_API_KEY` | (si le workflow appelle Anthropic direct) |
| `OBSIDIAN_API_KEY` | Local REST API — setup : [`obsidian-rest.md`](./obsidian-rest.md) |

Préférer appeler **`POST /ai/revue`** depuis n8n (auth `x-api-key`) plutôt que dupliquer Claude dans le workflow.

## Checklist activation
1. `ANTHROPIC_API_KEY` sur Railway → Redeploy (Claude Pro seul ≠ clé Console ; sans clé, `/api/ai/*` soft-off)  
2. Paramètres → Claude OK  
3. Revue → Générer  
4. n8n local : `cd C:\twiy\n8n; docker compose up -d` → import CLI (voir `n8n/README.md`) → activer les crons  
5. Routines du jour chaque matin (bouton ou cron n8n)
