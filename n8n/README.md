# Workflows n8n — THE WORLD IS YOURS

4 workflows prêts à importer + patterns pour les restants. **Pas obligatoire** pour la vitrine soft-launch.

## Activation copy-paste (quand tu veux)

### A. Lancer n8n (Docker local — une commande)

```powershell
docker run -d --name twiy-n8n -p 5678:5678 -v twiy_n8n_data:/home/node/.n8n n8nio/n8n
```

Puis ouvre http://localhost:5678 et crée le compte owner n8n.

Sans Docker : utilise [n8n Cloud](https://n8n.io/cloud/) ou une instance déjà installée — les étapes B–D restent identiques.

### B. Variables n8n (Settings → Variables)

| Variable | Valeur |
|----------|--------|
| `TWIY_API_URL` | `https://the-world-is-yours-production.up.railway.app/api` |
| `TWIY_WEBHOOK_KEY` | même valeur que `WEBHOOK_API_KEY` sur Railway |
| `OBSIDIAN_API_KEY` | Plugin Local REST API (si sync Obsidian) |
| `ANTHROPIC_API_KEY` | **ne pas inventer** — inutile pour `revue-dominicale.json` (passe par Railway `/ai/revue`) |

### C. Importer les 4 fichiers

Dans n8n : menu ☰ → **Import from File** → un par un :

1. `sync-obsidian-supabase.json`
2. `alerte-streak-soir.json`
3. `revue-dominicale.json`
4. `backup-hebdo.json`

### D. Tester puis activer

Pour chaque workflow :

1. Ouvre-le → **Execute Workflow** (manuel) → vérifier 200 / pas d’erreur auth
2. Toggle **Active** (haut à droite) seulement après un run OK

## Workflows fournis

| Fichier | Déclencheur | Rôle |
|---|---|---|
| `sync-obsidian-supabase.json` | Toutes les heures | Frontmatter vault (`02-Projets`) → table `quetes` |
| `alerte-streak-soir.json` | Chaque soir 21h | Streaks non alimentés → notifie |
| `revue-dominicale.json` | Dimanche 8h | `POST /ai/revue` (`x-api-key`) → écrit dans Obsidian |
| `backup-hebdo.json` | Lundi 4h | `GET /api/export` → vault |

**Phase 3 :** `revue-dominicale.json` appelle `POST {{$env.TWIY_API_URL}}/ai/revue` avec `x-api-key: {{$env.TWIY_WEBHOOK_KEY}}`. Voir `docs/phase-3.md`.

## Le nœud "Notifier" d'`alerte-streak-soir.json`

Câblé sur `/api/entree` (entrée `type_fait: alerte`). Pour une vraie notif : node **Telegram** ou **Send Email** (credentials dans n8n, sans toucher au serveur).

## Workflows à assembler toi-même

Même squelette **Cron → HTTP Request(s) → Code → HTTP Request** — copie `revue-dominicale.json` :

- **Rappels de routine** : Cron créneaux → `/api/quetes?type=routine`
- **Checklist sortie beatmaker** : Webhook Trigger sur note `statut: shippe` dans `04-Beatmaker`
- **Suivi Mvola** : Cron hebdo tant que `statut: en_attente`
- **Veille hebdo** : guide MCP Partie 5.2 (pas d’API TWIY requise)
