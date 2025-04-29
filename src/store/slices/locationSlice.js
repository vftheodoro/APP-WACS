import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentLocation: null,
  destination: null,
  route: null,
  isTracking: false,
  error: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
    },
    setDestination: (state, action) => {
      state.destination = action.payload;
    },
    setRoute: (state, action) => {
      state.route = action.payload;
    },
    startTracking: (state) => {
      state.isTracking = true;
    },
    stopTracking: (state) => {
      state.isTracking = false;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setCurrentLocation,
  setDestination,
  setRoute,
  startTracking,
  stopTracking,
  setError,
  clearError,
} = locationSlice.actions;

export default locationSlice.reducer; 