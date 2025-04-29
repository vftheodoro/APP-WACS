import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { getCurrentLocation, subscribeToLocationUpdates } from '../services/maps/locationService';
import { 
  getPlacesAutocomplete, 
  searchNearbyPlaces, 
  getPlaceDetails, 
  getDirections, 
  decodePolyline 
} from '../services/maps/placesService';

/**
 * Hook personalizado para gerenciar localização e interações com o mapa
 */
export const useMapLocation = () => {
  // Estados para localização
  const [currentLocation, setCurrentLocation] = useState(null);
  const [watchingLocation, setWatchingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
  // Estados para busca e lugares
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para rotas
  const [destination, setDestination] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [travelMode, setTravelMode] = useState('driving');
  const [showDirections, setShowDirections] = useState(false);
  
  // Refs
  const mapRef = useRef(null);
  const locationSubscription = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  // Novos estados
  const [isNavigating, setIsNavigating] = useState(false);
  const [nextManeuver, setNextManeuver] = useState(null);
  const [distanceToNext, setDistanceToNext] = useState(null);
  
  // Inicializa a localização atual
  useEffect(() => {
    initializeLocation();
    
    // Limpa a assinatura de localização quando o componente é desmontado
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  /**
   * Inicializa a localização atual e configura a observação de mudanças
   */
  const initializeLocation = async () => {
    try {
      setIsLoading(true);
      setLocationError(null);
      
      const location = await getCurrentLocation();
      
      if (location) {
        setCurrentLocation(location);
        startLocationUpdates();
      } else {
        setLocationError('Não foi possível obter sua localização');
      }
    } catch (error) {
      console.error('Erro ao inicializar localização:', error);
      setLocationError('Erro ao obter localização');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Inicia a observação de mudanças na localização
   */
  const startLocationUpdates = useCallback(() => {
    if (watchingLocation) return;
    
    try {
      locationSubscription.current = subscribeToLocationUpdates(
        (location) => {
          setCurrentLocation(location);
        },
        { timeInterval: 10000, distanceInterval: 10 }
      );
      
      setWatchingLocation(true);
    } catch (error) {
      console.error('Erro ao iniciar atualização de localização:', error);
    }
  }, [watchingLocation]);
  
  /**
   * Centraliza o mapa na localização atual
   */
  const centerOnUserLocation = useCallback(() => {
    if (!mapRef.current || !currentLocation) return;
    
    mapRef.current.animateToRegion({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005
    }, 500);
  }, [currentLocation]);
  
  /**
   * Realiza busca por lugares próximos
   */
  const searchPlaces = useCallback(async (query = searchQuery, resetSuggestions = true) => {
    if (!query || !currentLocation) return;
    
    try {
      setIsLoading(true);
      
      if (resetSuggestions) {
        setSearchSuggestions([]);
      }
      
      const places = await searchNearbyPlaces(currentLocation, query);
      setSearchResults(places);
      
      if (places.length > 0 && mapRef.current) {
        // Ajusta o zoom para mostrar todos os resultados
        const coordinates = places.map(place => ({
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        }));
        
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true
        });
      }
    } catch (error) {
      console.error('Erro na busca de lugares:', error);
      Alert.alert('Erro', 'Não foi possível buscar lugares. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation, searchQuery]);
  
  /**
   * Obtém sugestões de autocomplete para a busca
   */
  const getSearchSuggestions = useCallback((query) => {
    setSearchQuery(query);
    
    // Cancela o timeout anterior se existir
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      return;
    }
    
    // Define um timeout para evitar muitas requisições durante a digitação
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const suggestions = await getPlacesAutocomplete(query, currentLocation);
        setSearchSuggestions(suggestions);
      } catch (error) {
        console.error('Erro ao obter sugestões:', error);
      }
    }, 300);
  }, [currentLocation]);
  
  /**
   * Seleciona um lugar específico e obtém seus detalhes
   */
  const selectPlace = useCallback(async (place) => {
    try {
      setIsLoading(true);
      setSelectedPlace(place);
      
      // Se o place não tiver todas as informações, busca detalhes
      if (!place.formatted_phone_number || !place.opening_hours) {
        const details = await getPlaceDetails(place.place_id);
        setPlaceDetails(details);
      } else {
        setPlaceDetails(place);
      }
      
      // Centraliza o mapa no local selecionado
      if (mapRef.current) {
        const latitude = place.geometry.location.lat;
        const longitude = place.geometry.location.lng;
        
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao selecionar lugar:', error);
      Alert.alert('Erro', 'Não foi possível obter detalhes deste lugar.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Define um destino e calcula a rota até ele
   */
  const setDestinationAndCalculateRoute = useCallback(async (place, mode = travelMode) => {
    if (!currentLocation || !place) {
      console.error('Localização atual ou destino não disponível');
      return;
    }
    
    try {
      setIsLoading(true);
      setDestination(place);
      setTravelMode(mode);
      
      // Coordenadas do lugar selecionado
      const destCoords = {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng
      };
      
      console.log('Calculando rota de:', currentLocation, 'para:', destCoords);
      
      // Obtém direções
      const route = await getDirections(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        },
        destCoords,
        mode
      );
      
      if (route) {
        console.log('Rota calculada:', route);
        setRouteData(route);
        
        // Decodifica a polyline para obter as coordenadas da rota
        const polylineCoordinates = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(polylineCoordinates);
        
        // Ajusta o zoom para mostrar toda a rota
        if (mapRef.current && polylineCoordinates.length > 0) {
          const allCoordinates = [
            { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
            ...polylineCoordinates
          ];
          
          mapRef.current.fitToCoordinates(allCoordinates, {
            edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
            animated: true
          });
        }
      }
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      Alert.alert('Erro', 'Não foi possível calcular a rota até o destino.');
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation, travelMode]);
  
  /**
   * Inicia a navegação para o local selecionado
   */
  const startNavigation = async (destination) => {
    try {
      if (!currentLocation) {
        throw new Error('Localização atual não disponível');
      }

      const route = await getDirections(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        },
        {
          latitude: destination.latitude,
          longitude: destination.longitude
        },
        travelMode
      );

      if (route) {
        setRouteData(route);
        setIsNavigating(true);
        
        // Iniciar monitoramento de localização em tempo real
        const watchId = watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            if (location) {
              setCurrentLocation(location.coords);
              updateNavigationProgress(location.coords, route);
            }
          }
        );

        return () => {
          if (watchId) {
            watchId.remove();
          }
        };
      }
    } catch (error) {
      console.error('Erro ao iniciar navegação:', error);
      Alert.alert('Erro', 'Não foi possível iniciar a navegação');
    }
  };

  const updateNavigationProgress = (currentCoords, route) => {
    if (!route || !currentCoords) return;

    const steps = route.legs[0].steps;
    let currentStep = null;
    let minDistance = Infinity;

    // Encontrar o próximo passo baseado na distância atual
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const distance = calculateDistance(
        currentCoords.latitude,
        currentCoords.longitude,
        step.end_location.lat,
        step.end_location.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        currentStep = step;
      }
    }

    if (currentStep) {
      setNextManeuver(currentStep);
      setDistanceToNext(minDistance);

      // Notificar próximo passo se estiver próximo
      if (minDistance < 0.1) { // 100 metros
        showManeuverNotification(currentStep);
      }
    }
  };

  const showManeuverNotification = (step) => {
    if (Platform.OS === 'ios') {
      // Implementar notificações locais para iOS
      const notification = {
        title: 'Próxima manobra',
        body: step.html_instructions.replace(/<[^>]*>/g, ' '),
        data: { step },
      };
      // TODO: Implementar notificações locais
    } else {
      // Implementar notificações locais para Android
      // TODO: Implementar notificações locais
    }
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setNextManeuver(null);
    setDistanceToNext(null);
  };

  /**
   * Limpa a rota atual
   */
  const clearRoute = useCallback(() => {
    setDestination(null);
    setRouteData(null);
    setRouteCoordinates([]);
    setShowDirections(false);
  }, []);
  
  /**
   * Limpa a pesquisa atual
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchSuggestions([]);
    setSelectedPlace(null);
    setPlaceDetails(null);
    clearRoute();
  }, []);
  
  return {
    // Refs
    mapRef,
    
    // Estado da localização
    currentLocation,
    locationError,
    isLoading,
    
    // Estado da busca
    searchQuery,
    searchResults,
    searchSuggestions,
    selectedPlace,
    placeDetails,
    
    // Estado da rota
    destination,
    routeData,
    routeCoordinates,
    travelMode,
    showDirections,
    
    // Novos estados
    isNavigating,
    nextManeuver,
    distanceToNext,
    
    // Ações
    initializeLocation,
    centerOnUserLocation,
    searchPlaces,
    getSearchSuggestions,
    selectPlace,
    setDestinationAndCalculateRoute,
    startNavigation,
    stopNavigation,
    clearRoute,
    clearSearch,
    setTravelMode,
    setShowDirections
  };
}; 