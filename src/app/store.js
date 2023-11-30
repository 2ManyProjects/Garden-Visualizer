import { configureStore } from '@reduxjs/toolkit';
import gardenReducer from '../redux/gardenSlice';

export const store = configureStore({
  reducer: {
    garden: gardenReducer,
  },
});

export default store;