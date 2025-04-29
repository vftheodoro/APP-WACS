import Constants from 'expo-constants';

// Pegando a chave da API do Google Maps a partir das variáveis de ambiente
const API_KEY = Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY;
const BASE_URL = 'https://maps.googleapis.com/maps/api/';

// Tipos de estabelecimentos para busca
export const PLACE_TYPES = {
  RESTAURANT: 'restaurant',
  CAFE: 'cafe',
  BAR: 'bar',
  STORE: 'store',
  SUPERMARKET: 'supermarket',
  SHOPPING_MALL: 'shopping_mall',
  PHARMACY: 'pharmacy',
  HOSPITAL: 'hospital',
  BANK: 'bank',
  ATM: 'atm',
  GAS_STATION: 'gas_station',
  PARKING: 'parking',
  TOURIST_ATTRACTION: 'tourist_attraction',
  PARK: 'park',
  MUSEUM: 'museum',
  MOVIE_THEATER: 'movie_theater',
  BAKERY: 'bakery',
  LODGING: 'lodging',
};

/**
 * Busca lugares próximos a uma localização
 * @param {object} location Objeto contendo latitude e longitude
 * @param {string} keyword Palavras-chave para busca
 * @param {string} type Tipo de estabelecimento (opcional)
 * @param {number} radius Raio de busca em metros (padrão: 1500)
 * @returns {Promise<Array>} Lista de lugares encontrados
 */
export const searchNearbyPlaces = async (location, keyword = '', type = '', radius = 1500) => {
  try {
    const endpoint = 'place/nearbysearch/json';
    const url = `${BASE_URL}${endpoint}?location=${location.latitude},${location.longitude}&radius=${radius}&key=${API_KEY}`;
    
    // Adiciona keyword se fornecida
    const finalUrl = keyword 
      ? `${url}&keyword=${encodeURIComponent(keyword)}` 
      : url;
    
    // Adiciona type se fornecido
    const urlWithType = type 
      ? `${finalUrl}&type=${type}` 
      : finalUrl;
    
    const response = await fetch(urlWithType);
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Erro na API do Google Places:', data.status, data.error_message);
      throw new Error(data.error_message || 'Erro ao buscar lugares');
    }
    
    return data.results || [];
  } catch (error) {
    console.error('Erro ao buscar lugares próximos:', error);
    throw error;
  }
};

/**
 * Busca sugestões de lugares baseado em texto
 * @param {string} query Texto para busca
 * @param {object} location Objeto contendo latitude e longitude para priorizar resultados próximos
 * @returns {Promise<Array>} Lista de sugestões
 */
export const getPlacesAutocomplete = async (query, location) => {
  try {
    if (!query || query.length < 2) return [];
    
    const endpoint = 'place/autocomplete/json';
    const locationParam = location 
      ? `&location=${location.latitude},${location.longitude}&radius=50000` 
      : '';
    
    const url = `${BASE_URL}${endpoint}?input=${encodeURIComponent(query)}${locationParam}&language=pt-BR&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Erro na API de autocomplete:', data.status, data.error_message);
      return [];
    }
    
    return data.predictions || [];
  } catch (error) {
    console.error('Erro no autocomplete:', error);
    return [];
  }
};

/**
 * Obtém detalhes de um lugar pelo ID
 * @param {string} placeId ID do lugar
 * @returns {Promise<object>} Detalhes completos do lugar
 */
export const getPlaceDetails = async (placeId) => {
  try {
    const endpoint = 'place/details/json';
    const url = `${BASE_URL}${endpoint}?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,geometry,photos,rating,user_ratings_total,opening_hours,website,price_level,reviews,types,place_id,url&language=pt-BR&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error('Erro ao obter detalhes do lugar:', data.status, data.error_message);
      throw new Error(data.error_message || 'Erro ao buscar detalhes do lugar');
    }
    
    return data.result;
  } catch (error) {
    console.error('Erro ao buscar detalhes do lugar:', error);
    throw error;
  }
};

/**
 * Obtém URL da foto de um lugar
 * @param {string} photoReference Referência da foto do Google
 * @param {number} maxWidth Largura máxima da foto
 * @returns {string} URL da imagem
 */
export const getPlacePhotoUrl = (photoReference, maxWidth = 400) => {
  if (!photoReference) return null;
  return `${BASE_URL}place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${API_KEY}`;
};

/**
 * Obtém uma rota entre origem e destino
 * @param {object} origin Objeto contendo latitude e longitude
 * @param {object} destination Objeto contendo latitude e longitude ou place_id
 * @param {string} mode Modo de transporte (driving, walking, bicycling, transit)
 * @returns {Promise<object>} Detalhes da rota
 */
export const getDirections = async (origin, destination, mode = 'driving') => {
  try {
    const endpoint = 'directions/json';
    
    // Formatando as coordenadas corretamente
    const originParam = origin.place_id
      ? `place_id:${origin.place_id}`
      : `${origin.latitude},${origin.longitude}`;
    
    const destinationParam = destination.place_id
      ? `place_id:${destination.place_id}`
      : `${destination.latitude},${destination.longitude}`;
    
    const url = `${BASE_URL}${endpoint}?origin=${originParam}&destination=${destinationParam}&mode=${mode}&language=pt-BR&key=${API_KEY}`;
    
    console.log('URL da rota:', url); // Para debug
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error('Erro ao obter direções:', data.status, data.error_message);
      throw new Error(data.error_message || 'Erro ao buscar rota');
    }
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('Nenhuma rota encontrada');
    }
    
    const route = data.routes[0];
    
    // Verificando se a rota tem as informações necessárias
    if (!route.legs || route.legs.length === 0) {
      throw new Error('Rota sem informações de percurso');
    }
    
    return route;
  } catch (error) {
    console.error('Erro ao buscar direções:', error);
    throw error;
  }
};

/**
 * Decodifica uma polyline no formato Google Maps
 * @param {string} encoded String codificada da polyline
 * @returns {Array} Array de coordenadas {latitude, longitude}
 */
export const decodePolyline = (encoded) => {
  if (!encoded) return [];
  
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5
    });
  }
  
  return points;
}; 