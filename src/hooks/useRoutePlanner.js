import { useState } from 'react';
import Constants from 'expo-constants';
import { decodePolyline } from '../utils/mapUtils';

const GOOGLE_MAPS_APIKEY = Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY;

export default function useRoutePlanner() {
  const [routeCoords, setRouteCoords] = useState([]);
  const [steps, setSteps] = useState([]);
  const [info, setInfo] = useState({ distance: '', duration: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestRoute = async (origin, destination, mode = 'walking') => {
    setLoading(true);
    setError(null);
    setRouteCoords([]);
    setSteps([]);
    setInfo({ distance: '', duration: '' });
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=${mode}&key=${GOOGLE_MAPS_APIKEY}&language=pt-BR`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.error_message) throw new Error(data.error_message);
      if (data.routes && data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoords(points);
        const leg = data.routes[0].legs[0];
        setInfo({
          distance: leg.distance.text,
          duration: leg.duration.text,
        });
        const stepList = leg.steps.map(step => ({
          distance: step.distance.text,
          duration: step.duration.text,
          instruction: step.html_instructions.replace(/<[^>]+>/g, ''),
          startLocation: step.start_location,
          endLocation: step.end_location,
          maneuver: step.maneuver || '',
          polyline: decodePolyline(step.polyline.points)
        }));
        setSteps(stepList);
      } else {
        setError('Rota não encontrada.');
      }
    } catch (e) {
      setError(e.message || 'Erro ao buscar rota.');
    }
    setLoading(false);
  };

  const resetRoute = () => {
    setRouteCoords([]);
    setSteps([]);
    setInfo({ distance: '', duration: '' });
    setError(null);
    setLoading(false);
  };

  return {
    requestRoute,
    routeCoords,
    steps,
    info,
    loading,
    error,
    resetRoute,
  };
} 