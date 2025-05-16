import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchLocations } from '../services/firebase/locations';
import { Ionicons } from '@expo/vector-icons';
import AddLocationModal from '../components/AddLocationModal';
import { db, storage, auth } from '../services/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


export default function LocationsListScreen() {
  const [addModalVisible, setAddModalVisible] = useState(false);

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const navigation = useNavigation();

  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLocations();
      setLocations(data);
    } catch (err) {
      setError('Erro ao carregar locais.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // Detectar quando a tela recebe parâmetros de localização selecionada
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Verificar se há dados de localização nos parâmetros
      const route = navigation.getState().routes.find(r => r.name === 'LocationsList');
      if (route?.params?.selectedLat && route?.params?.selectedLng) {
        console.log('Recebeu localização selecionada:', route.params);
        
        // Armazenar os dados de localização no estado
        setSelectedLocation({
          latitude: route.params.selectedLat,
          longitude: route.params.selectedLng,
          address: route.params.selectedAddress || ''
        });
        
        // Limpar os parâmetros da rota
        navigation.setParams({
          selectedLat: undefined,
          selectedLng: undefined,
          selectedAddress: undefined
        });
        
        // Abrir o modal automaticamente
        setAddModalVisible(true);
      }
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLocations();
  };

  const renderStars = (rating = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<Ionicons key={i} name="star" size={16} color="#FFD700" />);
      } else if (rating >= i - 0.5) {
        stars.push(<Ionicons key={i} name="star-half" size={16} color="#FFD700" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={16} color="#FFD700" />);
      }
    }
    return stars;
  };

  const renderLocation = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('LocationDetail', { locationId: item.id })}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image" size={36} color="#aaa" />
            <Text style={styles.placeholderText}>Sem imagem</Text>
          </View>
        )}
      </View>
      <View style={styles.details}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.address}>{item.address}</Text>
        {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
        <View style={styles.ratingRow}>
          {renderStars(item.rating)}
          <Text style={styles.ratingText}>
            {typeof item.rating === 'number' ? item.rating.toFixed(1) : '-'}
            {item.reviewCount ? ` (${item.reviewCount} avaliações)` : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Carregando locais...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={40} color="#FF3B30" />
        <Text style={styles.text}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadLocations}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (locations.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="location-outline" size={40} color="#aaa" />
        <Text style={styles.text}>Nenhum local adicionado ainda.</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={locations}
        keyExtractor={item => item.id}
        renderItem={renderLocation}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
      <AddLocationModal
        visible={addModalVisible}
        onClose={() => {
          setAddModalVisible(false);
          setSelectedLocation(null); // Limpar dados de localização ao fechar
        }}
        navigation={navigation}
        selectedLocation={selectedLocation} // Passar dados diretamente para o modal
        onSubmit={async ({ name, address, latitude, longitude, accessibility, image }) => {
          try {
            let imageUrl = '';
            if (image && image.uri) {
              try {
                // Obter usuário atual
                const currentUser = auth.currentUser;
                if (!currentUser) {
                  throw new Error('Usuário não autenticado');
                }
                
                // Processar nome para arquivo
                const timestamp = new Date().getTime();
                const safeFileName = `${currentUser.uid}_${timestamp}_${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.jpg`;
                
                // Usar o mesmo caminho que funciona para fotos de perfil
                const storageRef = ref(storage, `profile_pictures/${safeFileName}`);
                
                console.log('Tentando fazer upload para:', `profile_pictures/${safeFileName}`);
                
                // Converter a imagem para blob
                const response = await fetch(image.uri);
                const blob = await response.blob();
                
                // Fazer upload
                await uploadBytes(storageRef, blob);
                imageUrl = await getDownloadURL(storageRef);
                console.log('Upload concluído com sucesso. URL:', imageUrl);
              } catch (uploadError) {
                console.error('Erro detalhado no upload da imagem:', uploadError);
                alert(`Erro no upload da imagem: ${uploadError.message}`);
                throw uploadError;
              }
            }
            await addDoc(collection(db, 'accessibleLocations'), {
              name,
              address,
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              accessibilityOptions: accessibility,
              imageUrl,
              createdAt: serverTimestamp(),
            });
            loadLocations();
          } catch (e) {
            alert('Erro ao adicionar local: ' + (e.message || e));
          }
        }}
      />
    </View>
  );

}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 6,
    zIndex: 100,
  },

  listContainer: {
    flex: 1,
    backgroundColor: '#f7faff',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#eaeaea',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  address: {
    fontSize: 14,
    color: '#444',
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingText: {
    fontSize: 13,
    color: '#333',
    marginLeft: 6,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  text: {
    fontSize: 17,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
