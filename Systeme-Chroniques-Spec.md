---
type: spec
statut: v4 — FINALE, nom retenu, prête pour scaffold
date: 2026-07-12
nom: THE WORLD IS YOURS
---

# THE WORLD IS YOURS — spec finale avant scaffold

Nom retenu : **THE WORLD IS YOURS** — écho direct du poster de ton moodboard, devient à la fois le nom du site et sa signature. Journal interne : **Chroniques**. Les routes techniques (`/chantier`, etc.) restent des slugs internes, indépendants du nom de marque.

Ce système remplace intégralement : Life OS, le PDF Learn By Doing, roadmap-beatmaker.html, l'app Notes, **et le projet P0 "Portfolio"** de ta roadmap. C'est désormais ta vitrine unique — dev et musique, même adresse, même identité.

## 1. Mécanisme central : Chantier + Chroniques fusionnés

Pas d'XP, pas de niveaux. Chaque quête finie = une brique posée sur un plan qui se remplit visuellement (Chantier), et pose automatiquement une entrée narrative datée (Chronique). Le plan qui se remplit EST le chapitre — visualisé plutôt que seulement raconté.

- **Entrée** : fait réel et vérifiable, daté (commit, certif, session de prod, séance de sport, proposal envoyé)
- **Chapitre** : une semaine, titre rédigé a posteriori par Claude à partir des entrées réelles
- **Trois arcs** : Dev, Beatmaker, Croisement (outils construits pour ta propre prod)
- **Streaks** : aversion à la perte pure — jours consécutifs par piste (Dev, Miprod, Sport). Un streak cassé marque le chapitre "rompu", pas de perte de points
- **Drop** : reveal cinématique plein écran à chaque palier franchi (module fini, certif obtenue, MVP live, nouvelle instru catalogée) — brouillon de post prêt à partager toi-même, jamais auto-publié
- **Quêtes/objectifs** : toujours présents, rattachés à un chapitre et un arc plutôt qu'à un score

## 2. Identité visuelle v2 — moodboard validé, remplace la direction AWGE orange initiale

Suite à l'envoi du moodboard (15 références), la direction bascule sur les 4 points suivants. Poids identique partout maintenu (aucune version allégée du dashboard).

- **Palette** : bleu profond/électrique comme base dominante (proche `#0a1128` → `#0d1b3e` → bleu nuit en couches, à affiner en scaffold), texte blanc cassé. Rouge (`#ff3b30` environ) et jaune (`#ffd23f` environ) réservés à la ponctuation : alertes, annotations manuscrites, accents de Drop — jamais en fond. L'orange de la roadmap beatmaker existante est abandonné comme base, peut rester en clin d'œil ponctuel sur l'arc Beatmaker seul si besoin.
- **Typo** : Syne (display bold) pour titres de chapitre et Drops, DM Mono pour toute donnée vérifiable, DM Sans pour le corps de texte — inchangé.
- **Texture** : halftone (trame de points façon affiche sérigraphiée) remplace complètement le grain numérique prévu avant — appliqué partout, dashboard compris.
- **Annotations manuscrites — langage d'interface fonctionnel.** Les retards de roadmap, les corrections, les ruptures de streak s'affichent littéralement comme des gribouillis/traits à la main en rouge sur l'écran (référence directe : la photo annotée façon correction). Ce n'est pas de la décoration, c'est le système d'alerte du site.
- **Collage/double exposition — appliqué à tous les Drops.** Chaque palier franchi (dev, beatmaker, ou croisement) génère un visuel collage unique — photos/éléments découpés et superposés, pas seulement réservé à l'arc Croisement.
- **Motif signature double** : la forme d'onde (son + donnée, reprise du choix précédent) et la main qui tient le globe (repérée deux fois dans le moodboard, ex. "The World Is Yours") comme second motif récurrent — candidat naturel pour un mark/logo du site.
- **Son** : tick discret sur une quête cochée, impact plus lourd sur un Drop. Toggle mute visible et accessible partout.
- **Blueprint** : grille technique fine, cotations sur les vues Arc, conservé mais dans la nouvelle palette bleue plutôt que sur fond quasi-noir neutre.

## 3. Catalogue — la nouvelle pièce centrale

### Instrumentaux
Catalogue public écoutable. Lecteur intégré avec waveform (cohérent avec le motif signature), pas de vente directe intégrée pour l'instant — showcase pur, preuve de travail.

