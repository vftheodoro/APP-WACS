import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Text, 
  Alert, 
  TouchableOpacity, 
  TextInput,
  Platform,
  ActivityIndicator,
  FlatList,
  Modal,
  Animated,
  Linking,
  StatusBar,
  Image
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { GOOGLE_MAPS_API_KEY } from '../config/maps';
import { useTheme } from '../contexts/ThemeContext';

const SearchBar = ({ value, onChangeText, onClear, onSubmit, loading }) => {
  const { isDark } = useTheme();
  
  return (
    <View style={[
      styles.searchBarContainer,
      isDark && styles.searchBarContainerDark
    ]}>
      <View style={[
        styles.searchInputContainer,
        isDark && styles.searchInputContainerDark
      ]}>
        <Ionicons 
          name="search" 
          size={20} 
          color={isDark ? '#fff' : '#666'} 
          style={styles.searchIcon} 
        />
        <TextInput
          style={[
            styles.searchInput,
            isDark && styles.searchInputDark
          ]}
          placeholder="Para onde você quer ir?"
          placeholderTextColor={isDark ? '#aaa' : '#666'}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Campo de busca de lugares"
          accessibilityHint="Digite para buscar lugares próximos"
        />
        {loading ? (
          <ActivityIndicator size="small" color={isDark ? '#fff' : '#666'} />
        ) : value ? (
          <TouchableOpacity 
            onPress={onClear}
            accessibilityLabel="Limpar busca"
          >
            <Ionicons 
              name="close-circle" 
              size={20} 
              color={isDark ? '#fff' : '#666'} 
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const LocationMarker = React.memo(({ 
  place, 
  onSelect, 
  isSelected,
  isDestination
}) => {
  const { isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected]);

  const getMarkerIcon = () => {
    if (isDestination) {
      return <MaterialIcons name="place" size={24} color="#FF3B30" />;
    }
    return <MaterialIcons name="location-on" size={24} color="#007AFF" />;
  };

  return (
    <Marker
      coordinate={{
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      }}
      title={place.name}
      description={place.formatted_address}
      onPress={() => onSelect(place)}
    >
      <Animated.View style={[
        styles.markerContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        {getMarkerIcon()}
      </Animated.View>
      <Callout onPress={() => onSelect(place)}>
        <View style={[
          styles.calloutContainer,
          isDark && styles.calloutContainerDark
        ]}>
          <Text style={[
            styles.calloutTitle,
            isDark && styles.calloutTitleDark
          ]}>
            {place.name}
          </Text>
          <Text style={[
            styles.calloutDescription,
            isDark && styles.calloutDescriptionDark
          ]}>
            {place.formatted_address}
          </Text>
        </View>
      </Callout>
    </Marker>
  );
});

const RouteInfo = ({ distance, duration, onStartNavigation, onClose, onShowDirections }) => {
  const { isDark } = useTheme();
  
  return (
    <View style={[
      styles.routeInfoContainer,
      isDark && styles.routeInfoContainerDark
    ]}>
      <View style={styles.routeInfoHeader}>
        <View>
          <Text style={[
            styles.routeInfoTitle,
            isDark && styles.routeInfoTitleDark
          ]}>
            Tempo estimado
          </Text>
          <Text style={[
            styles.routeInfoDuration,
            isDark && styles.routeInfoDurationDark
          ]}>
            {duration}
          </Text>
          <Text style={[
            styles.routeInfoDistance,
            isDark && styles.routeInfoDistanceDark
          ]}>
            {distance}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={onClose}
          accessibilityLabel="Fechar informações da rota"
        >
          <Ionicons 
            name="close" 
            size={24} 
            color={isDark ? '#fff' : '#666'} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.routeActions}>
        <TouchableOpacity 
          style={[
            styles.startNavButton,
            isDark && styles.startNavButtonDark
          ]}
          onPress={onStartNavigation}
          accessibilityLabel="Iniciar navegação"
        >
          <Ionicons name="navigate" size={24} color="white" />
          <Text style={styles.startNavButtonText}>Iniciar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.showDirectionsButton,
            isDark && styles.showDirectionsButtonDark
          ]}
          onPress={onShowDirections}
          accessibilityLabel="Ver instruções"
        >
          <Ionicons name="list" size={24} color="white" />
          <Text style={styles.showDirectionsButtonText}>Direções</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DirectionsList = ({ steps, onClose }) => {
  const { isDark } = useTheme();
  
  return (
    <View style={[
      styles.directionsContainer,
      isDark && styles.directionsContainerDark
    ]}>
      <View style={styles.directionsHeader}>
        <Text style={[
          styles.directionsTitle,
          isDark && styles.directionsTitleDark
        ]}>
          Instruções de navegação
        </Text>
        <TouchableOpacity 
          onPress={onClose}
          accessibilityLabel="Fechar instruções"
        >
          <Ionicons 
            name="close" 
            size={24} 
            color={isDark ? '#fff' : '#666'} 
          />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={steps}
        keyExtractor={(_, index) => `step-${index}`}
        renderItem={({ item }) => (
          <View style={styles.directionItem}>
            <View style={styles.directionIconContainer}>
              <Ionicons 
                name={item.icon} 
                size={24} 
                color={isDark ? '#fff' : '#666'} 
              />
            </View>
            <View style={styles.directionTextContainer}>
              <Text style={styles.directionText}>{item.instruction}</Text>
              {item.distance && (
                <Text style={styles.directionDistance}>{item.distance}</Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
};

const SearchSuggestions = ({ data, onPress, visible }) => {
  if (!visible || !data.length) return null;
  
  return (
    <View style={[
      styles.suggestionsContainer,
      styles.suggestionsContainerDark
    ]}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.place_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.suggestionItem,
              styles.suggestionItemDark
            ]}
            onPress={() => onPress(item)}
            accessibilityLabel={`Sugestão: ${item.name}`}
          >
            <Ionicons 
              name="location" 
              size={16} 
              color={isDark ? '#fff' : '#666'} 
              style={styles.suggestionIcon} 
            />
            <View style={styles.suggestionTextContainer}>
              <Text style={[
                styles.suggestionPrimaryText,
                styles.suggestionPrimaryTextDark
              ]}>
                {item.structured_formatting?.main_text || item.name}
              </Text>
              <Text style={[
                styles.suggestionSecondaryText,
                styles.suggestionSecondaryTextDark
              ]}>
                {item.structured_formatting?.secondary_text || item.formatted_address}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export const MapScreen = () => {
  const { isDark } = useTheme();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: -23.550520,
    longitude: -46.633308,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [route, setRoute] = useState(null);
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructions, setInstructions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchTimeout = useRef(null);
  const mapRef = useRef(null);
  const [destinations, setDestinations] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [currentRoute, setCurrentRoute] = useState(null);

  const requestLocationPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        setLocation(location);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setErrorMsg(null);
      } else {
        setErrorMsg('Permissão para acessar localização foi negada');
      }
    } catch (error) {
      setErrorMsg('Erro ao obter localização');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    requestLocationPermission();
  }, [requestLocationPermission]);

  const getRouteInstructions = useCallback((steps) => {
    return steps.map(step => {
      let icon = 'arrow-forward';
      
      if (step.maneuver.includes('turn-left')) {
        icon = 'arrow-back';
      } else if (step.maneuver.includes('turn-right')) {
        icon = 'arrow-forward';
      } else if (step.maneuver.includes('straight')) {
        icon = 'arrow-up';
      } else if (step.maneuver.includes('merge')) {
        icon = 'git-merge';
      } else if (step.maneuver.includes('fork')) {
        icon = 'git-branch';
      }
      
      return {
        text: step.html_instructions.replace(/<[^>]*>/g, ''),
        icon,
        distance: step.distance.text
      };
    });
  }, []);

  const calculateRouteWithWaypoints = useCallback(async (origin, destinations) => {
    try {
      setIsLoading(true);
      
      // Constrói a URL com waypoints
      const waypointsStr = destinations
        .slice(0, -1)
        .map(dest => `${dest.geometry.location.lat},${dest.geometry.location.lng}`)
        .join('|');
      
      const destination = destinations[destinations.length - 1];
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.geometry.location.lat},${destination.geometry.location.lng}&waypoints=${waypointsStr}&mode=driving&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const points = route.overview_polyline.points;
        const decodedPoints = decodePolyline(points);
        
        const routeInfo = {
          points: decodedPoints,
          distance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0),
          duration: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0),
          destinations: destinations.map(dest => ({
            name: dest.name,
            latitude: dest.geometry.location.lat,
            longitude: dest.geometry.location.lng
          }))
        };
        
        setCurrentRoute(routeInfo);
        setShowRouteInfo(true);
        
        const steps = route.legs.flatMap(leg => leg.steps);
        const routeInstructions = getRouteInstructions(steps);
        setInstructions(routeInstructions);
        
        mapRef.current.fitToCoordinates(decodedPoints, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true
        });
      }
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      Alert.alert('Erro', 'Não foi possível calcular a rota. Verifique sua conexão com a internet.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchPlaces = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSuggestions([]);
      return;
    }

    try {
      setIsSearching(true);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          query
        )}&key=${GOOGLE_MAPS_API_KEY}&language=pt-BR&location=${region.latitude},${region.longitude}&radius=50000`
      );
      
      const data = await response.json();
      
      if (data.results) {
        setSearchResults(data.results);
        
        if (data.results.length > 0) {
          const firstResult = data.results[0];
          setRegion({
            latitude: firstResult.geometry.location.lat,
            longitude: firstResult.geometry.location.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } else {
          Alert.alert(
            'Nenhum resultado',
            'Não foram encontrados lugares com o termo pesquisado.'
          );
        }
      }
    } catch (error) {
      console.error('Erro na pesquisa:', error);
      Alert.alert('Erro', 'Não foi possível realizar a pesquisa. Verifique sua conexão com a internet.');
    } finally {
      setIsSearching(false);
    }
  }, [region]);

  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      searchPlaces(text);
    }, 500);
  }, [searchPlaces]);

  const addDestination = useCallback((place) => {
    setDestinations(prev => [...prev, place]);
    setSelectedPlace(place);
  }, []);

  const handlePlaceSelect = useCallback((place) => {
    if (destinations.length === 0) {
      // Primeiro destino
      addDestination(place);
    } else {
      // Adiciona novo destino e recalcula rota
      addDestination(place);
      if (location) {
        calculateRouteWithWaypoints(
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          },
          [...destinations, place]
        );
      }
    }
  }, [location, destinations, addDestination, calculateRouteWithWaypoints]);

  const startNavigation = useCallback(() => {
    if (selectedPlace) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.geometry.location.lat},${selectedPlace.geometry.location.lng}&travelmode=driving`;
      Linking.openURL(url);
    }
  }, [selectedPlace]);

  const decodePolyline = (encoded) => {
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    const coordinates = [];
    
    while (index < len) {
      let shift = 0;
      let result = 0;
      let byte;
      
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      
      shift = 0;
      result = 0;
      
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      
      coordinates.push({
        latitude: lat * 1e-5,
        longitude: lng * 1e-5
      });
    }
    
    return coordinates;
  };

  if (isLoading) {
    return (
      <View style={[
        styles.loadingContainer,
        isDark && styles.loadingContainerDark
      ]}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#007AFF'} />
        <Text style={[
          styles.loadingText,
          isDark && styles.loadingTextDark
        ]}>
          Carregando mapa...
        </Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={[
        styles.errorContainer,
        isDark && styles.errorContainerDark
      ]}>
        <Text style={[
          styles.errorText,
          isDark && styles.errorTextDark
        ]}>
          {errorMsg}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={requestLocationPermission}
          accessibilityLabel="Tentar novamente"
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={isDark ? '#121212' : '#fff'}
      />
      
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
        customMapStyle={isDark ? darkMapStyle : []}
      >
        {route && (
          <Polyline
            coordinates={route.points}
            strokeWidth={4}
            strokeColor="#007AFF"
          />
        )}
        
        {selectedPlace && (
          <LocationMarker
            place={selectedPlace}
            onSelect={handlePlaceSelect}
            isSelected={true}
            isDestination={true}
          />
        )}
      </MapView>

      <SearchBar
        value={searchQuery}
        onChangeText={handleSearch}
        onClear={() => {
          setSearchQuery('');
          setSearchResults([]);
          setSuggestions([]);
        }}
        onSubmit={() => {
          // Handle search submission
        }}
        loading={isSearching}
      />

      {isSearchFocused && searchResults.length > 0 && (
        <SearchSuggestions
          data={searchResults}
          onPress={handlePlaceSelect}
          visible={isSearchFocused}
        />
      )}

      {showRouteInfo && currentRoute && (
        <RouteInfo
          distance={currentRoute.distance}
          duration={currentRoute.duration}
          onStartNavigation={startNavigation}
          onClose={() => {
            setShowRouteInfo(false);
            setCurrentRoute(null);
            setDestinations([]);
          }}
          onShowDirections={() => setShowInstructions(true)}
        />
      )}

      {showInstructions && (
        <DirectionsList
          steps={instructions}
          onClose={() => setShowInstructions(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingContainerDark: {
    backgroundColor: '#121212',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  loadingTextDark: {
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorContainerDark: {
    backgroundColor: '#121212',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorTextDark: {
    color: '#FF6B6B',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  searchBarContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  searchBarContainerDark: {
    backgroundColor: 'rgba(18, 18, 18, 0.8)',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInputContainerDark: {
    backgroundColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#000',
  },
  searchInputDark: {
    color: '#fff',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 70,
    left: 20,
    right: 20,
    maxHeight: 300,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1,
  },
  suggestionsContainerDark: {
    backgroundColor: '#333',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionItemDark: {
    borderBottomColor: '#444',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionPrimaryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  suggestionPrimaryTextDark: {
    color: '#fff',
  },
  suggestionSecondaryText: {
    fontSize: 12,
    color: '#666',
  },
  suggestionSecondaryTextDark: {
    color: '#aaa',
  },
  markerContainer: {
    alignItems: 'center',
  },
  calloutContainer: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutContainerDark: {
    backgroundColor: '#333',
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
    color: '#000',
  },
  calloutTitleDark: {
    color: '#fff',
  },
  calloutDescription: {
    fontSize: 12,
    marginBottom: 6,
    color: '#666',
  },
  calloutDescriptionDark: {
    color: '#aaa',
  },
  routeInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeInfoContainerDark: {
    backgroundColor: '#333',
  },
  routeInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  routeInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  routeInfoTitleDark: {
    color: '#fff',
  },
  routeInfoBody: {
    marginBottom: 20,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  routeInfoText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  routeInfoTextDark: {
    color: '#aaa',
  },
  routeInfoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navigationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    justifyContent: 'center',
  },
  navigationButtonDark: {
    backgroundColor: '#2196F3',
  },
  navigationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instructionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
  },
  instructionsButtonDark: {
    backgroundColor: '#66BB6A',
  },
  instructionsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instructionsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    padding: 20,
  },
  instructionsContainerDark: {
    backgroundColor: '#333',
  },
  instructionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  instructionsTitleDark: {
    color: '#fff',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  currentInstructionItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderBottomColor: '#007AFF',
  },
  instructionIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  instructionTextContainer: {
    flex: 1,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
  },
  instructionTextDark: {
    color: '#aaa',
  },
  currentInstructionText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  instructionDistance: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  instructionDistanceDark: {
    color: '#666',
  },
  addDestinationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
  },
  addDestinationButtonDark: {
    backgroundColor: '#FFA726',
  },
  addDestinationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  routeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startNavButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    justifyContent: 'center',
  },
  startNavButtonDark: {
    backgroundColor: '#2196F3',
  },
  startNavButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  showDirectionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
  },
  showDirectionsButtonDark: {
    backgroundColor: '#66BB6A',
  },
  showDirectionsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  directionsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    padding: 20,
  },
  directionsContainerDark: {
    backgroundColor: '#333',
  },
  directionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  directionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  directionsTitleDark: {
    color: '#fff',
  },
  directionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  directionIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  directionTextContainer: {
    flex: 1,
  },
  directionText: {
    fontSize: 16,
    color: '#666',
  },
  directionDistance: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
]; 