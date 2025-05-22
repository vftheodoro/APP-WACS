import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
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
  const [sortedLocations, setSortedLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);

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
  }, [selectedFilter]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    let currentLocations = [...locations];
    
    switch (selectedFilter) {
      case 'oldest':
        currentLocations.sort((a, b) => (a.createdAt?.toDate?.() || 0) - (b.createdAt?.toDate?.() || 0));
        break;
      case 'best_rated':
        currentLocations.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          if (ratingB !== ratingA) {
            return ratingB - ratingA;
          } else {
            return (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0);
          }
        });
        break;
      case 'worst_rated':
        currentLocations.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          if (ratingA !== ratingB) {
            return ratingA - ratingB;
          } else {
            return (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0);
          }
        });
        break;
      case 'recent':
      default:
        currentLocations.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
        break;
    }
    
    setSortedLocations(currentLocations);
  }, [locations, selectedFilter]);

  const clearFilters = () => {
    setSelectedFilter('recent');
    setShowFilters(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const route = navigation.getState().routes.find(r => r.name === 'LocationsList');
      if (route?.params?.selectedLat && route?.params?.selectedLng) {
        console.log('Recebeu localização selecionada:', route.params);
        
        setSelectedLocation({
          latitude: route.params.selectedLat,
          longitude: route.params.selectedLng,
          address: route.params.selectedAddress || ''
        });
        
        navigation.setParams({
          selectedLat: undefined,
          selectedLng: undefined,
          selectedAddress: undefined
        });
        
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
      const isFilled = rating >= i;
      const isHalf = rating >= i - 0.5 && rating < i;
      const starName = isFilled ? "star" : isHalf ? "star-half" : "star-outline";
      
      const starStyle = { marginRight: i < 5 ? 2 : 0 };

      stars.push(
        <Ionicons
          key={i}
          name={starName}
          size={18}
          color="#FFD700"
          style={starStyle}
        />
      );
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
        {(() => {
          let backgroundColor = 'transparent';
          let emoji = '';
          const rating = item.rating || 0;

          if (rating === 0) {
            backgroundColor = '#e0e0e0';
            emoji = ' ❔';
          } else if (rating < 2.5) {
            backgroundColor = '#ffebeb';
            emoji = ' 😠';
          } else if (rating < 4.0) {
            backgroundColor = '#fff8e1';
            emoji = ' 😐';
          } else {
            backgroundColor = '#ebf7eb';
            emoji = ' 😊';
          }

          return (
            <View style={[styles.detailsContent, { backgroundColor }]}>
              <View style={styles.ratingRow}>
                {renderStars(item.rating)}
                <Text style={styles.ratingText}>
                  {typeof item.rating === 'number' && item.rating > 0 ? item.rating.toFixed(1) : '-'}
                  {item.reviewCount ? ` (${item.reviewCount} avaliações)` : ''}
                </Text>
                <Text style={styles.ratingIndicator}>
                  {emoji}
                </Text>
              </View>
              <View style={styles.accessibilityFeaturesContainer}>
                {(item.accessibilityFeatures || []).map((feature, index) => {
                  const featureData = {
                    'wheelchair': { icon: 'walk', name: 'Cadeira de Rodas' },
                    'blind': { icon: 'eye-off', name: 'Piso Tátil' },
                    'deaf': { icon: 'ear', name: 'Surdez' },
                    'elevator': { icon: 'swap-vertical', name: 'Elevador' },
                    'parking': { icon: 'car', name: 'Estacionamento' },
                    'restroom': { icon: 'body', name: 'Banheiro Adaptado' },
                    'ramp': { icon: 'enter', name: 'Rampa' }
                  };
                  const data = featureData[feature];
                  if (data) {
                    return (
                      <View key={index} style={styles.accessibilityFeatureItem}>
                        <Ionicons name={data.icon} size={16} color="#0055b3" style={styles.accessibilityFeatureIcon} />
                        <Text style={styles.accessibilityFeatureText}>{data.name}</Text>
                      </View>
                    );
                  }
                  return null;
                })}
              </View>
            </View>
          );
        })()}
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
      <TouchableOpacity
        style={styles.toggleFiltersButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Ionicons name={showFilters ? "filter-circle" : "filter-circle-outline"} size={24} color="#007AFF" />
        <Text style={styles.toggleFiltersButtonText}>{showFilters ? "Esconder Filtros" : "Mostrar Filtros"}</Text>
      </TouchableOpacity>

      {showFilters && (
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContainer}>
          <View style={styles.filterContainerContent}>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'recent' && styles.activeFilterButton]}
              onPress={() => setSelectedFilter('recent')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === 'recent' && styles.activeFilterButtonText]}>Mais Recentes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'oldest' && styles.activeFilterButton]}
              onPress={() => setSelectedFilter('oldest')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === 'oldest' && styles.activeFilterButtonText]}>Mais Antigos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'best_rated' && styles.activeFilterButton]}
              onPress={() => setSelectedFilter('best_rated')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === 'best_rated' && styles.activeFilterButtonText]}>Melhor Avaliados</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedFilter === 'worst_rated' && styles.activeFilterButton]}
              onPress={() => setSelectedFilter('worst_rated')}
            >
              <Text style={[styles.filterButtonText, selectedFilter === 'worst_rated' && styles.activeFilterButtonText]}>Pior Avaliados</Text>
            </TouchableOpacity>
            {selectedFilter !== 'recent' && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Ionicons name="close-circle" size={16} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.clearFiltersButtonText}>Limpar</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      <FlatList
        data={sortedLocations}
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
          setSelectedLocation(null);
        }}
        navigation={navigation}
        selectedLocation={selectedLocation}
        onSubmit={async ({ name, address, latitude, longitude, accessibility, image }) => {
          try {
            let imageUrl = '';
            if (image && image.uri) {
              try {
                const currentUser = auth.currentUser;
                if (!currentUser) {
                  throw new Error('Usuário não autenticado');
                }
                
                const timestamp = new Date().getTime();
                const safeFileName = `${currentUser.uid}_${timestamp}_${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.jpg`;
                
                const storageRef = ref(storage, `profile_pictures/${safeFileName}`);
                
                console.log('Tentando fazer upload para:', `profile_pictures/${safeFileName}`);
                
                const response = await fetch(image.uri);
                const blob = await response.blob();
                
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
              accessibilityFeatures: accessibility,
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
  },
  detailsContent: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    overflow: 'hidden',
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
  ratingIndicator: {
    fontSize: 16,
    marginLeft: 4,
  },
  accessibilityFeaturesContainer: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  accessibilityFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0eaff',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 6,
  },
  accessibilityFeatureIcon: {
    marginRight: 4,
    color: '#0055b3',
  },
  accessibilityFeatureText: {
    fontSize: 12,
    color: '#0055b3',
    fontWeight: '500',
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterContainerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    columnGap: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#555',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  activeFilterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  toggleFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  toggleFiltersButtonText: {
    fontSize: 15,
    color: '#007AFF',
    marginLeft: 8,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  clearFiltersButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  filterScrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
