---
type: audit
date: 2026-07-12
statut: relecture avant scaffold
---

# Audit complet — de l'analyse des fichiers au système prêt à coder

## Phase 1 — Compréhension du point de départ

Lecture de tes fichiers (CVs, guide Obsidian+Claude+Cursor, roadmap Learn By Doing 15 semaines, roadmap-beatmaker.html, captures Notes) et diagnostic : ta progression vivait éparpillée sur 5 systèmes qui ne se parlaient pas — l'app Notes (quêtes, certifs, routine), un PDF figé (roadmap 15 semaines), une page HTML isolée (roadmap beatmaker), Life OS RPG (state interne propre), et le vault Obsidian (workflows MCP). Un système censé combattre le désordre et la procrastination, lui-même éparpillé sur cinq silos, était le problème plutôt que la solution.

Repéré aussi à ce stade : la tension entre les deux identités (ingénieur qui a mis sa carrière de côté pour la musique, musique pas encore rentable) et l'objectif explicite de ne jamais choisir entre les deux.

## Phase 2 — Première proposition d'architecture (abandonnée depuis)

Première passe : Obsidian comme source de vérité unique, Life OS RPG comme interface, Supabase pour la partie SaaS. Repérée en cours de route une vraie faille technique : un vault Obsidian local (MCP en `127.0.0.1`) ne peut pas être lu par une app mobile déployée sur les stores — ça a forcé à séparer les rôles (Obsidian = atelier de réflexion, base cloud = état canonique).

**Tournant** : tu as demandé de ne pas du tout reprendre Life OS comme référence et de repartir de zéro si nécessaire, avec des questions poussées avant d'exécuter.

## Phase 3 — Clarification par questions (deux séries)

Première série de 4 questions → réponses : interface = **web dashboard** (pas d'app native), rôle de Claude = **agent proactif** (pas juste réactif), gamification = **repenser complètement** (pas d'XP/niveaux façon RPG), priorité = **sprint dédié maintenant** (et révélation importante : tu n'avais pas encore commencé la roadmap 15 semaines — donc aucun rythme existant à protéger).

Deuxième série de 4 questions → réponses : canal proactif = **tâche planifiée Cowork** (pas de bot externe), mécanisme de motivation = **narratif + aversion à la perte + preuve publique** (explicitement pas "rien de gamifié"), stack = **React + Node + Supabase**, périmètre = **complet d'un coup**, avec la précision "je veux qu'il y ait toujours des quêtes et des objectifs".

## Phase 4 — Le mécanisme central : Chroniques

Conçu à partir des 3 leviers choisis : **Entrée** (fait vérifiable daté), **Chapitre** (une semaine, titre rédigé a posteriori par Claude à partir du réel, pas du prévu), **trois arcs** (Dev, Beatmaker, Croisement), **streaks** par piste critique (aversion à la perte sans points), **preuve publique** (brouillon de résumé jamais auto-publié + page publique partageable). Les quêtes restent centrales, rattachées à un chapitre plutôt qu'à un score.

## Phase 5 — Fusion avec "Le Chantier"

Tu as demandé de mixer ce mécanisme narratif avec une métaphore de construction : chaque quête finie = une brique posée sur un plan qui se remplit, le plan visualisé EST le chapitre. Nom de travail retenu : **LE CHANTIER**.

## Phase 6 — Direction esthétique, round 1 (AWGE) — largement révisée depuis

Première direction : esthétique AWGE, noir/orange brûlé (repris de ta propre roadmap-beatmaker.html), grain numérique, deux régimes d'interface (utilitaire rapide vs cinématographique). Tu as ensuite demandé une **interface cohérente partout, sans se soucier des contraintes de performance** — le poids visuel devient identique sur le dashboard privé et les pages publiques, décision confirmée et maintenue depuis.

À ce même moment : décision d'ajouter l'**upload d'instrumentaux et de projets dev finis**, et confirmation que ce système **remplace P0 "Portfolio"** de ta roadmap — devenant ta vitrine unique pour les deux identités (avec une home publique en split **CODE / SOUND**).

## Phase 7 — Trois séries de questions supplémentaires (design/UX, front-end, back-end)

Avant l'envoi de tes références visuelles, trois séries de questions ont figé : hébergement (**Vercel + Railway**), authentification (**Supabase Auth dès le départ**), traitement audio (**waveform calculée côté navigateur**), densité d'interface (**dense/pro**), navigation (**plein écran immersif**), icônes (**100% custom, aucune icône générique**), style front (**CSS sur-mesure, pas de Tailwind**), lecteur audio (**Wavesurfer.js**), gestion d'état (**Redux**).

## Phase 8 — Pivot esthétique majeur après ton moodboard (15 images)

Analyse du moodboard : quatre familles visuelles identifiées (cosmos/fractale, poster punk/hip-hop halftone, collage/annotation manuscrite, texture peinture). Ça a directement contredit deux décisions figées en Phase 6. Questions posées, réponses obtenues :

- **Palette** : bascule vers le **bleu profond/électrique** comme base (l'orange devient un clin d'œil ponctuel, plus la base du système)
- **Texture** : le **halftone** remplace complètement le grain numérique, partout
- **Annotations manuscrites rouges** : deviennent un **vrai langage d'interface fonctionnel** (retards, corrections, streaks rompus s'affichent comme des gribouillis à la main, pas dans un panneau séparé)
- **Collage/double exposition** : appliqué à **tous les Drops**, pas réservé à l'arc Croisement
- Motif signature secondaire identifié : la **main qui tient le globe**, repérée deux fois dans tes références, à côté de la forme d'onde déjà choisie