```sql
create table instrumentaux (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  bpm int,
  tonalite text,
  genre text,
  tags text[],
  statut text default 'showcase',   -- showcase | prive
  fichier_url text not null,        -- Supabase Storage, bucket 'instrumentaux'
  waveform_data jsonb,              -- peaks pré-calculés, évite de recalculer au chargement
  cree_le timestamptz default now()
);
```

### Projets dev
Mix liens+preuve visuelle et fichiers complets selon le projet — un plugin ou un asset se télécharge, un produit web se montre en lien + capture.

```sql
create table projets_dev (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  lien_github text,
  lien_live text,
  capture_url text,        -- GIF/screenshot, bucket 'captures'
  fichier_url text,        -- optionnel, bucket 'projets'
  stack text[],
  statut text default 'shippe',
  cree_le timestamptz default now()
);
```

Buckets Supabase Storage : `instrumentaux` (lecture publique si statut showcase), `projets` (fichiers optionnels), `captures` (images/GIFs).

## 4. Modèle de données — cœur du système

```sql
create table arcs (
  id text primary key,               -- 'dev' | 'beatmaker' | 'croisement'
  nom text not null
);

create table chapitres (
  id uuid primary key default gen_random_uuid(),
  arc_id text references arcs(id),
  semaine text not null,
  titre text,
  date_debut date not null,
  date_fin date,
  statut text default 'en_cours',    -- en_cours | complet | rompu
  resume_public text
);

create table quetes (
  id uuid primary key default gen_random_uuid(),
  chapitre_id uuid references chapitres(id),
  type text not null,                -- dev | beatmaker | freelance | routine
  titre text not null,
  statut text default 'a_faire',
  lien_note_obsidian text,
  date_prevue date,
  date_faite date
);

create table entrees (
  id uuid primary key default gen_random_uuid(),
  quete_id uuid references quetes(id),
  arc_id text references arcs(id),
  type_fait text not null,           -- commit | certif | session_prod | sport | proposal | instru | projet
  detail text,
  source text,                       -- github | manuel | n8n
  cree_le timestamptz default now()
);

create table streaks (
  id text primary key,               -- 'dev' | 'miprod' | 'sport'
  jours_consecutifs int default 0,
  dernier_jour date,
  record int default 0
);
```

## 5. Sitemap final

- `/` — home publique, non connectée : split visuel haut de page **CODE / SOUND**, même identité de marque, deux chemins clairs pour ne perdre ni un client freelance ni un auditeur
- `/chantier` — dashboard privé, 3 arcs côte à côte
- `/chantier/dev`, `/chantier/beatmaker`, `/chantier/croisement` — vues blueprint détaillées
- `/catalogue/instrus` — catalogue écoutable, upload
- `/catalogue/projets` — portfolio dev, upload
- `/drops` — archive des reveals passés
- `/drops/:id` — page individuelle partageable
- `/streaks` — heatmap par piste
- `/insights` — vue Corrélations entre arcs, générée périodiquement par Claude
- `/analytics` — courbes et KPIs dans le temps (privé, dense)
- `/freelance` — pipeline kanban prospect → proposal → client → payé
- `/revue` — bilan dominical auto-généré, éditable
- `/parametres` — connexions Obsidian / GitHub / n8n, gestion des buckets, export/portabilité des données

## 6. Ce qui reste hors périmètre (rappel)

Automatisation de publication sociale, prospection LinkedIn automatisée, décisions artistiques déléguées à l'IA — inchangé depuis la première version.

## 7. Décisions UI/UX, front-end et back-end

**UI/UX** : densité dense/pro assumée (beaucoup de données visibles à l'écran, façon dashboard terminal) combinée à une navigation plein écran immersive — chaque vue est dense en elle-même, et on passe d'une vue dense à une autre par transition cinématique, plutôt que d'étaler la densité sur une seule page scrollable. Icônes et marques 100% custom illustrées, mélangeant les deux mondes (ex. grue + forme d'onde) — aucune icône générique dans le système.

**Front-end** : CSS sur-mesure complet (pas de Tailwind) pour garder le contrôle total sur les layouts asymétriques et les transitions cinématiques. Wavesurfer.js pour l'affichage des waveforms d'instrus. Redux pour la gestion d'état globale, cohérent avec ce qu'apprend la roadmap sur P2/Tsena — la compétence sert deux fois.

**Back-end** : hébergement séparé Vercel (front) + Railway (API Node), cohérent avec les outils déjà prévus pour P1/Tsena. Supabase Auth activé dès le scaffold initial (email/mot de passe). Calcul de la waveform à l'upload fait côté navigateur — pas de dépendance ffmpeg côté serveur.

## 7bis. UI/UX détaillé par écran — état actuel consolidé

