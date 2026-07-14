# Workflows n8n — THE WORLD IS YOURS

4 workflows prêts à importer (Menu n8n → Import from File) + patterns pour les 3 restants à assembler toi-même sur le même modèle.

## Variables n8n (prod TWIY)

| Variable | Exemple |
|----------|---------|
| `TWIY_API_URL` | `https://the-world-is-yours-production.up.railway.app/api` |
| `TWIY_WEBHOOK_KEY` | même valeur que `WEBHOOK_API_KEY` Railway |
| `OBSIDIAN_API_KEY` | Plugin Local REST API |
| `ANTHROPIC_API_KEY` | *(optionnel)* seulement si un workflow appelle Claude en direct — `revue-dominicale.json` n’en a plus besoin |

**Phase 3 :** `revue-dominicale.json` appelle `POST {{$env.TWIY_API_URL}}/ai/revue` avec `x-api-key: {{$env.TWIY_WEBHOOK_KEY}}` — rédaction + mémoire coaching côté Railway. Voir `docs/phase-3.md`.

## Import

1. Lance n8n (voir Partie 13 de ton guide MCP — Docker + `docker run ...`)
2. Pour chaque `.json` de ce dossier : menu (☰) → **Import from File**
3. Renseigne les credentials/variables d'environnement n8n (Settings → Variables) :
   - `TWIY_API_URL` — URL de ton serveur Railway déployé (ex. `https://twiy-api.up.railway.app/api`)
   - `TWIY_WEBHOOK_KEY` — même valeur que `WEBHOOK_API_KEY` côté serveur
   - `OBSIDIAN_API_KEY` — clé du plugin Local REST API (Partie 3.2 de ton guide)
   - `ANTHROPIC_API_KEY` — optionnel (revue passe par TWIY ; clé Anthropic sur Railway)
4. Active chaque workflow (toggle en haut à droite) une fois testé manuellement (bouton "Execute Workflow")

## Workflows fournis

| Fichier | Déclencheur | Rôle |
|---|---|---|
| `sync-obsidian-supabase.json` | Toutes les heures | Frontmatter du vault (`02-Projets`) → table `quetes` |
| `alerte-streak-soir.json` | Chaque soir 21h | Repère les streaks non alimentés aujourd'hui, notifie |
| `revue-dominicale.json` | Dimanche 8h | `POST /ai/revue` (x-api-key) → écrit la revue dans Obsidian |
| `backup-hebdo.json` | Lundi 4h | Exporte toutes les tables Supabase (`/api/export`) vers le vault |

## Le nœud "Notifier" d'`alerte-streak-soir.json`

Actuellement câblé sur `/api/entree` (crée juste une entrée `type_fait: alerte`, visible dans le dashboard). Si tu veux une vraie notification qui te sort de ta journée (pas juste un enregistrement discret), remplace ce nœud par : un node **Telegram** (bot perso, gratuit) ou un node **Send Email**. Les credentials se configurent directement dans n8n, pas besoin de toucher au code du serveur.

## Workflows à assembler toi-même (même schéma que ci-dessus)

Tous suivent le même squelette **Cron → HTTP Request(s) → Code (agrégation) → HTTP Request (écriture)** — copie `revue-dominicale.json` comme point de départ et adapte :

- **Rappels de routine** : Cron sur chaque créneau de ta table Routine (Aube, Miprod, Dev, Étude, Odin Project, Miprod soir) → notifie le bloc du moment, tiré de `/api/quetes?type=routine`
- **Checklist de sortie beatmaker** : au lieu d'un Cron, utilise un **Webhook Trigger** appelé quand une note passe `statut: shippe` dans `04-Beatmaker` (le plugin Local REST API peut notifier un webhook externe sur modification de fichier) → génère le post de lancement via Claude, écrit dans la note
- **Suivi démarches Mvola** : Cron hebdo → vérifie le statut dans la note client Tsena correspondante → rappel tant que `statut: en_attente`
- **Veille hebdo** : déjà fonctionnel tel quel depuis ton guide MCP original (Partie 5.2) — reprend le prompt de veille, écrit dans `Dashboard-Veille`, n'a pas besoin d'intégration TWIY supplémentaire (c'est une entrée dans le pipeline brainstorm, pas une donnée de suivi)
