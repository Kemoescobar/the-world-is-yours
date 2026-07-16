# Prompts Nano Banana — assets TWIY (World Poster OS)

Utilise ces prompts **tels quels**. Ajoute toujours le bloc **NÉGATIF** en fin de chaque génération.  
Référence DA : `docs/art-direction.md` + images actuelles dans `client/public/brand/`.

## Palette verrouillée (ne pas dériver)
- Fond : bleu nuit `#0A1628` → `#06101C` (jamais crème, jamais blanc clinique, jamais violet SaaS)
- Accents UI : rouge annotation `#E23D28` · jaune badge `#FFD23F`
- Chrome SOUND : métal froid + iridescence **légère** cyan/magenta **seulement sur le vinyle**, pas sur tout l’image
- Noir profond + blanc haute densité pour le halftone

## Style technique obligatoire (commun)
```
printed poster collage, heavy black-and-white halftone dots on skin and figures,
xerox / newsprint texture, visible film grain and fine scratches,
technical HUD annotations as thin dashed orbital lines and tiny crosshairs,
cinematic directional light from top-left, deep crushed blacks,
World Poster OS aesthetic, street cosmic editorial, NOT clean 3D, NOT glossy stock photo
```

## NÉGATIF (coller à chaque fois)
```
no purple gradient UI, no neon cyberpunk city overload, no cream beige CRT,
no Inter font, no SaaS dashboard, no Instagram interface, no mute button,
no watermarks, no readable logos, no brand names, no "PROMPT", no "MADE BY",
no soft plastic 3D render, no anime, no cute cartoon, no white clinical background,
no pastel, no bokeh lifestyle photography
```

---

## 1) `globe-hand.png` — SoundGate / favicon / OG (carré 1:1)

**Rôle :** marque hero. Doit ressembler à une **main photo-halftone** tenant un **petit globe chrome**, pas une main 3D lisse.

```
Square 1:1 brand mark for THE WORLD IS YOURS.
SUBJECT: a single weathered adult human hand and forearm rising from bottom center,
palm up, cradling a small Earth globe the size of an apple.
HAND: high-contrast black-and-white photographic skin with dense newspaper halftone stipple,
deep pores and wrinkles, Xerox print look, NOT smooth CGI skin.
GLOBE: polished chrome / liquid metal sphere, sharp specular highlights,
dark stippled continents, faint city-light reflections in the metal, cool steel not gold.
BACKGROUND: flat deep midnight navy #0A1628 with subtle grain, almost empty void, no landscape.
GRAPHICS: thin yellow dashed orbital rings around the globe, one small 4-point yellow star on the ring,
one thin vertical red tick marks + tiny red star on the left, tiny red crosshair bottom-right,
small red circular grid icon on the black sleeve cuff.
LIGHT: hard key from top-left, right side of hand in deep shadow.
MOOD: epic but raw, chantier / legend, printed street poster.
NO face, NO second hand, NO text, NO UI chrome frames.
```
+ bloc NÉGATIF

**Settings tip :** strength style élevée · avoid “photoreal soft skin” · prefer “halftone print”

---

## 2) `globe-youth.png` — Home atmosphère (16:9)

**Rôle :** collage cosmique + jeunesse. Doit être **layered poster**, pas un screenshot Unreal Engine.

```
Wide 16:9 atmospheric poster collage, THE WORLD IS YOURS dual CODE/SOUND myth.
COMPOSITION low-angle hero shot: 4–5 young figures in streetwear (hoodies, cargos) seen from behind
standing on a dark ledge / rooftop edge, looking up at a massive glowing Earth filling the upper sky.
LEFT: large semi-transparent young face in profile as a faded memory layer, heavy blue halftone dots on the face,
ghosted into the sky — not a sharp portrait.
MID: dark silhouette city skyline merging into stars; far right a thin scaffolding / staircase structure
with tiny climbing figures (chantier metaphor).
TEXTURE: digital collage with cut-out edges, heavy film grain, white dust scratches, paper fold wear,
halftone everywhere, mustard yellow paint splashes and thick brush strokes bottom-right and far right
(street annotation energy, not rainbow graffiti).
COLOR STORY only: deep indigo / cobalt / midnight black base; electric blue glow on Earth rim;
mustard yellow #FFD23F paint accents; tiny red #E23D28 sparks only.
Faint white navigational orbit lines around the planet.
MOOD: epic accumulation, legend in progress, printed zine cosmic street — NOT clean sci-fi wallpaper.
NO readable text, NO brand logos, NO celebrity likeness.
```
+ bloc NÉGATIF

---

## 3) `vinyl-chrome.png` — SOUND / fallback Cover Flow (carré 1:1)

**Rôle :** matière Beatmaker. Un **seul disque**, face caméra, chrome + rainures — pas un setup studio.

```
Square 1:1 product-icon vinyl disc for SOUND catalogue sleeve fallback.
SUBJECT: one vinyl record perfectly centered, facing camera, standing on a barely visible dark grainy floor.
GROOVES: sharp concentric circles, dark charcoal body.
CHROME: thin iridescent rim light — cool cyan and magenta oil-slick ONLY on the outer edge and groove highlights,
still anchored in midnight navy void #06101C, not a rainbow explosion.
CENTER: small black spindle hole, no label sticker, no text on the disc.
BACKGROUND: empty dark navy studio void with soft grain, no shelves, no speakers, no turntable arm.
LIGHT: two specular hits at 10 o'clock and 4 o'clock, dramatic tech-noir, crisp not muddy.
STYLE: high-fidelity chrome object photography + subtle film grain — cleaner than the hand asset,
but still NOT plastic toy CGI.
NO text, NO watermark, NO album cover artwork in the center.
```
+ bloc NÉGATIF

---

## 4) Chronique / Chantier ambiance (optionnel, 16:9)

```
Wide 16:9 background texture plate for a private OS dashboard (Chantier).
Deep midnight blue void with faint technical grid like a blueprint under dust,
soft chrome bloom in corners, heavy film grain and scanline hint,
torn poster collage fragments at edges only (not covering center),
thin red handwritten annotation strokes that are illegible scribbles (no readable words),
tiny yellow HUD ticks, empty center negative space for UI text,
World Poster OS private console atmosphere.
NO windows of a SaaS app, NO charts, NO stock office photos.
```
+ bloc NÉGATIF

---

## 5) Drop collage (optionnel, 1:1 ou 4:5)

```
Square collage "mur de preuves" for Drops climax.
Layered cutout stickers with irregular white paper borders: abstract screen captures (blurred UI, no logos),
chrome vinyl shard, small globe fragment, red ink stamp marks, yellow tape,
dense maximalist street poster wall, halftone + grain + xerox edges,
palette locked midnight blue / red / yellow only,
looks physical and taped, not a clean Figma mock.
NO faces of real celebrities, NO readable brand logos, NO app store UI.
```
+ bloc NÉGATIF

---

## Workflow Nano Banana recommandé
1. Générer **globe-hand** en premier → c’est l’ancre DA.  
2. Si le résultat est trop “3D clean” : relancer avec suffixe  
   `more halftone dots, more xerox noise, less CGI, print poster`.  
3. Pour **globe-youth** : demander `match the print collage texture of the hand/globe brand mark`.  
4. Exporter PNG → remplacer `client/public/brand/<même-nom>.png` → push.
