import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet } from '../../lib/api.js';

export const fetchArcs = createAsyncThunk('arcs/fetch', async () => {
  const data = await apiGet('/arcs', { auth: false });
  if (!Array.isArray(data)) {
    throw new Error('réponse /arcs invalide (attendu: tableau)');
  }
  return data;
});

const arcsSlice = createSlice({
  name: 'arcs',
  initialState: { items: [], statut: 'idle', erreur: null },
  reducers: {
    resetArcs(state) {
      state.items = [];
      state.statut = 'idle';
      state.erreur = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchArcs.pending, (state) => {
        state.statut = 'chargement';
        state.erreur = null;
        state.items = [];
      })
      .addCase(fetchArcs.fulfilled, (state, action) => {
        state.items = action.payload;
        state.statut = 'pret';
        state.erreur = null;
      })
      .addCase(fetchArcs.rejected, (state, action) => {
        if (action.meta?.aborted) return;
        state.statut = 'erreur';
        state.erreur = action.error.message;
        state.items = [];
      });
  },
});

export const { resetArcs } = arcsSlice.actions;
export default arcsSlice.reducer;