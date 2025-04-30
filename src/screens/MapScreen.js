import 'react-native-get-random-values';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Text, TextInput, FlatList, ActivityIndicator, Modal, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useSearchHistory } from '../contexts/SearchHistoryContext';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const VALID_MAP_TYPES = ['standard', 'satellite', 'hybrid', 'terrain'];
const DEFAULT_MAP_TYPE = 'standard';

export const MapScreen = () => {
  const { isDark } = useTheme();
  const { searchHistory, loadSearchHistory, addToHistory } = useSearchHistory();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [mapStyle, setMapStyle] = useState(DEFAULT_MAP_TYPE);
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [mapMode, setMapMode] = useState('driving');
  const [mapLayers, setMapLayers] = useState({
    traffic: true,
    transit: false,
    biking: false,
    poi: true
  });
  const [places, setPlaces] = useState([]);
  const [speed, setSpeed] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const mapRef = useRef(null);
  const searchRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const mapStyles = {
    standard: [],
    satellite: [
      {
        "featureType": "all",
        "stylers": [{"saturation": -100}, {"gamma": 0.5}]
      }
    ],
    minimal: [
      {
        "featureType": "poi",
        "stylers": [{"visibility": "off"}]
      },
      {
        "featureType": "transit",
        "stylers": [{"visibility": "off"}]
      }
    ],
    night: [
      {
        "elementType": "geometry",
        "stylers": [{"color": "#242f3e"}]
      },
      {
        "elementType": "labels.text.stroke",
        "stylers": [{"color": "#242f3e"}]
      }
    ]
  };

  const handleMapStyleChange = (newStyle) => {
    if (VALID_MAP_TYPES.includes(newStyle)) {
      setMapStyle(newStyle);
    } else {
      console.warn(`Tipo de mapa inválido: ${newStyle}`);
      setMapStyle(DEFAULT_MAP_TYPE);
    }
  };

  const getSafeMapStyle = () => {
    return VALID_MAP_TYPES.includes(mapStyle) ? mapStyle : DEFAULT_MAP_TYPE;
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permissão para acessar a localização foi negada');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      await loadSearchHistory();
    })();
  }, []);

  useEffect(() => {
    const watchId = Location.watchPositionAsync({
      accuracy: Location.Accuracy.High,
      distanceInterval: 5,
      timeInterval: 1000
    }, (loc) => {
      setSpeed(loc.coords.speed ? (loc.coords.speed * 3.6).toFixed(1) : null);
      setAccuracy(loc.coords.accuracy?.toFixed(0));
    });

    return () => watchId?.remove();
  }, []);

  useEffect(() => {
    if (selectedPlace) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedPlace]);

  const centerOnUser = async () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const handlePlaceSelected = async (data, details) => {
    if (details) {
      const { geometry, formatted_address, name, types } = details;
      const newPlace = {
        place_id: data.place_id,
        description: data.description,
        lat: geometry.location.lat,
        lng: geometry.location.lng,
        address: formatted_address,
        name: name,
        types: types,
      };

      setSelectedPlace(newPlace);
      setPlaceDetails(details);
      await addToHistory(newPlace);

      mapRef.current.animateToRegion({
        latitude: geometry.location.lat,
        longitude: geometry.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const handleMapPress = async (event) => {
    const { coordinate } = event.nativeEvent;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const newPlace = {
          place_id: `custom_${Date.now()}`,
          description: result.formatted_address,
          lat: coordinate.latitude,
          lng: coordinate.longitude,
          address: result.formatted_address,
          name: result.address_components[0].long_name,
          types: result.types,
        };
        
        setSelectedPlace(newPlace);
        setPlaceDetails(result);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do local:', error);
    }
  };

  const fetchNearbyPlaces = async (type) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.coords.latitude},${location.coords.longitude}&radius=1500&type=${type}&key=${Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY}`
    );
    return await response.json();
  };

  const handlePoiClick = async (event) => {
    const { coordinate } = event;
    const response = await fetchNearbyPlaces('point_of_interest');
    const places = response.results;
    setPlaces(places);
  };

  const renderHistoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.historyItem, isDark ? styles.historyItemDark : null]}
      onPress={() => {
        mapRef.current.animateToRegion({
          latitude: item.lat,
          longitude: item.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
        setSelectedPlace(item);
        setShowHistory(false);
      }}
    >
      <Ionicons
        name="time-outline"
        size={20}
        color={isDark ? '#ffffff' : '#333333'}
        style={styles.historyIcon}
      />
      <Text style={[styles.historyText, isDark ? styles.historyTextDark : null]}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[premiumStyles.container, isDark ? premiumStyles.containerDark : null]}>
      {location ? (
        <>
          <MapView
            mapType={getSafeMapStyle()}
            customMapStyle={nightMode ? mapStyles.night : mapStyles[getSafeMapStyle()]}
            provider={PROVIDER_GOOGLE}
            showsTraffic={mapLayers.traffic}
            showsTransit={mapLayers.transit}
            showsBicycling={mapLayers.biking}
            showsIndoorLevelPicker={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
            toolbarEnabled={true}
            onPoiClick={(e) => handlePoiClick(e.nativeEvent)}
            style={premiumStyles.map}
          >
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Sua localização"
            />
            {selectedPlace && (
              <Marker
                coordinate={{
                  latitude: selectedPlace.lat,
                  longitude: selectedPlace.lng,
                }}
                title={selectedPlace.description}
                pinColor="#FF0000"
              />
            )}
            {places.map((place) => (
              <Marker
                key={place.id}
                coordinate={place.geometry.location}
                title={place.name}
                description={place.vicinity}
                onCalloutPress={() => openPlaceDetails(place.place_id)}
              />
            ))}
          </MapView>

          <View style={premiumStyles.controlsContainer}>
            <TouchableOpacity 
              style={premiumStyles.controlButton}
              onPress={() => setMapMode(prev => 
                prev === 'driving' ? 'walking' : 'driving'
              )}
            >
              <Ionicons name="car" size={24} color="#007bff" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={premiumStyles.controlButton}
              onPress={() => setMapLayers(prev => ({ ...prev, traffic: !prev.traffic }))}
            >
              <Ionicons name="car" size={24} color={mapLayers.traffic ? "#ff0000" : "#007bff"} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={premiumStyles.controlButton}
              onPress={() => setMapLayers(prev => ({ ...prev, transit: !prev.transit }))}
            >
              <Ionicons name="train" size={24} color={mapLayers.transit ? "#ff0000" : "#007bff"} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={premiumStyles.controlButton}
              onPress={() => setMapLayers(prev => ({ ...prev, biking: !prev.biking }))}
            >
              <Ionicons name="bicycle" size={24} color={mapLayers.biking ? "#ff0000" : "#007bff"} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={premiumStyles.controlButton}
              onPress={() => setNightMode(!nightMode)}
            >
              <Ionicons name="moon" size={24} color={nightMode ? "#ffcc00" : "#007bff"} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={premiumStyles.controlButton}
              onPress={() => handleMapStyleChange('standard')}
            >
              <Ionicons name="map" size={24} color={mapStyle === 'standard' ? "#ff0000" : "#007bff"} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={premiumStyles.controlButton}
              onPress={() => handleMapStyleChange('satellite')}
            >
              <Ionicons name="globe" size={24} color={mapStyle === 'satellite' ? "#ff0000" : "#007bff"} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={premiumStyles.controlButton}
              onPress={() => handleMapStyleChange('hybrid')}
            >
              <Ionicons name="layers" size={24} color={mapStyle === 'hybrid' ? "#ff0000" : "#007bff"} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={premiumStyles.controlButton}
              onPress={() => handleMapStyleChange('terrain')}
            >
              <Ionicons name="terrain" size={24} color={mapStyle === 'terrain' ? "#ff0000" : "#007bff"} />
            </TouchableOpacity>
          </View>

          <View style={[premiumStyles.searchContainer, isDark ? premiumStyles.searchContainerDark : null]}>
            <GooglePlacesAutocomplete
              ref={searchRef}
              placeholder="Pesquisar local..."
              onPress={handlePlaceSelected}
              query={{
                key: Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY,
                language: 'pt-BR',
                components: 'country:br',
              }}
              styles={{
                container: {
                  flex: 0,
                  position: 'absolute',
                  width: '100%',
                  zIndex: 1,
                },
                textInput: {
                  height: 50,
                  color: isDark ? '#ffffff' : '#333333',
                  fontSize: 16,
                  backgroundColor: isDark ? '#333333' : '#ffffff',
                  borderRadius: 8,
                  paddingHorizontal: 15,
                  borderWidth: 1,
                  borderColor: isDark ? '#444' : '#ddd',
                },
                listView: {
                  backgroundColor: isDark ? '#333333' : '#ffffff',
                  borderRadius: 8,
                  marginTop: 5,
                  borderWidth: 1,
                  borderColor: isDark ? '#444' : '#ddd',
                },
                row: {
                  padding: 13,
                  height: 44,
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? '#444' : '#eee',
                },
                description: {
                  color: isDark ? '#ffffff' : '#333333',
                },
                separator: {
                  height: 1,
                  backgroundColor: isDark ? '#444' : '#eee',
                },
              }}
              enablePoweredByContainer={false}
              fetchDetails={true}
              minLength={2}
              debounce={300}
              textInputProps={{
                placeholderTextColor: isDark ? '#999999' : '#666666',
                onFocus: () => setShowHistory(true),
              }}
            />
          </View>

          {showHistory && searchHistory.length > 0 && (
            <View style={[premiumStyles.historyContainer, isDark ? premiumStyles.historyContainerDark : null]}>
              <View style={premiumStyles.historyHeader}>
                <Text style={[premiumStyles.historyTitle, isDark ? premiumStyles.historyTitleDark : null]}>
                  Histórico de Buscas
                </Text>
                <TouchableOpacity onPress={() => setShowHistory(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={isDark ? '#ffffff' : '#333333'}
                  />
                </TouchableOpacity>
              </View>
              <FlatList
                data={searchHistory}
                renderItem={renderHistoryItem}
                keyExtractor={(item) => item.place_id}
                style={premiumStyles.historyList}
              />
            </View>
          )}

          <Animated.View
            style={[
              premiumStyles.infoPanel,
              isDark ? premiumStyles.infoPanelDark : null,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [200, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {selectedPlace && (
              <View style={premiumStyles.infoContent}>
                <Text style={[premiumStyles.infoTitle, isDark ? premiumStyles.infoTitleDark : null]}>
                  {selectedPlace.name || 'Local selecionado'}
                </Text>
                <Text style={[premiumStyles.infoAddress, isDark ? premiumStyles.infoAddressDark : null]}>
                  {selectedPlace.address}
                </Text>
                <View style={premiumStyles.infoActions}>
                  <TouchableOpacity
                    style={[premiumStyles.actionButton, isDark ? premiumStyles.actionButtonDark : null]}
                    onPress={() => {
                      setSelectedPlace(null);
                      setPlaceDetails(null);
                    }}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={isDark ? '#ffffff' : '#333333'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>

          <LivePanel speed={speed} accuracy={accuracy} elevation={location.coords.altitude} />
        </>
      ) : (
        <View style={premiumStyles.loadingContainer}>
          <Text style={[premiumStyles.text, isDark ? premiumStyles.textDark : null]}>
            {errorMsg || 'Carregando mapa...'}
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[premiumStyles.centerButton, isDark ? premiumStyles.centerButtonDark : null]}
        onPress={centerOnUser}
      >
        <Ionicons
          name="locate"
          size={24}
          color={isDark ? '#ffffff' : '#333333'}
        />
      </TouchableOpacity>
    </View>
  );
};

const premiumStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  containerDark: {
    backgroundColor: '#121212'
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    fontSize: 18,
    color: '#333333'
  },
  textDark: {
    color: '#ffffff'
  },
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1
  },
  searchContainerDark: {
    backgroundColor: 'transparent'
  },
  centerButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  centerButtonDark: {
    backgroundColor: '#333333'
  },
  historyContainer: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    maxHeight: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  historyContainerDark: {
    backgroundColor: '#333333'
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333'
  },
  historyTitleDark: {
    color: '#ffffff'
  },
  historyList: {
    maxHeight: 250
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  historyItemDark: {
    borderBottomColor: '#444'
  },
  historyIcon: {
    marginRight: 10
  },
  historyText: {
    fontSize: 14,
    color: '#333333',
    flex: 1
  },
  historyTextDark: {
    color: '#ffffff'
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  infoPanelDark: {
    backgroundColor: '#333333'
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5
  },
  infoTitleDark: {
    color: '#ffffff'
  },
  infoAddress: {
    fontSize: 14,
    color: '#666666',
    flex: 1
  },
  infoAddressDark: {
    color: '#999999'
  },
  infoActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  actionButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0'
  },
  actionButtonDark: {
    backgroundColor: '#444444'
  },
  controlsContainer: {
    position: 'absolute',
    top: 20,
    right: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  controlButton: {
    padding: 10,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 28,
    height: 56,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
});

const LivePanel = ({ speed, accuracy, elevation }) => (
  <View style={{
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  }}>
    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333333' }}>
      Dados em tempo real
    </Text>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 14, color: '#666666' }}>
        Velocidade: {speed} km/h
      </Text>
      <Text style={{ fontSize: 14, color: '#666666' }}>
        Precisão: {accuracy} m
      </Text>
      <Text style={{ fontSize: 14, color: '#666666' }}>
        Elevação: {elevation} m
      </Text>
    </View>
  </View>
);

export default MapScreen;