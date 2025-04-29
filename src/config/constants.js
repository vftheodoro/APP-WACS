export const MAPBOX_ACCESS_TOKEN = 'YOUR_MAPBOX_ACCESS_TOKEN';

export const MAP_STYLE = {
  light: 'mapbox://styles/mapbox/light-v10',
  dark: 'mapbox://styles/mapbox/dark-v10',
};

export const INITIAL_REGION = {
  latitude: -23.5505,
  longitude: -46.6333,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export const NAVIGATION_OPTIONS = {
  enableHighAccuracy: true,
  timeInterval: 1000,
  distanceInterval: 10,
};

export const ERROR_MESSAGES = {
  LOCATION_PERMISSION_DENIED: 'Permissão de localização negada',
  LOCATION_UNAVAILABLE: 'Serviço de localização indisponível',
  ROUTE_CALCULATION_FAILED: 'Erro ao calcular rota',
  NETWORK_ERROR: 'Erro de conexão',
};

export const SCREEN_NAMES = {
  HOME: 'Home',
  MAP: 'Map',
  NAVIGATION: 'Navigation',
  SETTINGS: 'Settings',
};

export const THEME = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    text: '#000000',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    body: {
      fontSize: 16,
    },
    caption: {
      fontSize: 12,
    },
  },
}; 