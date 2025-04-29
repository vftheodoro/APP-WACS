import { decode } from '@mapbox/polyline';
import { MAPBOX_ACCESS_TOKEN } from '../../config/constants';

export const getRoute = async (origin, destination) => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?geometries=polyline&access_token=${MAPBOX_ACCESS_TOKEN}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao calcular rota');
    }

    const coordinates = decode(data.routes[0].geometry);
    const distance = data.routes[0].distance;
    const duration = data.routes[0].duration;
    const steps = data.routes[0].legs[0].steps;

    return {
      coordinates,
      distance,
      duration,
      steps,
    };
  } catch (error) {
    throw new Error(`Erro ao calcular rota: ${error.message}`);
  }
};

export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}; 