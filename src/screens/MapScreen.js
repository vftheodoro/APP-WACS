import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert, Dimensions, TextInput, FlatList, ScrollView, Image, StatusBar } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchLocations } from '../services/firebase/locations';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AppHeader from '../components/common/AppHeader';
import SearchBar from '../components/SearchBar';
import CustomMarker from '../components/mapas/CustomMarker.js';
import AccessibilityIcons from '../components/mapas/AccessibilityIcons.js';
import LivePanel from '../components/mapas/LivePanel.js';
import AccessibleLocationDetailPanel from '../components/mapas/AccessibleLocationDetailPanel.js';
import { calculateDistance, decodePolyline, getManeuverIcon } from '../utils/mapUtils';
import MapSearchPanel from '../components/mapas/MapSearchPanel.js';
import { Share } from 'react-native';
import { fetchReviewsForLocation } from '../services/firebase/locations';

const GOOGLE_MAPS_APIKEY = Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY;
const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#1976d2',
  gradientStart: '#1976d2',
  gradientEnd: '#2196f3',
  background: '#f8fafc',
  surface: '#fff',
  text: '#333',
  textSecondary: '#666',
  border: '#e0e0e0',
  accent: '#43e97b',
};

const MapScreen = () => {
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [info, setInfo] = useState({ distance: '', duration: '', instruction: '' });
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [navigationSteps, setNavigationSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [accessibleLocations, setAccessibleLocations] = useState([]);
  const [loadingAccessible, setLoadingAccessible] = useState(true);
  const mapRef = useRef(null);
  const locationWatcher = useRef(null);
  const navigationInterval = useRef(null);
  const searchInputRef = useRef(null);

  // Novo estado para foco e loading do autocomplete
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [autoCompleteLoading, setAutoCompleteLoading] = useState(false);

  // Adicionar no início do componente:
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Adicionar estados e funções antes do return:
  const [selectedLocationReviews, setSelectedLocationReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Buscar locais acessíveis do Firestore ao montar
  useEffect(() => {
    async function loadAccessibleLocations() {
      setLoadingAccessible(true);
      try {
        const data = await fetchLocations();
        setAccessibleLocations(data);
      } catch (e) {
        setAccessibleLocations([]);
      }
      setLoadingAccessible(false);
    }
    loadAccessibleLocations();
  }, []);

  // Carregar histórico de pesquisa
  useEffect(() => {
    loadSearchHistory();
    if (location) {
      fetchNearbyPlaces();
    }
  }, [location]);

  // Carregar histórico de pesquisa do AsyncStorage
  const loadSearchHistory = async () => {
    try {
      const historyJson = await AsyncStorage.getItem('mapSearchHistory');
      if (historyJson) {
        const history = JSON.parse(historyJson);
        setSearchHistory(history);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de pesquisa:', error);
    }
  };

  // Salvar no histórico de pesquisa
  const saveToSearchHistory = async (place) => {
    try {
      // Não salvar duplicatas no histórico
      const exists = searchHistory.some(item => item.id === place.id);
      if (exists) return;

      // Adicionar ao início e limitar a 10 itens
      const updatedHistory = [place, ...searchHistory].slice(0, 10);
      setSearchHistory(updatedHistory);
      await AsyncStorage.setItem('mapSearchHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Erro ao salvar histórico de pesquisa:', error);
    }
  };

  // Limpar histórico de pesquisa
  const clearSearchHistory = async () => {
    try {
      await AsyncStorage.removeItem('mapSearchHistory');
      setSearchHistory([]);
      Alert.alert('Histórico', 'Histórico de pesquisa limpo com sucesso.');
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  };

  // Buscar locais próximos
  const fetchNearbyPlaces = async () => {
    if (!location) return;
    
    setIsLoadingNearby(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=1500&type=establishment&key=${GOOGLE_MAPS_APIKEY}&language=pt-BR`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const places = data.results.map(place => ({
          id: place.place_id,
          name: place.name,
          address: place.vicinity,
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          },
          rating: place.rating || 0,
          distance: calculateDistance(
            location.latitude,
            location.longitude,
            place.geometry.location.lat,
            place.geometry.location.lng
          )
        })).sort((a, b) => a.distance - b.distance);
        
        setNearbyPlaces(places.slice(0, 5)); // Limitar a 5 locais próximos
      }
    } catch (error) {
      console.error('Erro ao buscar locais próximos:', error);
    }
    setIsLoadingNearby(false);
  };

  // Solicitar permissão e iniciar localização em tempo real
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permissão para acessar a localização foi negada');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      setLocation(loc.coords);
      locationWatcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 1, timeInterval: 1000 },
        (loc) => setLocation(loc.coords)
      );
    })();
    return () => {
      if (locationWatcher.current) locationWatcher.current.remove();
    };
  }, []);

  // Limpar recursos quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (navigationInterval.current) {
        clearInterval(navigationInterval.current);
      }
    };
  }, []);

  // Traçar rota ao definir destino
  useEffect(() => {
    if (location && destination) {
      getRoute(location, destination);
    } else {
      setRouteCoords([]);
      setInfo({ distance: '', duration: '', instruction: '' });
    }
  }, [destination, location]);

  // Função para buscar locais pelo texto de pesquisa
  const searchPlaces = async () => {
    if (!searchText || searchText.trim().length < 2 || !location) return;
    setIsSearching(true);
    setAutoCompleteLoading(true);
    setShowSearchHistory(false);
    try {
      // Adicionar bias de localização para priorizar resultados próximos
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchText)}&location=${location.latitude},${location.longitude}&radius=50000&key=${GOOGLE_MAPS_APIKEY}&language=pt-BR`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const places = data.results.map(place => ({
          id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          },
          rating: place.rating || 0,
          distance: calculateDistance(
            location.latitude,
            location.longitude,
            place.geometry.location.lat,
            place.geometry.location.lng
          )
        }));
        
        // Ordenar resultados por distância
        const sortedPlaces = places.sort((a, b) => a.distance - b.distance);
        setSearchResults(sortedPlaces);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Erro ao buscar locais:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
    setAutoCompleteLoading(false);
  };

  // Função para buscar rota na Google Directions API
  const getRoute = async (origin, dest) => {
    setLoadingRoute(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${dest.latitude},${dest.longitude}&key=${GOOGLE_MAPS_APIKEY}&language=pt-BR`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoords(points);
        const leg = data.routes[0].legs[0];
        setInfo({
          distance: leg.distance.text,
          duration: leg.duration.text,
          instruction: leg.steps[0]?.html_instructions.replace(/<[^>]+>/g, '') || '',
        });
        
        // Processar passos da navegação
        const steps = leg.steps.map(step => ({
          distance: step.distance.text,
          duration: step.duration.text,
          instruction: step.html_instructions.replace(/<[^>]+>/g, ''),
          startLocation: step.start_location,
          endLocation: step.end_location,
          maneuver: step.maneuver || '',
          polyline: decodePolyline(step.polyline.points)
        }));
        setNavigationSteps(steps);
        setCurrentStepIndex(0);
        
        // Centralizar no início da rota
        if (mapRef.current) {
      mapRef.current.animateToRegion({
            latitude: origin.latitude,
            longitude: origin.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
      } else {
        setRouteCoords([]);
        setInfo({ distance: '', duration: '', instruction: 'Rota não encontrada' });
        setNavigationSteps([]);
      }
    } catch (e) {
      setErrorMsg('Erro ao buscar rota');
      console.error('Erro ao buscar rota:', e);
    }
    setLoadingRoute(false);
  };

  // Centralizar no usuário
  const centerOnUser = () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  // Selecionar destino com toque longo
  const handleLongPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setDestination({ latitude, longitude });
    setSearchText('');
    setSearchResults([]);
    setShowSearchHistory(false);
  };

  // Selecionar local da lista de resultados
  const selectPlace = (place) => {
    setDestination(place.location);
    setSearchResults([]);
    setSearchText(place.name);
    setShowSearchHistory(false);
    
    // Salvar no histórico
    saveToSearchHistory(place);
  };

  // Selecionar um item do histórico
  const selectHistoryItem = (item) => {
    setDestination(item.location);
    setSearchText(item.name);
    setShowSearchHistory(false);
  };

  // Iniciar navegação
  const startNavigation = (steps) => {
    if (!steps || steps.length === 0) return;
    
    setIsNavigating(true);
    setCurrentStepIndex(0);
    
    // Limpar intervalo anterior se existir
    if (navigationInterval.current) {
      clearInterval(navigationInterval.current);
    }
    
    // Monitorar progresso da navegação
    navigationInterval.current = setInterval(() => {
      if (!location || !steps[currentStepIndex]) return;
      
      // Calcular distância até o próximo ponto de manobra
      const nextStep = steps[currentStepIndex];
      const distanceToNextStep = calculateDistance(
        location.latitude,
        location.longitude,
        nextStep.endLocation.lat,
        nextStep.endLocation.lng
      );
      
      // Se já chegou ao destino final
      if (currentStepIndex >= steps.length - 1 && distanceToNextStep < 20) {
        stopNavigation();
        return;
      }
      
      // Quando estiver muito próximo, avance para o próximo passo
      if (distanceToNextStep < 20) {
        setCurrentStepIndex(prevIndex => {
          const newIndex = prevIndex + 1;
          if (newIndex < steps.length) {
            return newIndex;
          }
          return prevIndex;
        });
      }
    }, 5000); // Verificar a cada 5 segundos
  };

  // Obter ícone com base no tipo de manobra
  const getManeuverIcon = (maneuver) => {
    switch (maneuver) {
      case 'turn-right':
        return 'arrow-right';
      case 'turn-left':
        return 'arrow-left';
      case 'uturn-right':
      case 'uturn-left':
        return 'undo';
      case 'roundabout-right':
      case 'roundabout-left':
        return 'sync';
      case 'merge':
        return 'compress-arrows-alt';
      case 'fork-right':
      case 'fork-left':
        return 'code-branch';
      case 'straight':
      default:
        return 'arrow-up';
    }
  };

  // Parar navegação
  const stopNavigation = () => {
    if (navigationInterval.current) {
      clearInterval(navigationInterval.current);
      navigationInterval.current = null;
    }
    setIsNavigating(false);
  };

  // Cancelar navegação
  const cancelNavigation = () => {
    stopNavigation();
    setDestination(null);
    setRouteCoords([]);
    setInfo({ distance: '', duration: '', instruction: '' });
    setSearchText('');
    setSearchResults([]);
    setNavigationSteps([]);
    setCurrentStepIndex(0);
  };

  // Focar na barra de pesquisa
  const focusSearchBar = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      setShowSearchHistory(true);
    }
  };

  const navigation = useNavigation();

  const handleShare = async () => {
    if (!selectedLocation) return;
    try {
      await Share.share({
        message: `Confira este local acessível no WACS: ${selectedLocation.name}. Endereço: ${selectedLocation.address}`,
        title: `WACS: ${selectedLocation.name}`
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar o local.');
    }
  };

  useEffect(() => {
    if (selectedLocation) {
      setLoadingReviews(true);
      fetchReviewsForLocation(selectedLocation.id)
        .then(revs => setSelectedLocationReviews(revs))
        .catch(() => setSelectedLocationReviews([]))
        .finally(() => setLoadingReviews(false));
    }
  }, [selectedLocation]);

  const handleStartRoute = () => {
    if (!selectedLocation) return;
    setDestination({ latitude: selectedLocation.latitude, longitude: selectedLocation.longitude });
    // getRoute será chamado pelo useEffect de destination
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <AppHeader
        title="Mapa"
        onBack={() => navigation.goBack()}
        gradientColors={[COLORS.gradientStart, COLORS.gradientEnd]}
        style={{ elevation: 10 }}
      />
      {/* Barra de pesquisa customizada */}
      <View style={{ position: 'absolute', top: 70, width: '92%', alignSelf: 'center', zIndex: 99 }}>
        <SearchBar
          value={searchText}
          onChangeText={text => {
            setSearchText(text);
            if (text.length > 1) {
              searchPlaces();
            } else if (text.length === 0) {
              setShowSearchHistory(true);
            }
          }}
          placeholder="Pesquisar local..."
          onFocus={() => {
            setShowSearchHistory(true);
            setIsSearchFocused(true);
          }}
          onBlur={() => setIsSearchFocused(false)}
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchText('');
              setShowSearchHistory(true);
              setSearchResults([]);
            }}
            style={{ position: 'absolute', right: 18, top: 12, zIndex: 10 }}
            accessibilityLabel="Limpar busca"
          >
            <Ionicons name="close-circle" size={22} color={COLORS.border} />
          </TouchableOpacity>
        )}
      </View>
      {/* Autocomplete aprimorado */}
      <MapSearchPanel
        searchText={searchText}
        setSearchText={setSearchText}
        searchResults={searchResults}
        setSearchResults={setSearchResults}
        isSearching={isSearching}
        autoCompleteLoading={autoCompleteLoading}
        showSearchHistory={showSearchHistory}
        setShowSearchHistory={setShowSearchHistory}
        searchHistory={searchHistory}
        clearSearchHistory={clearSearchHistory}
        nearbyPlaces={nearbyPlaces}
        selectPlace={selectPlace}
        selectHistoryItem={selectHistoryItem}
        searchPlaces={searchPlaces}
        searchInputRef={searchInputRef}
        isSearchFocused={isSearchFocused}
        setIsSearchFocused={setIsSearchFocused}
      />
      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        customMapStyle={mapCustomStyle}
        provider={PROVIDER_GOOGLE}
        initialRegion={location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
        region={location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
        showsUserLocation
        showsMyLocationButton={false}
        onLongPress={handleLongPress}
      >
        {location && (
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title="Você"
            pinColor={COLORS.primary}
          />
        )}
        {destination && (
          <Marker
            coordinate={destination}
            title="Destino"
            pinColor="#FF0000"
          />
        )}
        {/* Marcadores dos pontos acessíveis do Firestore */}
        {accessibleLocations && accessibleLocations
          .map((loc) => {
            let latitude = loc.latitude;
            let longitude = loc.longitude;
            if (loc.location && typeof loc.location === 'object') {
              if (typeof loc.location.latitude === 'number' && typeof loc.location.longitude === 'number') {
                latitude = loc.location.latitude;
                longitude = loc.location.longitude;
              }
            }
            if (!latitude || !longitude) {
              if (typeof loc.location === 'string') {
                const match = loc.location.match(/([\d.]+)[^\d-]*([S|N]),\s*([\d.]+)[^\d-]*([W|E])/i);
                if (match) {
                  let lat = parseFloat(match[1]);
                  let lng = parseFloat(match[3]);
                  if (match[2].toUpperCase() === 'S') lat = -lat;
                  if (match[4].toUpperCase() === 'W') lng = -lng;
                  latitude = lat;
                  longitude = lng;
                }
              }
            }
            if (typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude)) {
              return (
                <Marker
                  key={loc.id}
                  coordinate={{ latitude, longitude }}
                  onPress={() => setSelectedLocation(loc)}
                >
                  <View style={{ backgroundColor: COLORS.accent, borderRadius: 20, padding: 4, borderWidth: 2, borderColor: '#fff' }}>
                    <FontAwesome5 name="universal-access" size={20} color="#fff" />
                  </View>
                </Marker>
              );
            }
            return null;
          })}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={6}
            strokeColor={COLORS.primary}
          />
        )}
        {isNavigating && navigationSteps.length > 0 && currentStepIndex < navigationSteps.length && (
          <Polyline
            coordinates={navigationSteps[currentStepIndex].polyline}
            strokeWidth={8}
            strokeColor={COLORS.accent}
          />
        )}
      </MapView>
      {/* Botão flutuante de centralizar */}
      <TouchableOpacity style={styles.centerButton} onPress={centerOnUser} activeOpacity={0.8}>
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.fabInnerCenter}>
          <Ionicons name="locate" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
      {/* Botão flutuante de adicionar local */}
      <TouchableOpacity
        style={styles.addFab}
        onPress={() => navigation && navigation.navigate('Locais', { addModalVisible: true })}
        activeOpacity={0.8}
      >
        <LinearGradient colors={[COLORS.accent, COLORS.gradientEnd]} style={styles.fabInnerAdd}>
          <Ionicons name="add" size={36} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
      {/* Painel de navegação */}
      {destination && routeCoords.length > 0 && (
        <View style={styles.navigationPanel}>
          <View style={styles.navigationHeader}>
            <Text style={styles.navigationTitle}>Navegação</Text>
          </View>
          <Text style={styles.routeText}>Distância: {info.distance} | Tempo: {info.duration}</Text>
          {isNavigating && navigationSteps.length > 0 && currentStepIndex < navigationSteps.length && (
            <View style={styles.stepContainer}>
              <FontAwesome5 
                name={getManeuverIcon(navigationSteps[currentStepIndex].maneuver)} 
                size={24}
                color={COLORS.primary} 
                style={styles.maneuverIcon}
              />
              <Text style={styles.stepInstruction}>
                {navigationSteps[currentStepIndex].instruction}
              </Text>
            </View>
          )}
          <View style={styles.navigationButtonsContainer}>
            {!isNavigating ? (
              <TouchableOpacity 
                style={styles.startButton} 
                onPress={() => startNavigation(navigationSteps)}
              >
                <MaterialIcons name="directions" size={20} color="#fff" />
                <Text style={{ color: '#fff', marginLeft: 8 }}>Iniciar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.stopButton} 
                onPress={stopNavigation}
              >
                <MaterialIcons name="pause" size={20} color="#fff" />
                <Text style={{ color: '#fff', marginLeft: 8 }}>Pausar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelButton} onPress={cancelNavigation}>
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 8 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Painel flutuante de informações do local acessível */}
      {selectedLocation && (
        <AccessibleLocationDetailPanel
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
          onViewDetails={() => {
            setSelectedLocation(null);
            navigation.navigate('LocationDetail', { locationId: selectedLocation.id });
          }}
          userLocation={location}
          onStartRoute={handleStartRoute}
          loadingRoute={loadingRoute}
          routeInfo={info}
          onShare={handleShare}
          isFavorite={isFavorite}
          onToggleFavorite={() => setIsFavorite(fav => !fav)}
          reviews={selectedLocationReviews}
        />
      )}
    </View>
  );
};

const mapCustomStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e0f7fa' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#00796b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#b9f6ca' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#388e3c' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#cfd8dc' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#b0bec5' }] },
  { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#90a4ae' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#b3e5fc' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#0288d1' }] }
];

const styles = StyleSheet.create({
  map: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    margin: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    width: '90%',
    alignSelf: 'center',
    zIndex: 99,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    paddingVertical: 6,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchResultsList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: height * 0.4,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultIcon: {
    marginRight: 10,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  resultAddress: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  resultDistance: {
    fontSize: 12,
    color: '#007bff',
    marginTop: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  clearHistoryText: {
    fontSize: 13,
    color: '#007bff',
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  searchLoadingText: {
    marginLeft: 10,
    color: '#666',
  },
  centerButton: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  addFab: {
    position: 'absolute',
    right: 24,
    bottom: 110, // Deixa acima do botão de centralizar
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#43e97b',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 16,
    zIndex: 99,
    overflow: 'visible',
  },
  fabInnerAdd: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#43e97b',
  },
  fabInnerCenter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00b0ff',
  },
  fabIcon: {
    fontSize: 40,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  navigationPanel: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 5,
  },
  routeText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
  },
  navigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navigationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  maneuverIcon: {
    marginRight: 10,
    width: 30,
    textAlign: 'center',
  },
  stepInstruction: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  navigationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    borderRadius: 8,
    padding: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 8,
    flex: 1,
    justifyContent: 'center',
  },
  tipPanel: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  tipText: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    color: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    fontSize: 16,
    fontWeight: '500',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  resultsListContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: height * 0.4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { MapScreen };
export default MapScreen;