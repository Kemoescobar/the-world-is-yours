import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet } from '../../lib/api.js';

export const fetchArcs = createAsyncThunk('arcs/fetch', async () => {
  return apiGet('/arcs', { auth: false });
});

const arcsSlice = createSlice({
  name: 'arcs',
  initialState: { items: [], statut: 'idle', erreur: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchArcs.pending, (state) => { state.statut = 'chargement'; })
      .addCase(fetchArcs.fulfilled, (state, action) => {
        state.items = action.payload;
        state.statut = 'pret';
      })
      .addCase(fetchArcs.rejected, (state, action) => {
        state.statut = 'erreur';
        state.erreur = action.error.message;
      });
  },
});

export default arcsSlice.reducer;
