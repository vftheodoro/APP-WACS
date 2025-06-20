import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  Dimensions, 
  ActivityIndicator, 
  Platform, 
  Keyboard,
  Alert
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

const GOOGLE_MAPS_APIKEY = Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY;
const { width } = Dimensions.get('window');

// Cores e Estilos Padrão
const COLORS = {
  primary: '#1976d2',
  primaryDark: '#004ba0',
  gradientStart: '#1976d2',
  gradientEnd: '#2196f3',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  textLight: '#fff',
  border: '#e0e0e0',
};

const FALLBACK_COORDINATES = {
  latitude: -24.489,
  longitude: -47.844,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Componente para renderizar cada item do resultado da busca
const SearchResultItem = ({ item, onPress }) => {
  // Mapeia os tipos de local do Google para ícones do Ionicons
  const getIconForType = (types) => {
    if (types.includes('restaurant') || types.includes('food')) return 'restaurant-outline';
    if (types.includes('store') || types.includes('shopping_mall')) return 'cart-outline';
    if (types.includes('lodging')) return 'bed-outline';
    if (types.includes('establishment')) return 'business-outline';
    if (types.includes('point_of_interest')) return 'star-outline';
    return 'location-outline';
  };

  // Função para destacar o texto correspondente
  const renderHighlightedText = () => {
    const { description, matched_substrings } = item;
    if (!matched_substrings || matched_substrings.length === 0) {
      return <Text style={styles.resultText}>{description}</Text>;
    }

    const firstMatch = matched_substrings[0];
    const { offset, length } = firstMatch;

    const before = description.substring(0, offset);
    const matched = description.substring(offset, offset + length);
    const after = description.substring(offset + length);
    
    return (
      <Text style={styles.resultText} numberOfLines={1}>
        {before}
        <Text style={styles.highlightedText}>{matched}</Text>
        {after}
      </Text>
    );
  };

  return (
    <TouchableOpacity style={styles.resultItem} onPress={onPress}>
      <View style={styles.resultIconContainer}>
        <Ionicons name={getIconForType(item.types)} size={22} color={COLORS.primary} />
      </View>
      {renderHighlightedText()}
    </TouchableOpacity>
  );
};

export default function SelectLocationMapScreen({ navigation }) {
  const [marker, setMarker] = useState(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null);
  const [initialRegion, setInitialRegion] = useState(null);
  const mapRef = useRef(null);
  const debounceTimeout = useRef(null);

  // Função para usar a localização atual do usuário e ir para a próxima tela
  const handleUseCurrentLocation = async (location) => {
    const { latitude, longitude } = location.coords;

    // Define o marcador para feedback visual imediato
    setMarker({ latitude, longitude });
    mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 });

    // Busca o endereço correspondente
    const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_APIKEY}&language=pt-BR`;
    try {
        const response = await fetch(reverseGeocodeUrl);
        const data = await response.json();
        const address = data.results?.[0]?.formatted_address || 'Minha Localização Atual';
        
        // Navega diretamente para a tela de adicionar detalhes
        navigation.navigate('AddLocation', {
            latitude,
            longitude,
            address,
            name: 'Minha Localização Atual',
            photoUrl: null,
        });
    } catch (error) {
        Alert.alert("Erro", "Não foi possível obter o endereço da sua localização. Por favor, selecione manualmente no mapa.");
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setInitialRegion(FALLBACK_COORDINATES);
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        // Define a região inicial do mapa
        setInitialRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        // Pergunta ao usuário se ele quer usar a localização atual
        Alert.alert(
          "Usar Localização Atual?",
          "Deseja registrar um novo local na sua posição atual?",
          [
            { text: "Não, obrigado", style: "cancel" },
            { 
              text: "Sim, usar", 
              onPress: () => handleUseCurrentLocation(location) 
            }
          ]
        );

      } catch (error) {
        setInitialRegion(FALLBACK_COORDINATES);
      }
    })();

    // Cleanup do debounce
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (text.length < 3) {
      setResults([]);
      return;
    }
    debounceTimeout.current = setTimeout(async () => {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_APIKEY}&language=pt-BR&components=country:br`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.predictions) setResults(data.predictions);
      } catch (e) {
        setResults([]);
      }
    }, 400); // 400ms debounce
  };

  const handleSelectResult = async (placeId) => {
    Keyboard.dismiss();
    setResults([]);
    const fields = 'name,formatted_address,geometry,photo';
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_APIKEY}&language=pt-BR&fields=${fields}`;
    try {
      const response = await fetch(detailsUrl);
      const data = await response.json();
      if (data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        const newMarker = { latitude: lat, longitude: lng };
        
        // Atualiza os estados
        setMarker(newMarker);
        const name = data.result.name || data.result.formatted_address;
        setSearch(name);
        setSelectedName(name);
        setSelectedAddress(data.result.formatted_address);

        // Lógica da Foto
        const photoRef = data.result.photos?.[0]?.photo_reference;
        if (photoRef) {
          const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${GOOGLE_MAPS_APIKEY}`;
          setSelectedPhotoUrl(photoUrl);
        } else {
          setSelectedPhotoUrl(null);
        }

        mapRef.current?.animateToRegion({ ...newMarker, latitudeDelta: 0.005, longitudeDelta: 0.005 });
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível buscar os detalhes do local selecionado.");
    }
  };
  
  const handleMapPress = async (e) => {
    const { coordinate, placeId } = e.nativeEvent;
    if (placeId) {
      handleSelectResult(placeId);
    } else {
      setMarker(coordinate);
      const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${GOOGLE_MAPS_APIKEY}&language=pt-BR`;
      try {
        const response = await fetch(reverseGeocodeUrl);
        const data = await response.json();
        const bestResult = data.results?.[0]?.formatted_address;
        setSelectedAddress(bestResult || 'Endereço não encontrado');
        setSearch(bestResult || '');
      } catch (error) {
        setSelectedAddress('Erro ao buscar endereço');
        setSearch('');
      }
    }
  };

  const handleConfirm = () => {
    if (!marker) return;
    navigation.navigate('AddLocation', {
      latitude: marker.latitude,
      longitude: marker.longitude,
      address: selectedAddress,
      name: selectedName || search,
      photoUrl: selectedPhotoUrl,
    });
  };

  if (!initialRegion) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={styles.loadingText}>Buscando sua localização...</Text></View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Selecione o Local</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar endereço ou local..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={COLORS.border} />
          </TouchableOpacity>
        )}
      </View>
      {results.length > 0 && (
        <View style={styles.resultsListContainer}>
          <FlatList
            data={results}
            keyExtractor={item => item.place_id}
            renderItem={({ item }) => (
              <SearchResultItem item={item} onPress={() => handleSelectResult(item.place_id)} />
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onPress={handleMapPress}
        showsUserLocation
        showsPointsOfInterest
        userInterfaceStyle="light"
      >
        {marker && <Marker coordinate={marker} pinColor={COLORS.primary} />}
      </MapView>
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleConfirm} disabled={!marker}>
            <LinearGradient
                colors={!marker ? ['#a9a9a9', '#d3d3d3'] : [COLORS.gradientStart, COLORS.gradientEnd]}
                style={styles.confirmBtn}
            >
                <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.textLight} />
                <Text style={styles.confirmText}>Confirmar Local</Text>
            </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.textSecondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'android' ? 40 : 50, paddingBottom: 45, paddingHorizontal: 16, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textLight },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginTop: -35,
    zIndex: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 55,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 5,
  },
  clearButton: {
    padding: 5,
  },
  resultsListContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 140 : 160,
    left: 20,
    right: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    maxHeight: 250,
    zIndex: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  resultText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
  },
  highlightedText: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  map: { flex: 1, width },
  bottomBar: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderColor: COLORS.border },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 14, width: '100%' },
  confirmText: { color: COLORS.textLight, fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
});
