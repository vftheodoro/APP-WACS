import 'react-native-get-random-values';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Text, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

export const MapScreen = () => {
  const { isDark } = useTheme();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permissão para acessar a localização foi negada');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

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

  const handlePlaceSelected = (data, details) => {
    if (details) {
      const { geometry } = details;
      mapRef.current.animateToRegion({
        latitude: geometry.location.lat,
        longitude: geometry.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  return (
    <View style={[styles.container, isDark ? styles.containerDark : null]}>
      {location ? (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Sua localização"
            />
          </MapView>

          <View style={[styles.searchContainer, isDark ? styles.searchContainerDark : null]}>
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
                },
                listView: {
                  backgroundColor: isDark ? '#333333' : '#ffffff',
                  borderRadius: 8,
                  marginTop: 5,
                },
                row: {
                  padding: 13,
                  height: 44,
                },
                description: {
                  color: isDark ? '#ffffff' : '#333333',
                },
              }}
              enablePoweredByContainer={false}
              fetchDetails={true}
              minLength={2}
              debounce={300}
              textInputProps={{
                placeholderTextColor: isDark ? '#999999' : '#666666',
              }}
            />
          </View>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={[styles.text, isDark ? styles.textDark : null]}>
            {errorMsg || 'Carregando mapa...'}
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.centerButton, isDark ? styles.centerButtonDark : null]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: '#333333',
  },
  textDark: {
    color: '#ffffff',
  },
  searchContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  searchContainerDark: {
    backgroundColor: 'transparent',
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
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  centerButtonDark: {
    backgroundColor: '#333333',
  },
});

export default MapScreen; 