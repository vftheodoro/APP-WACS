import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar,
  Platform, 
  Dimensions,
  Keyboard,
  Modal
} from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Custom hooks e serviços
import { useMapLocation } from '../hooks/useMapLocation';
import { useTheme } from '../contexts/ThemeContext';

// Componentes
import SearchBar from '../components/maps/SearchBar';
import PlaceMarker from '../components/maps/PlaceMarker';
import RouteInfo, { DirectionsList } from '../components/maps/RouteInfo';
import PlaceDetails from '../components/maps/PlaceDetails';
import SearchSuggestions from '../components/maps/SearchSuggestions';
import NavigationScreen from '../components/maps/NavigationScreen';
import TravelModeSelector from '../components/maps/TravelModeSelector';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Constantes
const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Mapa em modo escuro
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
];

// Chave para armazenar buscas recentes no AsyncStorage
const RECENT_SEARCHES_KEY = 'wacs_recent_searches';

export const MapScreen = () => {
  // Estados da UI
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showPlaceDetails, setShowPlaceDetails] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showFullScreenNav, setShowFullScreenNav] = useState(false);
  
  // Context e hooks
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const mapLocation = useMapLocation();
  
  const {
    // Refs
    mapRef,
    
    // Estados principais
    currentLocation,
    searchQuery,
    searchResults,
    searchSuggestions,
    selectedPlace,
    placeDetails,
    destination,
    routeData,
    routeCoordinates,
    travelMode,
    showDirections,
    isLoading,
    isNavigating,
    nextManeuver,
    distanceToNext,
    
    // Ações
    centerOnUserLocation,
    initializeLocation,
    searchPlaces,
    getSearchSuggestions,
    selectPlace,
    setDestinationAndCalculateRoute,
    startNavigation,
    clearRoute,
    clearSearch,
    setTravelMode,
    setShowDirections,
    stopNavigation,
  } = mapLocation;
  
  // Carregar buscas recentes do AsyncStorage ao iniciar
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Salvar uma nova busca recente
  const saveRecentSearch = async (search) => {
    try {
      // Não salvar resultados vazios
      if (!search || !search.description) return;
      
      // Obter buscas atuais
      const current = [...recentSearches];
      
      // Verificar se já existe para evitar duplicatas
      const existingIndex = current.findIndex(item => 
        item.description === search.description || 
        item.place_id === search.place_id
      );
      
      // Se já existe, remover a antiga
      if (existingIndex >= 0) {
        current.splice(existingIndex, 1);
      }
      
      // Adicionar a nova busca no início
      const updated = [search, ...current].slice(0, 5); // Manter apenas 5 resultados
      
      // Atualizar estado
      setRecentSearches(updated);
      
      // Salvar no AsyncStorage
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Erro ao salvar busca recente:', error);
    }
  };
  
  // Carregar buscas recentes
  const loadRecentSearches = async () => {
    try {
      const storedSearches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (storedSearches) {
        setRecentSearches(JSON.parse(storedSearches));
      }
    } catch (error) {
      console.error('Erro ao carregar buscas recentes:', error);
    }
  };
  
  // Limpar buscas recentes
  const clearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (error) {
      console.error('Erro ao limpar buscas recentes:', error);
    }
  };
  
  // Lidar com a seleção de sugestão
  const handleSuggestionSelect = useCallback(async (suggestion) => {
    // Fechar o teclado
    Keyboard.dismiss();
    setIsSuggestionsVisible(false);
    
    // Salvar como busca recente
    saveRecentSearch(suggestion);
    
    // Buscar lugares relacionados à sugestão
    await searchPlaces(suggestion.description);
  }, [searchPlaces]);

  // Obter direções para um lugar
  const handleGetDirections = useCallback((place) => {
    setShowPlaceDetails(false);
    setDestinationAndCalculateRoute(place);
  }, [setDestinationAndCalculateRoute]);
  
  // Manipular o pressionamento de um marcador no mapa
  const handleMarkerPress = useCallback((place) => {
    selectPlace(place);
    setShowPlaceDetails(true);
  }, [selectPlace]);
  
  // Lidar com focus no campo de busca
  const handleSearchFocus = useCallback(() => {
    setIsSuggestionsVisible(true);
    setIsSearchExpanded(true);
  }, []);
  
  // Lidar com o blur do campo de busca
  const handleSearchBlur = useCallback(() => {
    // Mantenha sugestões visíveis se houver sugestões ativas
    if (searchSuggestions.length === 0) {
      setIsSuggestionsVisible(false);
    }
    
    setIsSearchExpanded(false);
  }, [searchSuggestions]);

  const handleStartNavigation = async () => {
    if (destination) {
      await startNavigation({
        latitude: destination.geometry.location.lat,
        longitude: destination.geometry.location.lng,
      });
      setShowFullScreenNav(true);
    }
  };

  const handleStopNavigation = () => {
    stopNavigation();
    setShowFullScreenNav(false);
  };

  if (!currentLocation) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent" 
        translucent 
      />
      
      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        showsTraffic={false}
        customMapStyle={isDark ? darkMapStyle : []}
        onPress={() => {
          setIsSuggestionsVisible(false);
          Keyboard.dismiss();
        }}
      >
        {/* Marcador da localização atual (opcional, já que showsUserLocation é true) */}
        {currentLocation && (
          <PlaceMarker
            place={currentLocation}
            isUserLocation={true}
          />
        )}
        
        {/* Marcadores de lugares encontrados */}
        {searchResults.map((place) => (
          <PlaceMarker
            key={place.place_id}
            place={place}
            isSelected={selectedPlace && selectedPlace.place_id === place.place_id}
            isDestination={destination && destination.place_id === place.place_id}
            onPress={handleMarkerPress}
          />
        ))}
        
        {/* Marcador do destino selecionado */}
        {destination && (
          <PlaceMarker
            place={destination}
            isPrimaryDestination={true}
            isSelected={selectedPlace && selectedPlace.place_id === destination.place_id}
            onPress={handleMarkerPress}
          />
        )}
        
        {/* Rota (polyline) */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={5}
            strokeColor={isDark ? '#0A84FF' : '#007AFF'}
            lineDashPattern={[0]}
          />
        )}
      </MapView>

      {/* Barra de pesquisa */}
      <View style={[styles.topContainer, { paddingTop: insets.top }]}>
        <SearchBar
          value={searchQuery}
          onChangeText={getSearchSuggestions}
          onSubmit={searchPlaces}
          onClear={clearSearch}
          loading={isLoading}
          expanded={isSearchExpanded}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
        />
      </View>
      
      {/* Sugestões de busca */}
      <SearchSuggestions
        suggestions={searchSuggestions}
        onSuggestionPress={handleSuggestionSelect}
        visible={isSuggestionsVisible}
        recentSearches={recentSearches}
        onRecentSearchPress={handleSuggestionSelect}
        onClearRecentSearches={clearRecentSearches}
      />
      
      {/* Botões flutuantes */}
      <View style={[styles.floatingButtons, { bottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.floatingButton,
            isDark ? styles.floatingButtonDark : null
          ]}
          onPress={centerOnUserLocation}
          accessibilityLabel="Centralizar no mapa"
        >
          <Ionicons
            name="locate"
            size={24}
            color={isDark ? '#fff' : '#333'}
          />
        </TouchableOpacity>
      </View>
      
      {/* Informações de rota */}
      {routeData && (
        <View style={[
          styles.routeInfoContainer, 
          { bottom: insets.bottom }
        ]}>
          <RouteInfo
            routeData={routeData}
            onStartNavigation={handleStartNavigation}
            onShowDirections={() => setShowDirections(true)}
            onClose={clearRoute}
            onChangeTravelMode={setTravelMode}
            travelMode={travelMode}
          />
        </View>
      )}
      
      {/* Modal de detalhes do lugar */}
      <Modal
        visible={showPlaceDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlaceDetails(false)}
      >
        <View style={styles.modalContainer}>
          <PlaceDetails
            place={selectedPlace}
            onClose={() => setShowPlaceDetails(false)}
            onGetDirections={handleGetDirections}
          />
        </View>
      </Modal>
      
      {/* Modal de lista de direções */}
      {showDirections && routeData && (
        <DirectionsList
          steps={routeData.legs[0].steps}
          onClose={() => setShowDirections(false)}
        />
      )}

      {destination && !isNavigating && (
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={handleStartNavigation}
        >
          <Ionicons name="navigate" size={24} color="white" />
        </TouchableOpacity>
      )}

      {showFullScreenNav && (
        <NavigationScreen
          routeData={routeData}
          currentLocation={currentLocation}
          nextManeuver={nextManeuver}
          distanceToNext={distanceToNext}
          travelMode={travelMode}
          onClose={handleStopNavigation}
        />
      )}

      <TravelModeSelector
        selectedMode={travelMode}
        onSelectMode={setTravelMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingContainerDark: {
    backgroundColor: '#000',
  },
  floatingButtons: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  floatingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 8,
  },
  floatingButtonDark: {
    backgroundColor: '#333',
  },
  routeInfoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  navigateButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2196F3',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default MapScreen; 