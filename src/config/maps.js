import Constants from 'expo-constants';

/**
 * Chave de API do Google Maps, obtida das variáveis de ambiente
 */
export const GOOGLE_MAPS_API_KEY = Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY;

/**
 * Configurações padrão para o mapa
 */
export const MAP_CONFIG = {
  // Valores de zoom
  ZOOM_LEVELS: {
    CITY: 0.05,      // Zoom para ver a cidade
    NEIGHBORHOOD: 0.01, // Zoom para ver o bairro
    STREET: 0.005,   // Zoom para ver a rua
    BUILDING: 0.001  // Zoom para ver o edifício
  },
  
  // Configurações da rota
  ROUTE_CONFIG: {
    LINE_COLOR: '#007AFF',
    LINE_WIDTH: 5,
    DARK_LINE_COLOR: '#0A84FF',
  },
  
  // Cores para os marcadores
  MARKER_COLORS: {
    USER_LOCATION: '#007AFF',
    SELECTED_PLACE: '#007AFF',
    DESTINATION: '#FF9500',
    PRIMARY_DESTINATION: '#FF3B30',
    DEFAULT_PLACE: '#34C759'
  }
};

/**
 * Status de retorno da API do Google Maps
 */
export const API_STATUS = {
  OK: 'OK',
  ZERO_RESULTS: 'ZERO_RESULTS',
  OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
  REQUEST_DENIED: 'REQUEST_DENIED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Tipos de transportes disponíveis para rotas
 */
export const TRAVEL_MODES = {
  DRIVING: 'driving',
  WALKING: 'walking',
  BICYCLING: 'bicycling',
  TRANSIT: 'transit'
}; 