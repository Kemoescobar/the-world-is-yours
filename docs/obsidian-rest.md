# Obsidian Local REST API — setup TWIY (Windows)

n8n lit et écrit le vault via le plugin community **Local REST API**.  
Sans Obsidian ouvert + plugin actif, les workflows vault échouent.

## Vault TWIY

| | |
|--|--|
| **Chemin** | `C:\Users\HP Ryzen 7\OneDrive\Documents\Midas` |
| **Dossiers utilisés** | `02-Projets/` (sync), `00-Veille/` (revue), `00-Veille/Backups/` (backup hebdo) |
| **Port HTTP (insecure)** | `27123` (celui des workflows n8n) |
| **Port HTTPS** | `27124` (optionnel ; n8n utilise HTTP) |

## Clics exacts dans Obsidian

### 1. Ouvrir le bon vault
1. Lance **Obsidian**
2. Ouvre le vault **Midas** (pas « Obsidian Vault »)
3. Laisse Obsidian **ouvert** tant que n8n doit sync/backup

### 2. Installer / activer Local REST API
Si le plugin n’est pas encore là :

1. **Settings** (engrenage en bas à gauche)
2. **Community plugins** → si demandé : **Turn on community plugins**
3. **Browse** → cherche `Local REST API` (auteur : Adam Coddington)
4. **Install** → **Enable**

Si déjà installé (cas Midas) : Community plugins → liste → bascule **Local REST API** = ON.

### 3. Récupérer la clé API
1. **Settings** → **Community plugins** → **Local REST API** (ou section « Local REST API » dans Settings)
2. Vérifie :
   - **Enable Non-encrypted (HTTP) Server** = ON  
   - **Non-encrypted Server Port** = `27123`
3. Copie l’**API Key** affichée (longue chaîne hex)

### 4. Mettre la clé dans n8n
Dans `C:\twiy\n8n\.env` (gitignored) :

```
OBSIDIAN_API_KEY=colle-la-cle-ici
```

Puis redémarre n8n pour injecter la var :

```powershell
cd C:\twiy\n8n
docker compose up -d --force-recreate
```

`docker-compose.yml` passe déjà `OBSIDIAN_API_KEY` au conteneur.

## Ce que les workflows appellent

| Workflow | Méthode | URL (depuis Docker) | Header |
|----------|---------|---------------------|--------|
| `sync-obsidian-supabase.json` | GET | `http://host.docker.internal:27123/vault/02-Projets/` | `Authorization: Bearer {{$env.OBSIDIAN_API_KEY}}` |
| `revue-dominicale.json` | PUT | `http://host.docker.internal:27123/vault/00-Veille/Revue-Dominicale.md` | Bearer + `Content-Type: text/markdown` |
| `backup-hebdo.json` | PUT | `http://host.docker.internal:27123/vault/00-Veille/Backups/twiy-YYYY-MM-DD.json` | Bearer |

`alerte-streak-soir.json` n’utilise **pas** Obsidian (API TWIY seulement).

## Tests

### Depuis Windows (host)

```powershell
# Remplace KEY par ta OBSIDIAN_API_KEY
curl.exe -s -H "Authorization: Bearer KEY" http://127.0.0.1:27123/
curl.exe -s -H "Authorization: Bearer KEY" http://127.0.0.1:27123/vault/02-Projets/
```

Réponse attendue : JSON (status OK / liste de fichiers). Si connexion refusée → Obsidian fermé ou plugin OFF.

### Depuis le conteneur n8n

```powershell
cd C:\twiy\n8n
docker compose exec n8n node -e "fetch('http://host.docker.internal:27123/',{headers:{Authorization:'Bearer '+process.env.OBSIDIAN_API_KEY}}).then(async r=>{console.log(r.status, (await r.text()).slice(0,200))})"
```

`extra_hosts: host.docker.internal:host-gateway` est déjà dans `docker-compose.yml`.

## Caveats

1. **Obsidian doit rester ouvert** (plugin = serveur local dans le process Obsidian).
2. Depuis Docker, utilise **`host.docker.internal:27123`**, jamais `127.0.0.1` (localhost = le conteneur).
3. Préférer le serveur **HTTP insecure :27123** pour n8n (évite le certificat auto-signé HTTPS :27124).
4. Ne **jamais** committer `n8n/.env` ni coller la clé dans un JSON de workflow.
5. Firewall Windows : si curl host OK mais Docker KO, autorise Obsidian / port 27123 pour Docker.

Voir aussi : [`n8n/README.md`](../n8n/README.md), [`docs/phase-3.md`](./phase-3.md).
