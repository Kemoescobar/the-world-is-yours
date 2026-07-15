# TWIY — avancement

## Phase 0 — Sécurisation ✅
## Phase 1 — Boucle quotidienne ✅
## Phase 2 — Vitrine World Poster OS ✅

## Phase 3 — IA + automatisation ✅ (fondations)

## Audit pre-launch — remediation ✅ (code + suivi)

- Allowlist `OWNER_USER_ID` / `ALLOWED_USER_IDS` sur routes privées + export
- Catalogues : JWT vérifié avant levée filtre showcase/shippé
- Rate-limit webhooks + `/api/ai` + export ; cooldown login client
- Mentions légales + confidentialité (`/mentions`, `/confidentialite`)
- Fonts self-host (@fontsource), lazy routes, `prefers-reduced-motion`, `:focus-visible`
- Migration RLS owner + indexes FK (`supabase/migrations/20260714_…`)
- Sitemap / robots / OG en URLs absolues prod
- Storage listing public retiré + grants `is_app_owner` (`20260715_…`)
- Suivi : `docs/audit-followups.md` · auth : `docs/auth-hardening.md`

**Déjà fait côté toi** : `OWNER_USER_ID` Railway + insert `app_owners` + `.env` local.

**Encore Dashboard Auth** : fermer signup public + activer HaveIBeenPwned (pas d’API MCP).

**Toi seulement (hors code)** : clearance samples / droits brand, contraste WCAG, n8n si tu veux l’activer. **Pas** de `ANTHROPIC_API_KEY` tant que tu n’as qu’un abonnement Claude Pro (pas de clé Console).

### Code
- `POST/GET /api/ai/*` — revue, insights, check-in, titre chapitre, routines-jour
- Claude via fetch Anthropic (`server/src/lib/claude.js`)
- Mémoire coaching `server/data/coaching-memory.md`
- `POST /chapitres/:id/cloturer` avec titre IA
- UI : Revue, Insights, Capture check-in, Paramètres (statut Claude)

### À activer (toi, optionnel)
1. Anthropic Console → clé → Railway `ANTHROPIC_API_KEY` → Redeploy (sinon IA soft-off)
2. Tester Revue / Insights / Check-in **après** la clé
3. (Optionnel) Importer workflows `n8n/` — copy-paste dans `n8n/README.md`

Doc : `docs/phase-3.md`

## Relancer local
```powershell
cd C:\twiy\server; npm run dev
cd C:\twiy\client; npm run dev
```
