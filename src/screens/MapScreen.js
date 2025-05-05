import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert, ScrollView, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOOGLE_MAPS_APIKEY = Constants.expoConfig?.extra?.GOOGLE_MAPS_API_KEY || '';
const SEARCH_HISTORY_KEY = 'map_search_history';
const { width } = Dimensions.get('window');

// Categorias de lugares populares
const PLACE_CATEGORIES = [
  { id: 'restaurant', name: 'Restaurantes', icon: 'fast-food' },
  { id: 'gas_station', name: 'Postos', icon: 'car' },
  { id: 'hospital', name: 'Hospitais', icon: 'medkit' },
  { id: 'pharmacy', name: 'Farmácias', icon: 'medkit' },
  { id: 'shopping_mall', name: 'Shopping', icon: 'cart' },
  { id: 'cafe', name: 'Cafés', icon: 'cafe' },
];

const MapScreen = (props) => {
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState({ distance: '', duration: '' });
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const mapRef = useRef(null);
  const locationWatcher = useRef(null);
  const searchRef = useRef(null);

  // Carregar histórico de pesquisa
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        if (history) {
          setSearchHistory(JSON.parse(history));
        }
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    };
    loadHistory();
  }, []);

  // Solicitar permissão e iniciar localização em tempo real
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permissão para acessar a localização foi negada');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      locationWatcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 2, timeInterval: 1000 },
        (loc) => setLocation(loc.coords)
      );
    })();
    return () => {
      if (locationWatcher.current) locationWatcher.current.remove();
    };
  }, []);

  // Traçar rota ao definir destino
  useEffect(() => {
    if (location && destination) {
      fetchRoute();
    } else {
      setRouteCoords([]);
      setRouteInfo({ distance: '', duration: '' });
    }
  }, [destination, location]);

  // Buscar locais próximos quando uma categoria é selecionada
  useEffect(() => {
    if (selectedCategory && location) {
      fetchNearbyPlaces(selectedCategory);
    }
  }, [selectedCategory, location]);

  // Adicionar ao histórico de pesquisa
  const addToSearchHistory = async (item) => {
    if (!item || !item.place_id) return;
    
    try {
      // Versão simplificada sem usar filter
      let newHistory = [];
      if (Array.isArray(searchHistory)) {
        // Verificar se o item já existe no histórico
        const exists = searchHistory.some(h => h && h.place_id === item.place_id);
        if (!exists) {
          // Se não existir, adicionar ao histórico limitando a 5 itens
          newHistory = [item, ...searchHistory].slice(0, 5);
        } else {
          // Se já existir, manter o histórico atual
          newHistory = [...searchHistory];
        }
      } else {
        // Se searchHistory não for um array, iniciar com apenas o item atual
        newHistory = [item];
      }
      
      setSearchHistory(newHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  };

  // Função para buscar locais próximos por categoria
  const fetchNearbyPlaces = async (category) => {
    if (!location) return;
    
    setLoadingNearby(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=1500&type=${category}&key=${GOOGLE_MAPS_APIKEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results) {
        setNearbyPlaces(data.results.map(place => ({
          place_id: place.place_id,
          name: place.name,
          vicinity: place.vicinity,
          location: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          }
        })));
      }
    } catch (error) {
      console.error('Erro ao buscar lugares próximos:', error);
      Alert.alert('Erro', 'Não foi possível buscar lugares próximos');
    }
    setLoadingNearby(false);
  };

  // Função para buscar rota na Google Directions API
  const fetchRoute = async () => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${location.latitude},${location.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_APIKEY}`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoords(points);
        
        if (route.legs && route.legs.length > 0) {
          const leg = route.legs[0];
          setRouteInfo({
            distance: leg.distance?.text || '',
            duration: leg.duration?.text || ''
          });
        }
        
        // Ajustar mapa para mostrar toda a rota
        if (mapRef.current && points.length > 0) {
          mapRef.current.fitToCoordinates(points, {
            edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
            animated: true
          });
        }
      } else {
        Alert.alert('Erro', 'Não foi possível encontrar uma rota');
      }
    } catch (error) {
      console.error('Erro ao buscar rota:', error);
      Alert.alert('Erro', 'Falha ao calcular a rota');
    }
  };

  // Decodificador de polyline Google
  function decodePolyline(encoded) {
    if (!encoded) return [];
    
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  }

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
  };

  // Selecionar lugar pelo nome/endereço
  const handlePlaceSelect = (data, details = null) => {
    if (details && data) {
      const place = {
        place_id: data.place_id,
        name: details.name || data.description,
        address: details.formatted_address || data.description,
      };
      
      setDestination({
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
      });
      
      addToSearchHistory(place);
      setIsSearchFocused(false);
    }
  };

  // Selecionar lugar próximo da lista
  const handleNearbyPlaceSelect = (place) => {
    if (!place || !place.location) return;
    
    setDestination(place.location);
    addToSearchHistory({
      place_id: place.place_id,
      name: place.name,
      address: place.vicinity,
    });
  };

  // Selecionar lugar do histórico
  const handleHistorySelect = (item) => {
    if (!item) return;
    
    if (item.location) {
      setDestination(item.location);
    } else if (item.place_id) {
      // Buscar detalhes do lugar se não tiver coordenadas
      searchRef.current?.getDetails({
        place_id: item.place_id
      }, (details) => {
        if (details && details.geometry && details.geometry.location) {
          setDestination({
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
          });
        }
      });
    }
    setIsSearchFocused(false);
  };

  // Cancelar navegação
  const cancelNavigation = () => {
    setDestination(null);
    setRouteCoords([]);
    setRouteInfo({ distance: '', duration: '' });
    setSelectedCategory(null);
    setNearbyPlaces([]);
  };

  // Renderizar categorias de lugares
  const renderCategories = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesContainer}
    >
      {PLACE_CATEGORIES.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryItem,
            selectedCategory === category.id && styles.categoryItemActive
          ]}
          onPress={() => {
            setSelectedCategory(prev => prev === category.id ? null : category.id);
            if (selectedCategory === category.id) {
              setNearbyPlaces([]);
            }
          }}
        >
          <Ionicons
            name={category.icon} 
            size={24} 
            color={selectedCategory === category.id ? '#fff' : '#007bff'} 
          />
          <Text style={[
            styles.categoryText,
            selectedCategory === category.id && styles.categoryTextActive
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  let content = <ActivityIndicator size="large" color="#007AFF" />;

  if (errorMsg) {
    content = <Text style={styles.errorText}>{errorMsg}</Text>;
  } else if (location) {
    content = (
      <>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Sua localização"
          />
        </MapView>
        <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={24} color="#fff" />
        </TouchableOpacity>
      </>
    );
  }

  return <View style={styles.container}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  centerButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default MapScreen;