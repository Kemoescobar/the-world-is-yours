# Workflows n8n — THE WORLD IS YOURS

4 workflows prêts à importer + patterns pour les 3 restants à assembler toi-même sur le même modèle.

## Lancer n8n (local, port 5678)

### Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows)
- Copie `n8n/.env.example` → `n8n/.env` et renseigne les secrets

### Démarrage

```powershell
cd C:\twiy\n8n
Copy-Item .env.example .env   # si .env n'existe pas encore
# Éditer .env : TWIY_WEBHOOK_KEY = WEBHOOK_API_KEY de server/.env
docker compose up -d
```

UI : **http://localhost:5678**

Arrêt : `docker compose down` (les données persistent dans le volume `n8n_data`).

### Alternative sans Docker

```powershell
cd C:\twiy\n8n
# Charger les vars depuis .env puis :
npx n8n
```

## Variables n8n (prod TWIY)

| Variable | Exemple |
|----------|---------|
| `TWIY_API_URL` | `https://the-world-is-yours-production.up.railway.app/api` |
| `TWIY_WEBHOOK_KEY` | même valeur que `WEBHOOK_API_KEY` Railway / `server/.env` |
| `OBSIDIAN_API_KEY` | Plugin Local REST API |
| `ANTHROPIC_API_KEY` | *(optionnel)* seulement si un workflow appelle Claude en direct — `revue-dominicale.json` n’en a plus besoin |

Ces variables sont injectées via `n8n/.env` + `docker-compose.yml` et accessibles dans les expressions `{{$env.TWIY_API_URL}}`, etc.

**Phase 3 :** `revue-dominicale.json` appelle `POST {{$env.TWIY_API_URL}}/ai/revue` avec `x-api-key: {{$env.TWIY_WEBHOOK_KEY}}` — rédaction + mémoire coaching côté Railway. Voir `docs/phase-3.md`.

## Import des workflows

### Via UI
1. Ouvre http://localhost:5678 — crée le compte owner au premier lancement
2. Pour chaque `.json` de ce dossier : menu (☰) → **Import from File**
3. Active chaque workflow (toggle en haut à droite) **après** un test manuel (bouton **Execute Workflow**)

### Via CLI (conteneur déjà up)

```powershell
cd C:\twiy\n8n
docker compose exec n8n n8n import:workflow --input=/workflows/sync-obsidian-supabase.json
docker compose exec n8n n8n import:workflow --input=/workflows/alerte-streak-soir.json
docker compose exec n8n n8n import:workflow --input=/workflows/revue-dominicale.json
docker compose exec n8n n8n import:workflow --input=/workflows/message-matin.json
docker compose exec n8n n8n import:workflow --input=/workflows/backup-hebdo.json
```

Les workflows importés restent **inactifs** par défaut. Activation CLI après import :

```powershell
docker compose exec n8n n8n list:workflow
docker compose exec n8n n8n publish:workflow --id=twiy-alerte-streak-soir
# ids : twiy-sync-obsidian-supabase | twiy-alerte-streak-soir | twiy-revue-dominicale | twiy-message-matin | twiy-backup-hebdo
```

Sinon : UI → ouvrir chaque workflow → toggle **Active**.

**Execute once** : préfère le bouton **Execute Workflow** dans l’UI (`http://localhost:5678`).  
`n8n execute --id=…` depuis `docker compose exec` échoue si l’instance n8n tourne déjà (port Task Broker 5679 déjà pris).

### Sync Obsidian — caveats

Le workflow `sync-obsidian-supabase.json` (2026-07-20) :
1. `GET` liste `02-Projets/` via `host.docker.internal:27123` + `Authorization: Bearer`
2. Parse frontmatter de chaque `.md` (recurse **1 niveau** de sous-dossiers)
3. Upsert `POST`/`PATCH /api/quetes` avec `x-api-key` (match sur `lien_note_obsidian`)

