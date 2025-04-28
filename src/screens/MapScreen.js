import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ThemeContext';
import { GOOGLE_MAPS_API_KEY } from '../config/maps';

// Dados de exemplo para locais acessíveis
const LOCATIONS = [
  {
    id: '1',
    title: 'Shopping Center',
    description: 'Shopping com acessibilidade completa',
    latitude: -23.5505,
    longitude: -46.6333,
    category: 'shopping',
  },
  {
    id: '2',
    title: 'Hospital Municipal',
    description: 'Hospital com rampas e elevadores',
    latitude: -23.5515,
    longitude: -46.6343,
    category: 'hospital',
  },
  {
    id: '3',
    title: 'Restaurante Acessível',
    description: 'Restaurante com banheiro adaptado',
    latitude: -23.5525,
    longitude: -46.6353,
    category: 'restaurant',
  },
];

export const MapScreen = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useTheme();
  const [region, setRegion] = React.useState({
    latitude: -23.550520,
    longitude: -46.633308,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const requestLocationPermission = async () => {
    try {
      setIsLoading(true);
      console.log('Solicitando permissão de localização...');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Status da permissão:', status);

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
        });
        setLocation(location);
        setErrorMsg(null);
      } else {
        setErrorMsg('Permissão para acessar localização foi negada');
        Alert.alert(
          'Permissão Necessária',
          'Precisamos da sua permissão para mostrar locais próximos a você. Por favor, habilite a localização nas configurações.',
          [
            { 
              text: 'Configurações',
              onPress: () => {
                // Abrir configurações do dispositivo
                Location.getProviderStatusAsync().then((status) => {
                  if (!status.locationServicesEnabled) {
                    Alert.alert(
                      'Serviços de Localização',
                      'Por favor, ative os serviços de localização nas configurações do seu dispositivo.',
                      [{ text: 'OK' }]
                    );
                  }
                });
              }
            },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      setErrorMsg('Não foi possível obter a localização atual. Por favor, verifique se o GPS está ativado.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando mapa...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestLocationPermission}
        >
          <Text style={styles.buttonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
        customMapStyle={isDark ? darkMapStyle : []}
      >
        <Marker
          coordinate={{
            latitude: region.latitude,
            longitude: region.longitude,
          }}
          title="Localização do Robô"
          description="Posição atual do robô"
        />
        {LOCATIONS.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            title={place.title}
            description={place.description}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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