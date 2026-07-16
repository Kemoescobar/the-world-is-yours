import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPatch } from '../../lib/api.js';

export const fetchQuetes = createAsyncThunk(
  'quetes/fetch',
  async (filtres = {}) => {
    const params = new URLSearchParams(filtres);
    const q = params.toString();
    const data = await apiGet(`/quetes${q ? `?${q}` : ''}`);
    if (!Array.isArray(data)) {
      throw new Error('réponse /quetes invalide (attendu: tableau)');
    }
    return data;
  },
);

export const validerQuete = createAsyncThunk('quetes/valider', async (id) => {
  return apiPatch(`/quetes/${id}`, {
    statut: 'fait',
    date_faite: new Date().toISOString().slice(0, 10),
  });
});

const questsSlice = createSlice({
  name: 'quetes',
  initialState: {
    items: [],
    statut: 'idle',
    erreur: null,
    /** Monotonic id so a slow stale fetch cannot overwrite a newer one. */
    lastRequestId: null,
  },
  reducers: {
    resetQuetes(state) {
      state.items = [];
      state.statut = 'idle';
      state.erreur = null;
      state.lastRequestId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuetes.pending, (state, action) => {
        state.lastRequestId = action.meta.requestId;
        state.erreur = null;
        // Keep existing items during refetch — clearing caused empty flash + race wipes
        if (!state.items.length) state.statut = 'chargement';
      })
      .addCase(fetchQuetes.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.lastRequestId) return;
        state.items = action.payload;
        state.statut = 'pret';
        state.erreur = null;
      })
      .addCase(fetchQuetes.rejected, (state, action) => {
        if (action.meta?.aborted) return;
        if (action.meta.requestId !== state.lastRequestId) return;
        state.statut = 'erreur';
        state.erreur = action.error.message;
        // Keep prior items on error so the card does not go blank
      })
      .addCase(validerQuete.fulfilled, (state, action) => {
        const i = state.items.findIndex((q) => q.id === action.payload.id);
        if (i >= 0) state.items[i] = action.payload;
      });
  },
});

export const { resetQuetes } = questsSlice.actions;
export default questsSlice.reducer;
