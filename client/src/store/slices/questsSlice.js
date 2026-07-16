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
  {
    // Always hit the network when dispatched — never reuse a fulfilled cache as “fresh”.
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
  initialState: { items: [], statut: 'idle', erreur: null },
  reducers: {
    resetQuetes(state) {
      state.items = [];
      state.statut = 'idle';
      state.erreur = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuetes.pending, (state) => {
        state.statut = 'chargement';
        state.erreur = null;
        // Clear leftovers so UI never shows invented/stale Chroniques while refetching
        state.items = [];
      })
      .addCase(fetchQuetes.fulfilled, (state, action) => {
        state.items = action.payload;
        state.statut = 'pret';
        state.erreur = null;
      })
      .addCase(fetchQuetes.rejected, (state, action) => {
        // Abort from effect cleanup / StrictMode — keep prior state, no fake empty
        if (action.meta?.aborted) return;
        state.statut = 'erreur';
        state.erreur = action.error.message;
        state.items = [];
      })
      .addCase(validerQuete.fulfilled, (state, action) => {
        const i = state.items.findIndex((q) => q.id === action.payload.id);
        if (i >= 0) state.items[i] = action.payload;
      });
  },
});

export const { resetQuetes } = questsSlice.actions;
export default questsSlice.reducer;
