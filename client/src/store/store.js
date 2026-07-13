import { configureStore } from '@reduxjs/toolkit';
import arcsReducer from './slices/arcsSlice.js';
import questsReducer from './slices/questsSlice.js';

export const store = configureStore({
  reducer: {
    arcs: arcsReducer,
    quetes: questsReducer,
  },
});
