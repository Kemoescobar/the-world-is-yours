# Checklist clearance — images & samples (pré-public)

> **Processus interne, pas un conseil juridique.**  
> Case à cocher avant une ouverture large / partage public du site. En cas de doute : remplacer l’asset ou demander à un pro (juriste / société de gestion).

Références repo : [`audit-followups.md`](./audit-followups.md) (section Légal / assets), [`art-direction.md`](./art-direction.md), [`moodboard-videos.md`](./moodboard-videos.md).

---

## 0. Constat inventaire (repo, juil. 2026)

### Brand shippé dans `client/public/brand/`

| Fichier | Usage code | Signal risque (observation) |
|---------|------------|-----------------------------|
| `globe-hand.png` | SoundGate ; fallback sleeve Catalogue Projets ; favicon + OG/Twitter (`client/index.html`) | Capture type réseau social (UI mute visible) + motif corps/globe — **vérifier origine avant public large** |
| `globe-youth.png` | Home (atmosphère bas-centre) | Collage (figure, globe, texte arabe, logos) — **vérifier si DA tierce / moodboard téléchargé** |
| `vinyl-chrome.png` | Home pane SOUND ; fallback vinyl Catalogue Instrus | Texte « PROMT » + crédit « MADE BY » → **très probablement IA** ; crop / ToS outil à vérifier |

### Hors `public/` (OK pour DA privée, pas pour ship)

| Emplacement | Statut |
|-------------|--------|
| `tmp/moodboard-frames/` (gitignored) | Frames ffmpeg des vidéos moodboard — **référence DA seulement**. Pas copiées dans `public/brand/` à ce jour. |
| Docs moodboard / AWGE | Inspiration langage (couleurs, chrome, HUD) — **pas une licence d’usage des stills** |

### Audio

| Source | Statut |
|--------|--------|
| Fichiers `.mp3` / `.wav` dans le repo | **Aucun** seed / démo tracké |
| Sons UI (`client/src/lib/sounds.js`) | Synthèse Web Audio — pas de sample fichier |
| Catalogue instrumentaux | Upload owner → bucket Supabase `instrumentaux` + covers `captures` — **chaque beat publié = clearance manuelle** |

**Aucune suppression d’asset brand** effectuée ici : les PNG ne sont pas des frames ffmpeg clairement extraites des showreels moodboard ; ils restent à **valider / remplacer** par toi.

---

## 1. Inventaire à cocher — images brand

Pour chaque fichier, note la **source** (photo perso / IA + outil / stock + licence / téléchargement tiers) et la **décision** (OK public · remplacer · retirer).

- [ ] `client/public/brand/globe-hand.png`  
  - Source : _______________  
  - Décision : _______________  
  - Si doute : remplacer (favicon + OG inclus) avant showcase large

- [ ] `client/public/brand/globe-youth.png`  
  - Source : _______________  
  - Décision : _______________  

- [ ] `client/public/brand/vinyl-chrome.png`  
  - Outil IA / date / compte : _______________  
  - ToS commercial / affichage public OK ? oui / non / inconnu  
  - Crop watermark « PROMT / MADE BY » si tu le gardes : fait / à faire  
  - Décision : _______________  

---

## 2. Actions par type d’image (pratique)

| Type | Action manuelle |
|------|-----------------|
| **Photos / art que tu as créés** | OK pour public si tu es seul auteur (ou cession claire des co-auteurs). Garder fichiers sources + date. |
| **IA générée** | Lire les CGU de l’outil (commercial, watermark, contenu généré). Garder prompt + date. Éviter de shipper le watermark. Si ToS flou → régénérer avec outil clair ou remplacer. |
| **Stock** (Adobe, Shutterstock, etc.) | Licence **téléchargement + usage web** ; noter n° licence. Licence éditoriale seule ≠ vitrine marque. |
| **Stills / captures showreel ou Instagram tiers** | **Ne pas** laisser en `public/` pour un lancement large sans droit écrit. Remplacer par asset propre (photo perso, IA claire, stock). Les frames `tmp/moodboard-frames/` restent privées. |
| **Logos / drapeaux / marques visibles dans un collage** | Retirer ou flouter si ce n’est pas ta marque / sans autorisation. |
| **Visages (mineurs surtout)** | Exiger droit à l’image / parent / modèle ; sinon remplacer. |

---

## 3. Captures & covers uploadés (runtime)

Pas dans le git — dans Supabase Storage (`captures`, covers instrus, screenshots projets).

- [ ] Lister les covers instrumentaux publiés (`cover_url`) → origine OK ?
- [ ] Lister les captures projets publiées → screenshots **de tes** apps / maquettes OK ; pas de UI produit tiers protégée sans droit
- [ ] Pas d’image moodboard / showreel collée par erreur en cover

---

## 4. Samples audio dans les beats (catalogue)

Aucun seed démo dans le code. Clearance = **ce que tu as déjà uploadé** (et ce que tu uploades ensuite).

Pour **chaque** instrumental en `statut` showcase / public :

- [ ] Titre / id : _______________
- [ ] Samples / packs utilisés (nom + vendeur) : _______________
- [ ] Licence pack (royalty-free beatmaking ? interdiction revente stems ? crédit obligatoire ?) : _______________
- [ ] Samples « uncleared » (vinyl rip, acapella, YouTube, etc.) : **aucun** ou retiré / remplacé
- [ ] Décision : public OK · privé seulement · retirer du catalogue

Rappel process (pas conseil) : un pack « pour producers » ne couvre pas toujours une **vitrine publique** ou une monétisation — lire la licence du pack.

Avant « showcase public large » (cf. audit-followups) :

- [ ] Au moins un passage sur tous les instrus actuellement listés en public
- [ ] Si un beat est douteux → le passer hors vitrine / le retirer jusqu’à remplacement

---

## 5. Moodboard vidéos — règle simple

- [x] Frames dans `tmp/` = analyse DA uniquement (déjà le cas dans les docs)
- [ ] Aucun still identifiable (visage, logo showreel, UI produit) recopié dans `client/public/`
- [ ] Si un brand PNG s’avère être une capture Instagram / showreel tiers → **remplacer** (ne pas compter sur « inspiration »)

---

## 6. Go / no-go public large

Cocher seulement quand c’est vrai :

- [ ] Les 3 PNG `public/brand/` ont une source notée et une décision « OK public »
- [ ] Favicon + OG (`globe-hand`) = même asset validé (ou nouvel asset poussé)
- [ ] Covers / captures runtime passés en revue
- [ ] Instrumentaux publics : samples notés ou beats retirés
- [ ] En cas de doute restant : asset retiré / remplacé **avant** partage large

Quand tout est vert : cocher aussi dans [`audit-followups.md`](./audit-followups.md) § Légal / assets.

---

## 7. Remplacement rapide (si tu invalidates un brand)

1. Déposer le nouvel asset dans `client/public/brand/` (même nom **ou** maj des `src` + `index.html` OG/favicon).
2. Hard refresh / redeploy Vercel.
3. Mettre à jour ce fichier (source + date de validation).