Principe transversal : chaque écran est dense en lui-même (données visibles d'un coup, pas de scroll interminable), la navigation entre écrans est plein écran et cinématique (transition marquée, pas un simple fondu). Aucune version allégée nulle part — halftone, palette bleue et annotations manuscrites s'appliquent identiquement au privé et au public.

- **`/` (home publique)** : split visuel haut de page CODE / SOUND, même identité de marque, un des deux motifs signature (main-globe probable ici en hero) en grand format halftone.
- **`/chantier` (dashboard privé)** : 3 colonnes symétriques Dev / Beatmaker / Croisement. Par colonne : streak en gros chiffre mono, barre de progression en pointillés blueprint, 3 prochaines quêtes, un CTA. Bandeau du dessus : blocs de routine du jour en frise horizontale (Aube→Miprod→Dev→Étude→Odin→Miprod), bloc courant surligné. Tout retard ou blocage s'affiche en annotation manuscrite rouge directement sur la carte concernée, pas dans un panneau séparé.
- **`/chantier/dev`, `/chantier/beatmaker`, `/chantier/croisement`** : vue blueprint — grille technique fine en fond (bleu), roadmap S1→S15 dessinée comme une séquence de construction étage par étage, quêtes en lignes façon plan côté avec cases à cocher.
- **`/catalogue/instrus`** : grille de morceaux, lecteur intégré avec waveform (motif signature), waveform calculée côté navigateur à l'upload. Filtres par tag/BPM/statut.
- **`/catalogue/projets`** : cartes projet avec capture/GIF, lien GitHub/live, ou fichier téléchargeable selon le cas (mix décidé en amont).
- **`/drops`** : archive des reveals passés en grille ; chaque entrée ouvre `/drops/:id`.
- **`/drops/:id`** : plein écran, halftone marqué, typo XXL, visuel collage/double-exposition généré pour ce palier précis (systématique, pas réservé au Croisement), extrait audio intégré si le Drop est côté beatmaker, un seul CTA (partager).
- **`/streaks`** : heatmap façon contributions GitHub, réhabillée dans la palette bleue, dense et lisible.
- **`/revue`** : la seule vue volontairement moins "spectacle" — plus proche d'un document à lire/éditer, cohérent avec son rôle réflexif plutôt que vitrine.
- **`/parametres`** : état des connexions (Obsidian, GitHub, n8n), gestion des buckets Supabase Storage.

**Ce qui reste ouvert, à préciser si tu veux tout verrouiller avant scaffold** : le geste exact pour valider une quête (tap simple / glisser / maintenir), le comportement responsive précis sur mobile (la home CODE/SOUND et les Drops plein écran se comportent comment sur petit écran), et l'emplacement définitif du motif main-globe (logo seul, hero uniquement, ou récurrent comme la waveform).

## 7ter. Améliorations retenues (fonctionnel + UX)

- **Capture rapide** : bouton "+" flottant persistant sur toutes les vues privées ; le check-in Claude du soir peut aussi transformer une réponse libre ("t'as fait quoi aujourd'hui") en entrées structurées, sans passage par un formulaire. Point de friction le plus critique du système — sans ça, le risque d'abandon est réel.
- **Vue Corrélations** (section dédiée du dashboard, pas un Drop) : générée périodiquement par Claude, croise les entrées entre arcs (ex. "semaines de forte prod = semaines de commits plus faibles") — rend visible ce que tu ne verrais pas à l'œil nu, sert directement l'objectif de fond (rigueur du code ↔ intuition musicale).
- **Chapitre de reprise** : `statut` d'un chapitre peut passer de `rompu` à `reprise` dès qu'un nouveau streak redémarre sur la même piste, avec son propre traitement visuel — pas seulement une cicatrice permanente qui décourage.
- **Pipeline freelance dédié** (`/freelance`) : kanban léger prospect → proposal → client → payé, distinct de l'arc Dev où il était noyé jusqu'ici.
- **Recherche universelle** : palette de commande (Cmd/Ctrl+K), indexe chapitres, quêtes, projets, instrus, Drops.
- **Chapitre 0** : contenu d'amorçage écrit à partir de l'historique réel (Big Fis depuis 2023, parcours dev, POC ministère de l'agriculture) plutôt qu'un dashboard vide au premier lancement.

```sql
-- Ajout : pipeline freelance dédié
create table prospects (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  statut text default 'prospect',   -- prospect | proposal_envoye | client | paye | perdu
  lien_note_obsidian text,
  montant numeric,
  date_maj timestamptz default now()
);

-- chapitres.statut accepte désormais : en_cours | complet | rompu | reprise
```

## 7quater. Robustesse et pérennité technique

- **Portabilité des données** : export complet en un clic (JSON + Markdown réinjectable dans Obsidian) — condition non négociable pour ne jamais recréer le lock-in que ce projet doit résoudre.
- **Sauvegarde automatique** : job n8n hebdomadaire qui exporte la base vers un stockage externe (Obsidian ou bucket séparé) — le tier gratuit Supabase n'a pas de backup automatique ni de garantie de disponibilité continue.
- **Endpoint webhook générique** `/api/entree` (clé API, source libre) plutôt qu'une intégration codée en dur par outil externe — sert directement l'objectif "automatiser tout ce qui est automatisable" sans sur-ingénierie anticipée.
- **Mémoire persistante du coaching** : un fichier de contexte vivant (repris de l'esprit `Lecons-Apprises` du guide MCP d'origine) relu par Claude à chaque check-in proactif, pour que les conseils s'affinent avec le temps au lieu de repartir de zéro à chaque session.
- **Types partagés front/back** générés automatiquement depuis le schéma Supabase — évite toute divergence silencieuse entre l'API et l'interface.
- **Le backend Node est seul autorisé à parler à Claude et à calculer streaks/chapitres** — jamais le frontend, pour éviter une logique dupliquée ou incohérente entre appareils.
- **Traitement asynchrone** pour tout appel à l'IA (titre de chapitre, revue dominicale, corrélations) — statut "en génération" affiché plutôt qu'une interface bloquée.
- **Environnement de test** : un second projet Supabase gratuit dédié aux tests, pour ne jamais risquer les données réelles en développant une nouvelle fonctionnalité.
- **Observabilité minimale** (Sentry gratuit ou logs Railway) pour détecter une sync cassée en silence — un webhook GitHub qui échoue sans alerte romprait un streak Dev de façon injustifiée.

## 7quinquies. Analytics, saisons, alerte préventive, historique

- **`/analytics` (privé, dense)** : courbes dans le temps — vélocité de commits, revenu réel vs grille tarifaire (junior→signature), taux de complétion S1-S15 (prévu vs réel), répartition du temps par arc, taux de conversion du pipeline freelance, croissance du catalogue. La lecture froide qui complète le récit chaud des Chroniques.
- **Stats publiques sur la vitrine** : 3-4 chiffres seulement (commits du mois, semaines de streak Dev, instrus publiées, projets shippés) — renforce le pilier preuve publique avec du dur, pas seulement du narratif.
- **Saisons plutôt qu'un arrêt à S15** : la structure ne doit pas dépendre uniquement de la roadmap actuelle. Chapitres numérotés par saison continue (Saison 1 = les 15 premières semaines, Saison 2 démarre ensuite) — survit à n'importe quelle future roadmap sans refonte.
- **Alerte préventive de rupture de streak** : signal en fin de journée ("il te reste 3h, pas encore d'entrée Dev aujourd'hui") plutôt qu'un simple constat le lendemain — le système protège activement les séries au lieu de seulement les observer.
- **Historique des quêtes modifiées** : toute modification de scope garde une trace — les Chroniques racontent ce qui s'est vraiment passé, pas une version réécrite après coup.

```sql
-- Saisons continues
create table saisons (
  id uuid primary key default gen_random_uuid(),
  nom text not null,               -- 'Saison 1', 'Saison 2'...
  date_debut date not null,
  date_fin date
);

alter table chapitres add column saison_id uuid references saisons(id);

-- Historique des quêtes modifiées
create table quetes_historique (
  id uuid primary key default gen_random_uuid(),
  quete_id uuid references quetes(id),
  champ_modifie text not null,
  ancienne_valeur text,
  nouvelle_valeur text,
  modifie_le timestamptz default now()
);
```

Alerte préventive : nouveau workflow n8n (cron fin de journée, ex. 21h) qui vérifie la table `streaks` — si `dernier_jour` ≠ aujourd'hui et aucune entrée du jour sur la piste concernée, déclenche une notification via le canal proactif déjà retenu (tâche planifiée Cowork).

## 8. Les 4 derniers points — tranchés

- **Nom** : THE WORLD IS YOURS (voir en-tête)
- **Geste de validation d'une quête** : tap simple — cohérent avec l'objectif de capture à faible friction
- **Responsive mobile des vues plein écran** : empilement vertical en une colonne, même poids visuel (halftone, grain, typo, transitions) — aucune version allégée, cohérent avec la règle posée plus tôt
- **Motif main-globe** : logo + hero — devient la marque du site (header/favicon) et apparaît en grand sur les pages d'entrée (home, Drops), sans être dilué partout comme la forme d'onde

## 8bis. Références vidéo ajoutées au moodboard

Trois captures d'écran de sites/apps envoyées, analysées image par image (frames extraites). Contrairement au moodboard précédent (atmosphère, couleur, texture), celles-ci apportent des **patterns d'interaction concrets** :

- **Portfolio motion & sound designer (fond noir, logo dégradé vert/bleu)** : entrée conditionnée au son ("enter with sound") — reprend et concrétise notre décision son déjà actée, avec un point d'application précis : gate d'entrée au premier chargement de THE WORLD IS YOURS. Deux vues basculables "spiral" / "list" pour l'archive de projets : la vue spiral disperse les cartes projet en 3D à différentes profondeurs et rotations dans un espace noir plutôt qu'une grille plate. **Directement applicable à `/drops`** : vue par défaut en galerie 3D éparpillée, bascule possible vers une liste classique.
- **App musicale ("MANGO JUMP")** : liste de morceaux avec cover art, aperçu en mockup téléphone, palette teal/mint contrastée à un panneau sombre secondaire. Référence directe pour `/catalogue/instrus` — grille de cover art + liste de titres, pas juste des waveforms nues.
- **Site e-commerce éditorial (BECANE)** : le plus riche des trois. Typographie condensée bold en noir sur fond clair, mais surtout une **densité de labels numériques omniprésente** — `COLLECTION 01/01`, `LOOK 02/11`, `290°/360°`, `PRODUCTS 14` — qui donne un vocabulaire concret à notre choix "dense/pro" déjà figé. Pages "Story" en plein écran avec un bloc générique façon film (photographe, styliste, production, MUA...) superposé à l'image, et produits tagués en bas de l'image. Viewer de rotation 290°/360° comme pattern d'interaction à fort potentiel.

**Ajustements retenus pour la spec :**
- `/drops` : vue par défaut en galerie 3D dispersée (cartes à profondeurs/rotations variées, fond sombre) plutôt qu'une grille — bascule "spiral / liste" disponible
- Gate d'entrée sonore au premier chargement du site, cohérent avec le toggle mute déjà prévu
- Compteurs numériques façon spec-sheet généralisés à tout le système (ex. `SEMAINE 04/15`, `STREAK 12J`, `CHAPITRE 03`) — renforce concrètement la densité déjà choisie
- `/catalogue/instrus` : grille cover art + liste, pas seulement des lecteurs waveform isolés
- Chaque `/drops/:id` peut porter un bloc "crédits" façon générique (toi + outils/stack utilisés, ou featuring/mix/master pour un morceau) — ajoute une texture éditoriale cohérente avec le reste

## 9. Prêt pour scaffold

Plus aucun point ouvert. Mécanisme, palette, sitemap, modèle de données, catalogue, stack front/back, hébergement, robustesse, et identité de marque sont tous figés dans ce document.

---

## Addendum — état shippé & ordre de travail (2026-07-16)

Cet addendum **ne remplace pas** la spec ci-dessus ; il ancre le réel post-scaffold et corrige les claims d’audit devenus faux.

### DONE (sur `main`)

- Phases 0–3 fondations + 5 modules (Apprentissages, Ère, Compétences, Rayonnement, Contremaître)
- Audit runtime `fec7fa2` : Chantier session-gated, Paramètres probes réels (OK/—), redirects catalogue, Insights soft-off sans IA, Drops spiral, demo freelance retirée, dispersion **seulement** avec Ère active
- Compétences `66402fe` : UI interactive, preuves, prérequis roadmap + migration
- LIVE vérifié : Paramètres probes ; Chantier loading → 13/13 ; Contremaître OK
- **Ravitaillement** Dev/Beatmaker : auto-fill à 3 actifs (`docs/ravitaillement.md`) ; Croisement skipped
- Dispersion soft : pas de banner si ère pas encore branchée aux quêtes (`ere_objectif_id`)

### OPEN

- Actions owner : signup Auth, clé Anthropic, clearance assets — voir `docs/audit-followups.md`
- Ravitaillement **Croisement** (après seed arbre)

### NEXT

- Cartographie audit → statut : `docs/audit-reconcile-2026-07.md`
- Avancement vivant : `PROGRESS.md`

### Note d’honnêteté

Les formulations anciennes du type « Paramètres entièrement fake », « compétences sans preuves », « tout le OS est encore statique » ne doivent plus être reprises telles quelles : les correctifs ci-dessus sont shippés. Relire `docs/audit-reconcile-2026-07.md` avant de prioriser un correctif.
