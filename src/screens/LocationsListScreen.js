import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchLocations } from '../services/firebase/locations';
import { Ionicons } from '@expo/vector-icons';
import AddLocationModal from '../components/AddLocationModal';
import { db, storage, auth } from '../services/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { THEME } from '../config/constants';
import { useTheme } from '../contexts/ThemeContext';


export default function LocationsListScreen() {
  const [addModalVisible, setAddModalVisible] = useState(false);

  const { theme } = useTheme();

  const [locations, setLocations] = useState([]);
  const [displayedLocations, setDisplayedLocations] = useState([]);
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
      applyDefaultSorting(data);
    } catch (err) {
      setError('Erro ao carregar locais.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const applyDefaultSorting = useCallback((locationsData) => {
    if (locationsData.length === 0) {
      setDisplayedLocations([]);
      return;
    }

    const newestLocation = locationsData[0];
    const restOfLocations = locationsData.slice(1);

    const sortedRest = [...restOfLocations].sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ratingB - ratingA;
    });

    setDisplayedLocations([newestLocation, ...sortedRest]);
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

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
      if (rating >= i) {
        stars.push(<Ionicons key={i} name="star" size={16} color={theme.colors.warning} />);
      } else if (rating >= i - 0.5) {
        stars.push(<Ionicons key={i} name="star-half" size={16} color={theme.colors.warning} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={16} color={theme.colors.warning} />);
      }
    }
    return stars;
  };

  const getLocationCardStyle = (rating) => {
    let backgroundColor = theme.colors.background;
    if (rating >= 4) {
      backgroundColor = '#f0fff0';
    } else if (rating >= 2) {
      backgroundColor = '#ffffe0';
    } else if (rating > 0) {
      backgroundColor = '#ffe0e0';
    } else if (rating === 0 || rating === null || rating === undefined) {
      backgroundColor = '#f0f0f0';
    }
    return [styles.card, { backgroundColor }];
  };

  const getRatingEmoji = (rating) => {
    if (rating >= 4) {
      return '😊';
    } else if (rating >= 2) {
      return '😐';
    } else if (rating > 0) {
      return '😞';
    } else if (rating === 0 || rating === null || rating === undefined) {
      return '➖';
    }
    return '';
  };

  const renderLocation = ({ item, index }) => {
    const isNewest = index === 0;
    return (
      <TouchableOpacity
        style={getLocationCardStyle(item.rating)}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('LocationDetail', { locationId: item.id })}
      >
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image" size={36} color={theme.colors.text} />
              <Text style={styles.placeholderText}>Sem imagem</Text>
            </View>
          )}
        </View>
        <View style={styles.details}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}</Text>
            {isNewest && (
              <View style={styles.newBadge}>
                <Ionicons name="time-outline" size={14} color={theme.colors.background} />
                <Text style={styles.newBadgeText}>NOVO</Text>
              </View>
            )}
          </View>
          <Text style={styles.address}>{item.address}</Text>
          {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
          <View style={styles.ratingRow}>
            {renderStars(item.rating)}
            <Text style={styles.ratingText}>
              {typeof item.rating === 'number' ? item.rating.toFixed(1) : '-'}
              {item.reviewCount ? ` (${item.reviewCount} avaliações)` : ''}
            </Text>
            <Text style={styles.ratingEmoji}>{getRatingEmoji(item.rating)}</Text>
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
                    <Ionicons name={data.icon} size={16} color={theme.colors.background} style={styles.accessibilityFeatureIcon} />
                    <Text style={styles.accessibilityFeatureText}>{data.name}</Text>
                  </View>
                );
              }
              return null;
            })}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.text}>Carregando locais...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={40} color={theme.colors.error} />
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
        <Ionicons name="location-outline" size={40} color={theme.colors.textSecondary || '#aaa'} />
        <Text style={styles.text}>Nenhum local adicionado ainda.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.listContainer, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={displayedLocations}
        keyExtractor={item => item.id}
        renderItem={renderLocation}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color={theme.colors.background} />
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
    backgroundColor: THEME.colors.primary,
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
    backgroundColor: THEME.colors.background,
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
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: THEME.colors.text,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: THEME.colors.text,
  },
  address: {
    fontSize: 14,
    color: THEME.colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: THEME.colors.text,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    color: THEME.colors.text,
    marginLeft: 4,
  },
  ratingEmoji: {
    fontSize: 18,
    marginLeft: 8,
  },
  accessibilityFeaturesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  accessibilityFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  accessibilityFeatureIcon: {
    marginRight: 4,
  },
  accessibilityFeatureText: {
    fontSize: 12,
    color: THEME.colors.background,
    fontWeight: 'bold',
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
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 16
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#333',
  },
  selectedFilterButton: {
    backgroundColor: THEME.colors.primary,
  },
  selectedFilterButtonText: {
    color: THEME.colors.background,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.success,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  newBadgeText: {
    fontSize: 10,
    color: THEME.colors.background,
    fontWeight: 'bold',
    marginLeft: 2,
  },
});
