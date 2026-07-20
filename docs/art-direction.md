# Direction artistique TWIY — World Poster OS

Synthèse moodboard complet + [awge.com](https://awge.com).  
Artefact détaillé (canvas) : ouvrir `twiy-art-direction.canvas.tsx` dans Cursor.

## Une phrase
OS personnel présenté comme une **affiche de rue cosmique** : porte d’entrée culturelle (attitude AWGE), dualité **CODE** (blueprint) / **SOUND** (chrome vinyl), climax en **Drops collage** — esthétique **patchwork** des sources moodboard.

## 5 piliers
1. **Main + Globe** — marque hero  
2. **Halftone / grain** — texture lisible  
3. **Collage + annotations rouges** — langage UI  
4. **Cosmos / profondeur** — jamais fond plat  
5. **Chrome SOUND** — matière Beatmaker  

## Patchwork moodboard (2026-07-20)

Assets dans `client/public/brand/moodboard/` (uploads utilisateur, pas Nano Banana).  
Composant : `MoodboardPatchwork.jsx` — scraps rotatifs / torn edges / grain / blocs contraste.  
**Fort** sur SoundGate · Home · Drop · Instrus · Projets.  
**Calme** sur Layout OS · OsHeader strip · Chantier · Login · Chronique — scraps derrière le contenu, lisibilité préservée.  
Variants : `gate` · `home` · `drop` · `drops` · `instrus` · `projets` · `os` · `chantier` · `login` · `strip`.  
Drops list/spiral : thumbs moodboard cyclés via `moodboardThumb()`.

| Fichier | Source | Rôle |
|---|---|---|
| `twiy-globe.png` | poster violet « THE WORLD IS YOURS » | Marque — **un** accent violet, pas le thème entier |
| `youth-globe.png` | jeune dither + globe cobalt | CODE / cool électrique |
| `cosmic-face.png` | profil planète / nuages | Drop reveal base |
| `ukiyo-sun.png` | soleil rouge + pin + vagues | Scrap chaud |
| `prism-cloud.png` | prisme / diamant | Scrap Drop |
| `islands-sunrise.png` | îles psychedelic | Scrap Home |
| `afro-punk.png` | portraits rouge/jaune | Scrap SOUND |
| `silver-surfer.png` | cosmos B&W | Scrap CODE |
| `asake-sleeve.png` | pochette annotée cream/noir | Fallback sleeves Instrus |
| `lebron-wine.png` | collage wine/gold | Scrap warm |
| `rodman-red.png` | portrait lunettes rouge | Scrap Instrus |
| `cloud-tunnel.png` | tunnel nuages | Scrap SoundGate |

Aliases legacy : `drop-reveal-fort.png` ← cosmic · `instru-sleeve-fort.png` ← asake · `hero-code-sound-fort.png` ← youth.  
SoundGate garde `globe-hand.png` au premier plan.

## Dual register

### Registre quotidien — charcoal / wine / cream
| Token | Hex | Rôle |
|---|---|---|
| `--fond` | `#0e0c10` | Void charcoal |
| `--cartes` | `#1a1416` | Panels |
| `--bordures` | `#3f261f` | Bordures |
| `--texte` | `#f0e6d4` | Cream papier |
| `--texte-secondary` | `#a89278` | Secondaire |
| `--accent-alerte` | `#ff3d3a` | Vermillon |
| `--accent-secondaire` | `#e8c24a` | Or |
| `--wine` | `#7a1830` | Wine collage |
| `--patch-orange` | `#ff6b2c` | Afro-punk flash |
| `--patch-violet` | `#5a3fd4` | Accent poster globe (ponctuel) |

### Registre fort — public only
| Token | Hex | Rôle |
|---|---|---|
| `--fort-magenta` | `#ff2a4a` | Punch rouge cosmique |
| `--fort-cyan` | `#2d6bff` | Cobalt électrique |
| `--fort-flash` | `#3ec8ff` | Cyan nuages |

## Cohérence
- Patchwork = maximalisme images publiques ; UI privée = discipline oxblood/wine  
- Violet poster = **un** scrap / accent, jamais fond SaaS purple-on-white  
- Halftone, annotations manuscrites, HUD inchangés  

## Ne pas faire
Clone CRT beige AWGE · néons partout · SaaS cards · hero typo seule · patchwork chaotique dans Chantier · remplacer `globe-hand` SoundGate  

## Private OS pass
Privé = même ADN, console HUD calme (pas collage fort) :
- Shell `layout-os` + `.registre-quotidien`
- Chantier : onde Dev/Beatmaker · Chronique typewriter · Cmd/Ctrl+K

## Moodboard vidéos
Frames → [`moodboard-videos.md`](./moodboard-videos.md) (patterns UI).  
Stills brand = dossier `brand/moodboard/` ci-dessus.
