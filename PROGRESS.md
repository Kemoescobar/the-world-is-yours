# TWIY — avancement

## Phase 0 — Sécurisation ✅
JWT, `lib/api.js`, layouts public/privé, Zod, idempotence quêtes, dédup GitHub, TZ Madagascar, CORS.

## Phase 1 — Boucle quotidienne ✅
API Railway + client Vercel + CORS + webhook GitHub → Chroniques.

| Élément | URL |
|---------|-----|
| API | `https://the-world-is-yours-production.up.railway.app` |
| Client | `https://the-world-is-yours-seven.vercel.app` |

## Phase 2 — Vitrine / World Poster OS ✅

Direction : `docs/art-direction.md` · AWGE : `docs/moodboard-awge.md`

### Livré
- Tokens : halftone fort, grain, scanlines, chrome, motion
- Assets marque : `client/public/brand/`
- SoundGate + Home dualité + **stats publiques** (shippés / showcase / arcs)
- **Sons UI** (enter / tick quête / impact Drop) via Web Audio
- Micro-interactions : hover CODE/SOUND, grain/scanline live, typo dither
- Catalogues CODE + SOUND en case studies éditoriales
- DropDetail collage + Chantier frise + Nav hiérarchisée
- Paramètres : auto-probe webhook

### Contenu (toi)
Ajouter captures projets + instrus showcase pour que la vitrine soit pleine.

## Phase 3 — plus tard
IA chapitres, n8n, sync Obsidian, quêtes depuis habitudes.

## Relancer local
```powershell
cd C:\twiy\server; npm run dev
cd C:\twiy\client; npm run dev
```
