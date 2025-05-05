import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const GOOGLE_MAPS_APIKEY = Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY;

export const MapScreen = () => {
  const [location, setLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [info, setInfo] = useState({ distance: '', duration: '', instruction: '' });
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const mapRef = useRef(null);
  const locationWatcher = useRef(null);

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
      getRoute(location, destination);
    } else {
      setRouteCoords([]);
      setInfo({ distance: '', duration: '', instruction: '' });
    }
  }, [destination, location]);

  // Função para buscar rota na Google Directions API
  const getRoute = async (origin, dest) => {
    setLoadingRoute(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${dest.latitude},${dest.longitude}&key=${GOOGLE_MAPS_APIKEY}`;
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
      }
    } catch (e) {
      setErrorMsg('Erro ao buscar rota');
    }
    setLoadingRoute(false);
  };

  // Decodificador de polyline Google
  function decodePolyline(encoded) {
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

  // Cancelar navegação
  const cancelNavigation = () => {
    setDestination(null);
    setRouteCoords([]);
    setInfo({ distance: '', duration: '', instruction: '' });
  };

  return (
    <View style={{ flex: 1 }}>
      {location ? (
          <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          onLongPress={handleLongPress}
        >
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title="Você"
            pinColor="#007bff"
          />
          {destination && (
            <Marker
              coordinate={destination}
              title="Destino"
              pinColor="#FF0000"
            />
          )}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={6}
              strokeColor="#007bff"
            />
          )}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={{ marginTop: 10 }}>{errorMsg || 'Carregando localização...'}</Text>
        </View>
      )}
      {/* Botão centralizar */}
      <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={28} color="#fff" />
      </TouchableOpacity>
      {/* Painel de rota */}
      {destination && routeCoords.length > 0 && (
        <View style={styles.routePanel}>
          <Text style={styles.routeText}>Distância: {info.distance} | Tempo: {info.duration}</Text>
          <Text style={styles.routeText}>Próxima instrução: {info.instruction}</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelNavigation}>
            <Ionicons name="close" size={20} color="#fff" />
            <Text style={{ color: '#fff', marginLeft: 8 }}>Cancelar Navegação</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Dica de uso */}
      {!destination && (
        <View style={styles.tipPanel}>
          <Text style={styles.tipText}>Toque longo no mapa para definir o destino</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#007bff',
    borderRadius: 30,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10,
  },
  routePanel: {
    position: 'absolute',
    top: 40,
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
    zIndex: 10,
  },
  routeText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 8,
    alignSelf: 'flex-end',
    marginTop: 8,
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
    backgroundColor: '#fff',
    color: '#007bff',
    padding: 10,
    borderRadius: 8,
    fontSize: 15,
    elevation: 2,
  },
});