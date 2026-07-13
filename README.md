# THE WORLD IS YOURS

Système unifié de suivi dev + beatmaker + freelance. Remplace Life OS, la roadmap PDF, roadmap-beatmaker.html, l'app Notes et le portfolio P0.

Voir `Systeme-Chroniques-Spec.md` (fourni séparément) pour la spec complète : mécanisme, palette, sitemap, modèle de données.

## Stack
- **Frontend** : React (Vite) + Redux + CSS sur-mesure + Wavesurfer.js
- **Backend** : Node/Express
- **Base** : Supabase (Postgres + Auth + Storage)
- **Hébergement** : Vercel (client) + Railway (server)
- **Automatisation** : n8n (sync Obsidian, webhooks, revue dominicale, alerte streak)

## Démarrage

### 1. Supabase
1. Créer un projet sur supabase.com (gratuit)
2. Exécuter `supabase/schema.sql` dans l'éditeur SQL Supabase
3. Créer 3 buckets Storage : `instrumentaux`, `projets`, `captures` (lecture publique pour `instrumentaux` et `captures`)
4. Récupérer l'URL du projet et les clés (anon + service_role) → Settings > API

### 2. Serveur
```
cd server
cp .env.example .env   # renseigner SUPABASE_URL, SUPABASE_SERVICE_KEY, PORT, WEBHOOK_API_KEY
npm install
npm run dev
```

### 3. Client
```
cd client
cp .env.example .env   # renseigner VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm install
npm run dev
```

### 4. Déploiement
- Client → Vercel (import du dossier `client`, variables d'env identiques au `.env`)
- Server → Railway (import du dossier `server`, variables d'env identiques au `.env`)

## Prochaines étapes après ce scaffold
- Créer un utilisateur Auth Supabase (email/password) puis `/login`
- Brancher GitHub Actions : voir `docs/github-webhook.md` (secret déjà dans `server/.env`)
- Importer les workflows n8n (`n8n/`)
- Renseigner `ANTHROPIC_API_KEY` pour revue / titres de chapitres
- Déployer : Vercel (client) + Railway (server)

Voir `PROGRESS.md` pour l'état d'avancement.
