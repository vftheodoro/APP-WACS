import { configureStore } from '@reduxjs/toolkit';
import locationReducer from './slices/locationSlice';
import navigationReducer from './slices/navigationSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    location: locationReducer,
    navigation: navigationReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 