# Direction artistique TWIY — World Poster OS

Synthèse moodboard complet + [awge.com](https://awge.com).  
Artefact détaillé (canvas) : ouvrir `twiy-art-direction.canvas.tsx` dans Cursor.

## Une phrase
OS personnel présenté comme une **affiche de rue cosmique** : porte d’entrée culturelle (attitude AWGE), dualité **CODE** (blueprint) / **SOUND** (chrome vinyl), climax en **Drops collage**.

## 5 piliers
1. **Main + Globe** — marque hero  
2. **Halftone / grain** — texture lisible  
3. **Collage + annotations rouges** — langage UI  
4. **Cosmos / profondeur** — jamais fond plat  
5. **Chrome SOUND** — matière Beatmaker  

## Dual register (Partie 2 — 2026-07-20)

### Registre quotidien (défaut) — oxblood / bordeaux
Base UI partout (Chantier, nav, forms, panels OS) :

| Token | Hex | Rôle |
|---|---|---|
| `--fond` / `--bg-0` | `#1a0f0d` | Fond void |
| `--cartes` / `--bg-1` | `#2b1512` | Panels |
| `--bordures` / `--bg-3` | `#4a231d` | Bordures / profondeur |
| `--texte` / `--text` | `#f2e8da` | Texte |
| `--texte-secondary` / `--text-muted` | `#a89484` | Secondaire |
| `--accent-alerte` / `--rouge` | `#ff5a3c` | Vermillon |
| `--accent-secondaire` / `--jaune` | `#f5c542` | Moutarde |

Legacy `--bleu-*` mappés vers bordeaux chaud (`#6b2a22` / `#8a3d32`) pour ne pas casser le site.  
Classe : `.registre-quotidien` (body layouts).

### Registre fort — magenta / cyan iridescent
**Uniquement** moments forts — **jamais** Chantier / nav / forms :

- Drop reveal fullscreen (`.registre-fort` + `/brand/drop-reveal-fort.png`) + **main-globe vivant** (`.globe-hand-vivant`, CSS iris ; SoundGate reste static `globe-hand.png`)
- Pochettes catalogue Instrus (sleeves + deck écoute + **AnalyserNode** tint) — fallback `/brand/instru-sleeve-fort.png` puis `vinyl-chrome.png`
- Hero public CODE / SOUND (`Home` panes) — atmosphère `/brand/hero-code-sound-fort.png`

Tokens documentés : `--fort-magenta` `#ff2bd6` · `--fort-cyan` `#2de2e6` · `--fort-iris` / `--fort-iris-hot`.

### Collage Chronique / Revue (Partie 2 deferred → shippé)
SVG génératif depuis faits + quêtes 7j (fragments texte, sparkline activité, fragment marque) — pas d’image template fixe. Heuristique sans Anthropic.

### Insights
Remplacé par l’onde Chantier : nav Insights retiré · `/insights` → `/chantier`.

## Cohérence
- Palette quotidienne = **oxblood** ; registre fort = ponctuation magenta/cyan  
- Maximalisme dans les **images/Drops**, discipline dans l’**UI**  
- Public = affiche ; Privé = OS dense même ADN  
- Halftone, annotations manuscrites, densité HUD inchangés  

## Ne pas faire
Clone CRT beige AWGE · néons partout · SaaS cards · hero typo seule · copier symboles Partie 3 (3ᵉ œil / lune / fleur) · magenta/cyan dans le quotidien  

## Private OS pass
Privé = même ADN que le public, en **console HUD** (pas admin SaaS) :
- Shell `layout-os` + `.registre-quotidien` : void grid, bloom oxblood, grain/scanlines, coins HUD
- Chantier : **onde continue** Dev/Beatmaker (interférence = corrélation) à la place des ArcCards side-by-side
- Chronique : reveal machine à écrire / glitch soft (`prefers-reduced-motion` → texte plein)
- Palette **Cmd/Ctrl+K** : jump Chantier / Capture / Revue / Studio / Ère / Rayonnement / arcs / Paramètres

## Moodboard vidéos
Frames → [`moodboard-videos.md`](./moodboard-videos.md).  
Grain / scanlines / HUD mono inchangés ; base froide **bleu nuit** remplacée par oxblood.