Requis : Obsidian ouvert + Local REST API ON + `OBSIDIAN_API_KEY` / `TWIY_WEBHOOK_KEY` dans `n8n/.env`.

## Activation (checklist)

1. Railway : `ANTHROPIC_API_KEY` sur le service `server` → Redeploy (requis pour `/ai/revue`)
2. n8n `.env` : `TWIY_API_URL` + `TWIY_WEBHOOK_KEY` (= `WEBHOOK_API_KEY`)
3. Obsidian : plugin **Local REST API** démarré + `OBSIDIAN_API_KEY` dans `.env` — guide : [`docs/obsidian-rest.md`](../docs/obsidian-rest.md)
4. Importer les 4 JSON → **Execute Workflow** une fois chacun → activer le toggle
5. Paramètres TWIY → statut Claude OK (optionnel, pour la UI)

## Caveats importants

### Docker → Obsidian
Les JSON du repo pointent déjà vers `http://host.docker.internal:27123/...` (pas `127.0.0.1` — depuis le conteneur, localhost = le conteneur). `extra_hosts` est dans `docker-compose.yml`.

Si tu réimporte depuis une vieille copie avec `127.0.0.1`, remplace par `host.docker.internal`.

Setup détaillé (clics Obsidian, vault Midas, tests curl) : [`docs/obsidian-rest.md`](../docs/obsidian-rest.md).

### Anthropic
La revue dominicale **n’a pas besoin** de `ANTHROPIC_API_KEY` dans n8n — la clé vit sur Railway. Sans clé Anthropic côté Railway, `POST /ai/revue` échouera.

### Notifications streak
Le nœud « Notifier » d’`alerte-streak-soir.json` crée une entrée via `/api/entree` (dashboard). Pour une vraie alerte : remplace par Telegram ou Email dans n8n.

## Workflows fournis

| Fichier | Déclencheur | Rôle |
|---|---|---|
| `sync-obsidian-supabase.json` | Toutes les heures | Liste `02-Projets` (+ 1 niveau sous-dossiers) → parse frontmatter → upsert `quetes` (`POST` ou `PATCH` via `lien_note_obsidian`) |
| `alerte-streak-soir.json` | Chaque soir 21h | Repère les streaks non alimentés aujourd'hui, notifie |
| `revue-dominicale.json` | Dimanche 8h | `POST /ai/revue` (x-api-key) → écrit la revue dans Obsidian |
| `message-matin.json` | Chaque jour 6h | `POST /ai/message-matin` + streaks/quêtes/EDT → `00-Veille/Check-in-matin-YYYY-MM-DD.md` |
| `backup-hebdo.json` | Lundi 4h | Exporte toutes les tables Supabase (`/api/export`) vers le vault |

### Check-in matin → Claude Pro

Le cron 6h (TZ `Indian/Antananarivo`) agrège Contremaître + streaks + quêtes actives Dev/Beatmaker + emploi du temps, puis **PUT** la note datée dans le vault.

**Claude Pro lit cette note** : ouvre `00-Veille/Check-in-matin-YYYY-MM-DD.md` (ou colle son contenu) dans le chat pour le briefing du jour — streaks, quêtes, note Contremaître, question « LA chose ce soir ».

## Workflows à assembler toi-même (même schéma)

Tous suivent le même squelette **Cron → HTTP Request(s) → Code (agrégation) → HTTP Request (écriture)** — copie `revue-dominicale.json` comme point de départ et adapte :

- **Rappels de routine** : Cron sur chaque créneau de ta table Routine → notifie le bloc du moment (`/api/quetes?type=routine`)
- **Checklist de sortie beatmaker** : **Webhook Trigger** quand une note passe `statut: shippe` dans `04-Beatmaker`
- **Suivi démarches Mvola** : Cron hebdo → rappel tant que `statut: en_attente`
- **Veille hebdo** : guide MCP Partie 5.2 — pas d’intégration TWIY supplémentaire
