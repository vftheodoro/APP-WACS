import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const GOOGLE_MAPS_APIKEY = Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY;
const { width, height } = Dimensions.get('window');

export default function SelectLocationMapScreen({ route, navigation }) {
  const [marker, setMarker] = useState(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const mapRef = useRef();

  const handleSearch = async (text) => {
    setSearch(text);
    if (text.length < 3) {
      setResults([]);
      return;
    }
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_APIKEY}&language=pt-BR&components=country:br`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.predictions) setResults(data.predictions);
    } catch (e) {
      setResults([]);
    }
  };

  const handleSelectResult = async (place) => {
    setSearch(place.description);
    setResults([]);
    try {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${GOOGLE_MAPS_APIKEY}&language=pt-BR`;
      const response = await fetch(detailsUrl);
      const data = await response.json();
      if (data.result && data.result.geometry && data.result.geometry.location) {
        const { lat, lng } = data.result.geometry.location;
        setMarker({ latitude: lat, longitude: lng });
        setSelectedAddress(data.result.formatted_address || place.description);
        mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      }
    } catch (e) {}
  };

  const handleMapPress = (e) => {
    setMarker(e.nativeEvent.coordinate);
    setSelectedAddress('');
  };

  const handleConfirm = () => {
    if (!marker) return;
    
    // Obter a tela de retorno dos parâmetros ou usar LocationsList como padrão
    const returnScreen = route.params?.returnScreen || 'LocationsList';
    
    // Dados do local selecionado
    const locationData = {
      selectedLat: marker.latitude,
      selectedLng: marker.longitude,
      selectedAddress: selectedAddress || search,
    };
    
    console.log('Confirmando local:', locationData);
    
    // Retornar à tela anterior com os dados do local selecionado
    navigation.navigate({
      name: returnScreen,
      params: locationData,
      merge: true,
    });
  };


  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Selecione o Local</Text>
      </View>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar endereço ou local..."
          value={search}
          onChangeText={handleSearch}
        />
      </View>
      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={item => item.place_id}
          style={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => handleSelectResult(item)}>
              <Text style={styles.resultText}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}
      <MapView
        ref={mapRef}
        style={{ flex: 1, width }}
        initialRegion={{
          latitude: -23.55052,
          longitude: -46.633308,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        onPress={handleMapPress}
      >
        {marker && <Marker coordinate={marker} />}
      </MapView>
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, !marker && { backgroundColor: '#ccc' }]}
          onPress={handleConfirm}
          disabled={!marker}
        >
          <Ionicons name="checkmark" size={22} color="#fff" />
          <Text style={styles.confirmText}>Confirmar Local</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 46,
    paddingBottom: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f6',
    borderRadius: 8,
    margin: 12,
    paddingHorizontal: 8,
    height: 38,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#222',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 46,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 40, // Para compensar o botão de voltar e centralizar o título
  },
  bottomBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 300,
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});
