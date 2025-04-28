import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, Alert, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ThemeContext';
import { GOOGLE_MAPS_API_KEY } from '../config/maps';
import { Ionicons } from '@expo/vector-icons';

// Dados de exemplo para locais acessíveis
const LOCATIONS = [
  {
    id: '1',
    title: 'Shopping Center',
    description: 'Shopping com acessibilidade completa',
    latitude: -23.5505,
    longitude: -46.6333,
    category: 'shopping',
    rating: 4.5,
    features: ['Rampa de acesso', 'Banheiro adaptado', 'Estacionamento prioritário']
  },
  {
    id: '2',
    title: 'Hospital Municipal',
    description: 'Hospital com rampas e elevadores',
    latitude: -23.5515,
    longitude: -46.6343,
    category: 'hospital',
    rating: 4.8,
    features: ['Elevadores', 'Banheiro adaptado', 'Sinalização em braile']
  },
  {
    id: '3',
    title: 'Restaurante Acessível',
    description: 'Restaurante com banheiro adaptado',
    latitude: -23.5525,
    longitude: -46.6353,
    category: 'restaurant',
    rating: 4.2,
    features: ['Cardápio em braile', 'Banheiro adaptado', 'Mesas adequadas']
  },
  {
    id: '4',
    title: 'Biblioteca Municipal',
    description: 'Espaço de leitura totalmente acessível',
    latitude: -23.5495,
    longitude: -46.6323,
    category: 'education',
    rating: 4.7,
    features: ['Elevador', 'Livros em braile', 'Computadores adaptados']
  },
  {
    id: '5',
    title: 'Parque Acessível',
    description: 'Parque com acessibilidade para todos',
    latitude: -23.5535,
    longitude: -46.6363,
    category: 'park',
    rating: 4.6,
    features: ['Playground adaptado', 'Banheiros acessíveis', 'Trilhas planas']
  },
  {
    id: '6',
    title: 'Cinema Inclusivo',
    description: 'Salas adaptadas para todos os públicos',
    latitude: -23.5485,
    longitude: -46.6313,
    category: 'entertainment',
    rating: 4.4,
    features: ['Audiodescrição', 'Legendas especiais', 'Lugares para cadeirantes']
  }
];

// Função para obter ícone baseado na categoria
const getCategoryIcon = (category) => {
  switch (category) {
    case 'shopping':
      return 'cart-outline';
    case 'hospital':
      return 'medical-outline';
    case 'restaurant':
      return 'restaurant-outline';
    case 'education':
      return 'book-outline';
    case 'park':
      return 'leaf-outline';
    case 'entertainment':
      return 'film-outline';
    default:
      return 'location-outline';
  }
};

export const MapScreen = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useTheme();
  const [region, setRegion] = useState({
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
        });
        
        setLocation(location);
        
        // Atualizar a região do mapa com a localização atual do usuário
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        
        setErrorMsg(null);
        console.log('Localização obtida:', location.coords);
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

    // Configurar um observador para atualizações de localização
    let locationSubscription;
    
    const setupLocationSubscription = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 10, // Atualiza a cada 10 metros de distância
            timeInterval: 5000, // Atualiza a cada 5 segundos
          },
          (newLocation) => {
            setLocation(newLocation);
            console.log('Localização atualizada:', newLocation.coords);
          }
        );
      }
    };

    setupLocationSubscription();

    // Limpar o observador quando o componente for desmontado
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
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
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
        customMapStyle={isDark ? darkMapStyle : []}
      >
        {LOCATIONS.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            title={place.title}
            description={place.description}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerIconContainer, { backgroundColor: getMarkerColor(place.category) }]}>
                <Ionicons name={getCategoryIcon(place.category)} size={16} color="white" />
              </View>
            </View>
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{place.title}</Text>
                <Text style={styles.calloutDescription}>{place.description}</Text>
                <View style={styles.calloutRating}>
                  <Text style={styles.calloutRatingText}>Avaliação: {place.rating}/5</Text>
                  <View style={styles.calloutStars}>
                    {Array(5).fill(0).map((_, index) => (
                      <Ionicons 
                        key={index}
                        name={index < Math.floor(place.rating) ? 'star' : (index < place.rating ? 'star-half' : 'star-outline')}
                        size={12}
                        color="#FFD700"
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.calloutFeatureTitle}>Recursos de acessibilidade:</Text>
                {place.features.map((feature, index) => (
                  <Text key={index} style={styles.calloutFeature}>• {feature}</Text>
                ))}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      <TouchableOpacity 
        style={styles.recenterButton} 
        onPress={() => {
          if (location) {
            setRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }}
      >
        <Ionicons name="locate" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

// Função para obter cor do marcador baseada na categoria
const getMarkerColor = (category) => {
  switch (category) {
    case 'shopping':
      return '#FF6B6B';
    case 'hospital':
      return '#4D96FF';
    case 'restaurant':
      return '#FFD166';
    case 'education':
      return '#6BCB77';
    case 'park':
      return '#4E9F3D';
    case 'entertainment':
      return '#9D4EDD';
    default:
      return '#2C3E50';
  }
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
  markerContainer: {
    alignItems: 'center',
  },
  markerIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
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
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
    marginBottom: 6,
  },
  calloutRating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  calloutRatingText: {
    fontSize: 11,
  },
  calloutStars: {
    flexDirection: 'row',
  },
  calloutFeatureTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  calloutFeature: {
    fontSize: 11,
    marginLeft: 2,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#007AFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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