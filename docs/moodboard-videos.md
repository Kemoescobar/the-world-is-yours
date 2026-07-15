# Moodboard vidéos — DA extraite (frames)

Sources analysées via frames ffmpeg → `tmp/moodboard-frames/{360,480,1440}/`.

## 360x270 — lecteur / catalogue street

| Signal | Observation |
|--------|-------------|
| **Couleurs** | Bleu saturé (cerulean) plein écran · panneaux crème / maroon · noir profond · accents orange/rose dans les covers |
| **Composition** | Split hero gauche + listes droites · Cover Flow 3D (éventail de sleeves) · cutouts sticker bord blanc irrégulier |
| **Typo** | Display condensé/bold uppercase (“MANGO JUMP”) · ghost/reflet sous le titre · listes mono/utilitaires |
| **Texture** | Grain lo-fi · compression CRT · surfaces mats type zine |
| **Motion** | Carousel horizontal · panels qui pivotent face-caméra |

**Traduction TWIY :** split CODE/SOUND renforcé · titres ghostés · grain/scanlines plus présents · stickers collage sur empty/media.

## 480 — spiral showreel / void digital

| Signal | Observation |
|--------|-------------|
| **Couleurs** | Void noir + grille technique · cartes neon (cyan, rose, orange, lime) · chrome/iridescent · jaune badge |
| **Composition** | Une scène 3D (spiral) · UI ancrée aux coins · toggle `spiral • list` · pas de grille SaaS |
| **Typo** | Sans minimal lowercase · séparateurs `•` · sélection avec bordure irisée |
| **Texture** | Film grain fort · bloom · bleed CRT sur médias |
| **Motion** | Cartes qui avancent dans le tunnel · pulse/glow soft |

**Traduction TWIY :** atmosphère void+grille · chrome iridescent · HUD corners · grain animé · bloom sur panes SOUND.

## 1440 — lookbook technique (BECANE)

| Signal | Observation |
|--------|-------------|
| **Couleurs** | Blanc clinique *ou* cinéma noir · rouge/magenta ponctuel · chrome métallique · kaki secondaire |
| **Composition** | Hero sujet unique · UI HUD coins · figures ghostées voisines · énorme negative space |
| **Typo** | Display **wide / extended** bold uppercase · meta mono technique (`LOOK 06 / 11`, degrés) |
| **Texture** | Crisp digital *ou* haze/blur atmosphérique · grain cinéma léger |
| **Motion** | Carousel soft opacity · viewer 360° (slider ticks) |

**Traduction TWIY :** display plus wide · compteurs type archive · nav fine chrome · pas de clone blanc clinique (on reste bleu nuit).

## Synthèse appliquée

1. **Palette** — garder bleu nuit + rouge + jaune ; intensifier chrome/iridescent et bloom (pas cream/purple SaaS).
2. **Type** — Bricolage plus wide/uppercase ; Space Mono pour HUD `›` / `•`.
3. **Texture** — grain + scanlines + halftone plus marqués ; grille void.
4. **Motion** — chrome-shimmer · title-ghost · atmosphere-breathe (+ reduced-motion).
5. **Composition** — brand hero first · panes CODE/SOUND comme sleeves · stats en frise technique fine.

## Private OS pass
Traduction spiral/lookbook côté **authentifié** (shell + pages) :
- Void + grille + coins HUD + barre chrome sticky
- Compteurs archive (`os-stat-rail`) · panels chrome (pas card-grid SaaS)
- Capture FAB clip-path rouge · modal chrome-edge
- Voir aussi note « Private OS pass » dans [`art-direction.md`](./art-direction.md).

## Ship — chrome + Cover Flow + HUD (pass courant)
Appliqué côté public + login gate :
- **Chrome** — bordures iridescentes plus épaisses, bars shimmer, specular panels (bleu/rouge/jaune)
- **Cover Flow** — `CoverFlow.jsx` sur CatalogueInstrus + CatalogueProjets (perspective desktop, scroll-snap mobile, ghost neighbors)
- **HUD 1440** — coins + compteurs mono + titres wide/ghost sur Home, SoundGate, headers catalogue, Login
- **Textures** — grain/scanlines live + `prefers-reduced-motion` (animations coupées, opacités adoucies)
- **Private** — OsHeader wide + chrome bars ; panels OS plus métalliques ; Login = console AUTH (pas form plat)
