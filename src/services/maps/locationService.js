import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

/**
 * Solicita permissão de localização e retorna a localização atual
 * @returns {Promise<object|null>} Objeto contendo as coordenadas ou null em caso de erro
 */
export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permissão negada',
        'Precisamos da sua permissão para mostrar sua localização no mapa.',
        [
          { text: 'OK' },
          { 
            text: 'Abrir configurações', 
            onPress: () => openLocationSettings() 
          }
        ]
      );
      return null;
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      maximumAge: 10000
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp
    };
  } catch (error) {
    console.error('Erro ao obter localização:', error);
    return null;
  }
};

/**
 * Abre as configurações do sistema para o usuário habilitar a localização
 */
export const openLocationSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
};

/**
 * Assina atualizações de localização em tempo real
 * @param {Function} callback Função a ser chamada quando a localização mudar
 * @param {object} options Opções para o rastreamento de localização
 * @returns {Function} Função para cancelar a assinatura
 */
export const subscribeToLocationUpdates = (callback, options = {}) => {
  const defaultOptions = {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 5000,  // 5 segundos
    distanceInterval: 10, // 10 metros
    ...options
  };

  const subscription = Location.watchPositionAsync(
    defaultOptions,
    (location) => {
      callback({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
        timestamp: location.timestamp
      });
    }
  );

  // Retorna uma função para cancelar a assinatura
  return async () => {
    const locationSubscription = await subscription;
    if (locationSubscription) {
      locationSubscription.remove();
    }
  };
};

/**
 * Calcula a distância entre dois pontos em km
 * @param {number} lat1 Latitude do ponto 1
 * @param {number} lon1 Longitude do ponto 1
 * @param {number} lat2 Latitude do ponto 2
 * @param {number} lon2 Longitude do ponto 2
 * @returns {number} Distância em km
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distância em km
}; 