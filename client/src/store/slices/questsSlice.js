import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPatch } from '../../lib/api.js';

export const fetchQuetes = createAsyncThunk('quetes/fetch', async (filtres = {}) => {
  const params = new URLSearchParams(filtres);
  const q = params.toString();
  return apiGet(`/quetes${q ? `?${q}` : ''}`);
});

export const validerQuete = createAsyncThunk('quetes/valider', async (id) => {
  return apiPatch(`/quetes/${id}`, {
    statut: 'fait',
    date_faite: new Date().toISOString().slice(0, 10),
  });
});

const questsSlice = createSlice({
  name: 'quetes',
  initialState: { items: [], statut: 'idle', erreur: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuetes.pending, (state) => { state.statut = 'chargement'; state.erreur = null; })
      .addCase(fetchQuetes.fulfilled, (state, action) => { state.items = action.payload; state.statut = 'pret'; })
      .addCase(fetchQuetes.rejected, (state, action) => { state.statut = 'erreur'; state.erreur = action.error.message; })
      .addCase(validerQuete.fulfilled, (state, action) => {
        const i = state.items.findIndex((q) => q.id === action.payload.id);
        if (i >= 0) state.items[i] = action.payload;
      });
  },
});

export default questsSlice.reducer;
