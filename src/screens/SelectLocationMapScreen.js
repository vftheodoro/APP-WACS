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
  Alert,
  Animated
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
  const listOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setInitialRegion(FALLBACK_COORDINATES);
        return;
      }
      try {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setInitialRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      } catch (error) {
        setInitialRegion(FALLBACK_COORDINATES);
      }
    })();
    return () => clearTimeout(debounceTimeout.current);
  }, []);
  
  useEffect(() => {
    Animated.timing(listOpacity, {
      toValue: results.length > 0 ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [results]);

  const handleSearch = (text) => {
    setSearch(text);
    clearTimeout(debounceTimeout.current);
    if (text.length < 3) {
      setResults([]);
      return;
    }
    debounceTimeout.current = setTimeout(async () => {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_APIKEY}&language=pt-BR&components=country:br`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        setResults(data.predictions || []);
      } catch (e) {
        setResults([]);
      }
    }, 400);
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
        
        setMarker(newMarker);
        const name = data.result.name;
        setSearch(name);
        setSelectedName(name);
        setSelectedAddress(data.result.formatted_address);

        const photoRef = data.result.photos?.[0]?.photo_reference;
        setSelectedPhotoUrl(photoRef ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${GOOGLE_MAPS_APIKEY}` : null);
        
        mapRef.current?.animateToRegion({ ...newMarker, latitudeDelta: 0.005, longitudeDelta: 0.005 });
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível buscar os detalhes do local.");
    }
  };
  
  const handleMapInteraction = async (e) => {
    const { coordinate, placeId } = e.nativeEvent;
    if (placeId) {
      await handleSelectResult(placeId);
    } else {
      setMarker(coordinate);
      setSearch('Buscando endereço...');
      setSelectedName('');
      setSelectedPhotoUrl(null);
      
      const reverseUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${GOOGLE_MAPS_APIKEY}&language=pt-BR`;
      try {
        const response = await fetch(reverseUrl);
        const data = await response.json();
        const address = data.results?.[0]?.formatted_address;
        setSearch(address || 'Endereço não encontrado');
        setSelectedAddress(address || 'Endereço não encontrado');
      } catch (error) {
        setSearch('Erro ao buscar endereço');
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

  const clearSearch = () => {
    setSearch('');
    setResults([]);
  };

  if (!initialRegion) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Selecione um Local</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.searchContainerWrapper}>
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
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={COLORS.border} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Animated.View style={[styles.resultsListContainer, { opacity: listOpacity }]}>
        <FlatList
          data={results}
          keyExtractor={item => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => handleSelectResult(item.place_id)}>
              <View style={styles.resultIcon}>
                <Ionicons name="location-outline" size={22} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.resultMainText}>{item.structured_formatting.main_text}</Text>
                <Text style={styles.resultSecondaryText}>{item.structured_formatting.secondary_text}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyboardShouldPersistTaps="handled"
        />
      </Animated.View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onPress={handleMapInteraction}
        onPoiClick={handleMapInteraction}
        showsUserLocation
        showsPointsOfInterest
        userInterfaceStyle="light"
      >
        {marker && <Marker coordinate={marker} pinColor={COLORS.primary} />}
      </MapView>
      
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleConfirm} disabled={!marker} activeOpacity={0.8}>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'android' ? 40 : 50, paddingBottom: 50, paddingHorizontal: 16, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textLight },
  searchContainerWrapper: { position: 'absolute', top: Platform.OS === 'android' ? 90 : 100, left: 0, right: 0, zIndex: 10, paddingHorizontal: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 15, height: 50, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 16, color: COLORS.text },
  clearButton: { padding: 4 },
  resultsListContainer: { position: 'absolute', top: Platform.OS === 'android' ? 145 : 155, left: 20, right: 20, maxHeight: 220, zIndex: 9, backgroundColor: COLORS.surface, borderRadius: 12, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, overflow: 'hidden' },
  resultItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  resultIcon: { marginRight: 12 },
  resultMainText: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  resultSecondaryText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  map: { flex: 1, zIndex: -1 },
  bottomBar: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderColor: COLORS.border },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 14 },
  confirmText: { color: COLORS.textLight, fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
});