## Phase 9 — UI/UX détaillé, écran par écran

Sitemap consolidé et détaillé pour chaque vue (home publique, dashboard 3 colonnes, vues Arc en blueprint, catalogue instrus/projets, Drops archive + reveal individuel, streaks en heatmap, revue dominicale volontairement plus sobre, paramètres). Trois points laissés ouverts à ce moment : geste exact pour valider une quête, comportement responsive mobile précis, emplacement définitif du motif main-globe.

## Phase 10 — Améliorations UX/fonctionnelles (ta demande directe : "qu'est-ce que tu améliorerais")

Six ajouts retenus et intégrés à la spec :

1. **Capture rapide** — bouton "+" flottant + check-in du soir qui transforme une réponse libre en entrées structurées (identifié comme le point de friction le plus critique du système entier)
2. **Vue Corrélations** entre arcs, générée par Claude — sert directement l'objectif de fond (rigueur du code ↔ intuition musicale)
3. **Chapitre de reprise** — traitement compassionnel après une rupture de streak, pas seulement une cicatrice permanente
4. **Pipeline freelance dédié** (`/freelance`, kanban léger) — sorti de l'arc Dev où il était noyé
5. **Recherche universelle** (palette de commande Cmd/Ctrl+K)
6. **Chapitre 0** — amorçage avec ton historique réel plutôt qu'un dashboard vide au lancement

## Phase 11 — Améliorations architecture/robustesse (même demande, volet technique)

Neuf ajouts retenus et intégrés à la spec :

1. Portabilité des données (export JSON + Markdown réinjectable dans Obsidian)
2. Sauvegarde automatique hebdomadaire via n8n (le tier gratuit Supabase n'a pas de backup natif)
3. Endpoint webhook générique `/api/entree` plutôt qu'une intégration codée par outil
4. Mémoire persistante du coaching (fichier de contexte relu par Claude à chaque check-in)
5. Types partagés front/back générés depuis le schéma Supabase
6. Le backend seul autorisé à parler à Claude et calculer streaks/chapitres
7. Traitement asynchrone pour les appels IA (statut "en génération")
8. Environnement de test Supabase séparé des données réelles
9. Observabilité minimale (Sentry/logs) pour détecter une sync cassée en silence

## État actuel — ce qui est figé vs ce qui reste ouvert

**Figé** : mécanisme (Chroniques + Chantier fusionnés), palette (bleu/rouge/jaune, halftone, annotations manuscrites fonctionnelles, collage sur tous les Drops), sitemap complet, modèle de données (arcs, chapitres, quêtes, entrées, streaks, instrumentaux, projets_dev, prospects), stack (React + Node + Redux + Wavesurfer.js + CSS sur-mesure), hébergement (Vercel + Railway), auth (Supabase dès le départ), robustesse (export, backup, webhook générique, observabilité).

**Encore ouvert** :
- Le nom définitif du site (LE CHANTIER reste un nom de travail)
- Le geste exact pour valider une quête (tap / glisser / appui long)
- Le comportement responsive précis sur petit écran pour les vues plein écran
- L'emplacement définitif du motif main-globe (logo seul, hero, ou récurrent comme la waveform)

**Tâches de suivi (liste de tâches active)** : conception du mécanisme ✅, schéma de données ✅, scaffold du projet — **pas encore commencé**, workflows n8n — **pas encore commencés**, tâche planifiée Cowork pour le check-in proactif — **pas encore configurée**.

## Recommandation avant de lancer le scaffold

Tout le reste étant cohérent et documenté dans `Systeme-Chroniques-Spec.md`, les 4 points encore ouverts ci-dessus sont les seuls qui vaillent la peine d'être tranchés avant d'écrire du code — le reste peut s'ajuster en cours de route sans coût de réécriture significatif.
