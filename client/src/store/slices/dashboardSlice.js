import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet } from '../../lib/api.js';

/**
 * Un seul fetch /api/dashboard pour le Chantier.
 * Évite les doublons StrictMode via lastRequestId + abort.
 */
export const fetchDashboard = createAsyncThunk(
  'dashboard/fetch',
  async (_, { signal }) => {
    const data = await apiGet('/dashboard', { signal });
    if (signal?.aborted) {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    }
    if (!data || typeof data !== 'object') {
      throw new Error('réponse /dashboard invalide');
    }
    return data;
  },
);

const empty = {
  arcs: [],
  quetes: [],
  streaks: [],
  chapitres: [],
  chroniqueJour: null,
  chapitreActif: null,
  entrees: [],
  emploiDuTemps: null,
  ereActive: null,
  dispersion: null,
  contremaitre: null,
  ravitaillement: null,
  directives: {},
  erreurs: [],
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    ...empty,
    statut: 'idle',
    erreur: null,
    lastRequestId: null,
    fetchedAt: null,
  },
  reducers: {
    resetDashboard(state) {
      Object.assign(state, empty);
      state.statut = 'idle';
      state.erreur = null;
      state.lastRequestId = null;
      state.fetchedAt = null;
    },
    /** Après PATCH quête — maj locale sans refetch. */
    patchQueteLocale(state, action) {
      const q = action.payload;
      if (!q?.id) return;
      const i = state.quetes.findIndex((x) => x.id === q.id);
      if (i >= 0) state.quetes[i] = q;
    },
    clearContremaitre(state) {
      state.contremaitre = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state, action) => {
        state.lastRequestId = action.meta.requestId;
        state.erreur = null;
        if (state.statut === 'idle' || !state.fetchedAt) {
          state.statut = 'chargement';
        }
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.lastRequestId) return;
        const p = action.payload;
        state.arcs = Array.isArray(p.arcs) ? p.arcs : (p.arcs === null ? state.arcs : []);
        state.quetes = Array.isArray(p.quetes) ? p.quetes : (p.quetes === null ? state.quetes : []);
        state.streaks = Array.isArray(p.streaks) ? p.streaks : [];
        state.chapitres = Array.isArray(p.chapitres) ? p.chapitres : [];
        state.chroniqueJour = p.chroniqueJour ?? null;
        state.chapitreActif = p.chapitreActif ?? null;
        state.entrees = Array.isArray(p.entrees) ? p.entrees : [];
        state.emploiDuTemps = p.emploiDuTemps ?? null;
        state.ereActive = p.ereActive ?? null;
        state.dispersion = p.dispersion ?? null;
        state.contremaitre = p.contremaitre ?? null;
        state.ravitaillement = p.ravitaillement ?? null;
        state.directives = p.directives && typeof p.directives === 'object' ? p.directives : {};
        state.erreurs = Array.isArray(p.erreurs) ? p.erreurs : [];
        state.statut = 'pret';
        state.erreur = null;
        state.fetchedAt = Date.now();
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        if (action.meta?.aborted || action.error?.name === 'AbortError') return;
        if (action.meta.requestId !== state.lastRequestId) return;
        state.statut = 'erreur';
        state.erreur = action.error.message;
      });
  },
});

export const { resetDashboard, patchQueteLocale, clearContremaitre } = dashboardSlice.actions;
export default dashboardSlice.reducer;

/** Sélecteurs */
export const selectDashboard = (s) => s.dashboard;
export const selectDirectives = (s) => s.dashboard.directives || {};
export const selectMessageMatin = (s) => s.dashboard.directives?.message_matin || null;
export const selectPrioritesJour = (s) => s.dashboard.directives?.priorites_jour || null;
export const selectDashboardErreurs = (s) => s.dashboard.erreurs || [];

/**
 * Réordonne les quêtes : IDs de priorites_jour en tête, sans masquer les autres.
 * @param {object[]} quetes
 * @param {object|null} prioritesDirective
 */
export function reorderQuetesByPriorites(quetes, prioritesDirective) {
  const ids = prioritesDirective?.contenu?.quete_ids;
  if (!Array.isArray(ids) || !ids.length || !Array.isArray(quetes)) return quetes || [];
  const rank = new Map(ids.map((id, i) => [id, i]));
  return [...quetes].sort((a, b) => {
    const ra = rank.has(a.id) ? rank.get(a.id) : ids.length + 1;
    const rb = rank.has(b.id) ? rank.get(b.id) : ids.length + 1;
    if (ra !== rb) return ra - rb;
    return 0;
  });
}

/**
 * Horodatage style compteur : DIRECTIVE 07.27 · 08H12
 * @param {string|Date} iso
 */
export function formatDirectiveStamp(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `DIRECTIVE ${mm}.${dd} · ${hh}H${min}`;
}

/** Texte utile d'une directive message_matin / priorites. */
export function texteDirective(directive) {
  if (!directive?.contenu) return null;
  const c = directive.contenu;
  if (typeof c === 'string') return c;
  return c.texte || c.message || null;
}
