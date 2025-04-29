import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Location from 'expo-location';
import {
  setCurrentLocation,
  setError,
  clearError,
} from '../store/slices/locationSlice';

export const useLocation = () => {
  const dispatch = useDispatch();
  const { currentLocation, isTracking } = useSelector((state) => state.location);

  useEffect(() => {
    let subscription;

    const startLocationUpdates = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          dispatch(setError('Permissão de localização negada'));
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 10,
          },
          (location) => {
            dispatch(setCurrentLocation(location));
            dispatch(clearError());
          }
        );
      } catch (error) {
        dispatch(setError(error.message));
      }
    };

    if (isTracking) {
      startLocationUpdates();
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isTracking, dispatch]);

  return {
    currentLocation,
    isTracking,
  };
}; 