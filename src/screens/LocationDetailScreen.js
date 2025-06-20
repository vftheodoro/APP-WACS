import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  FlatList, 
  TextInput,
  Alert,
  Share,
  Linking,
  Platform,
  RefreshControl,
  Modal,
  StatusBar
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchLocationById, fetchReviewsForLocation } from '../services/firebase/locations';
import { Ionicons } from '@expo/vector-icons';
import ReviewModal from '../components/ReviewModal';
import { db } from '../services/firebase/config';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  updateDoc,
  increment,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  runTransaction
} from 'firebase/firestore';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

// Constantes de cores e estilo
const COLORS = {
  primary: '#1976d2',
  primaryDark: '#004ba0',
  primaryLight: '#63a4ff',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800',
};

// Função para calcular distância
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Novas funções auxiliares
const getLocationEmoji = (rating) => {
  if (rating === undefined || rating === null || rating === 0) return { emoji: '🆕', text: 'Novo' };
  if (rating >= 4.5) return { emoji: '⭐', text: 'Excelente' };
  if (rating >= 3.5) return { emoji: '👍', text: 'Bom' };
  if (rating >= 2.0) return { emoji: '😐', text: 'Regular' };
  return { emoji: '👎', text: 'Ruim' };
};

const getRatingColor = (rating) => {
  if (rating === undefined || rating === null || rating === 0) return COLORS.textSecondary;
  if (rating >= 4.5) return COLORS.success;
  if (rating >= 3.5) return COLORS.warning;
  if (rating >= 2.0) return '#FFC107'; // Amarelo
  return COLORS.error;
};

export default function LocationDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { locationId } = route.params || {};
  
  // Estados
  const [location, setLocation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [distance, setDistance] = useState(null);
  const { currentUser } = useAuth();
  
  // Função para carregar dados
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [loc, revs] = await Promise.all([
        fetchLocationById(locationId),
        fetchReviewsForLocation(locationId)
      ]);
      
      if (!loc) throw new Error('Local não encontrado');
      
      setLocation(loc);
      setReviews(revs);
      
    } catch (err) {
      setError(err.message || 'Erro ao carregar detalhes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationId]);
  
  // Função para obter localização do usuário e calcular distância
  const getUserLocation = useCallback(async () => {
    if (!location?.latitude) return;
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permissão de localização negada');
        return;
      }
      
      let userLoc = await Location.getCurrentPositionAsync({});
        const dist = calculateDistance(
          userLoc.coords.latitude,
          userLoc.coords.longitude,
          location.latitude,
          location.longitude
        );
        setDistance(dist);
    } catch (error) {
      console.log('Erro ao obter localização:', error);
    }
  }, [location]);
  
  useEffect(() => {
    if (locationId) {
      loadData();
    }
  }, [locationId, loadData]);

  useEffect(() => {
    getUserLocation();
  }, [location, getUserLocation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Confira este local acessível no WACS: ${location.name}. Endereço: ${location.address}`,
        title: `WACS: ${location.name}`
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar o local.');
    }
  };
  
  const openInMaps = () => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${location.latitude},${location.longitude}`;
    const url = Platform.select({
      ios: `${scheme}${location.name}@${latLng}`,
      android: `${scheme}${latLng}(${location.name})`
    });
    Linking.openURL(url);
  };
  
  const toggleFavorite = () => setIsFavorite(!isFavorite);

  const handleReviewSubmit = async ({ rating, comment, featureRatings }) => {
    if (!currentUser) {
        Alert.alert("Erro", "Você precisa estar logado para avaliar um local.");
      return;
    }
    
    const locationRef = doc(db, 'locations', locationId);
    const reviewsCollectionRef = collection(db, 'locations', locationId, 'reviews');
    
    try {
        await runTransaction(db, async (transaction) => {
            const locationDoc = await transaction.get(locationRef);
            if (!locationDoc.exists()) {
                throw new Error("Local não encontrado!");
    }

            // 1. Adicionar a nova avaliação na subcoleção
            const newReviewRef = doc(reviewsCollectionRef); // Cria uma referência com ID único
            transaction.set(newReviewRef, {
                rating,
                comment,
                featureRatings,
                createdAt: serverTimestamp(),
                user: {
                    id: currentUser.uid,
                    name: currentUser.displayName || 'Anônimo',
                    photoURL: currentUser.photoURL || null,
                },
            });

            // 2. Atualizar a avaliação média e a contagem no documento do local
            const oldRating = locationDoc.data().rating || 0;
            const reviewCount = locationDoc.data().reviewCount || 0;
            const newReviewCount = reviewCount + 1;
            const newRating = ((oldRating * reviewCount) + rating) / newReviewCount;

            transaction.update(locationRef, {
                rating: newRating,
                reviewCount: increment(1),
            });
        });

        Alert.alert("Sucesso", "Sua avaliação foi enviada!");
        setReviewModalVisible(false);
        onRefresh(); // Recarrega os dados para mostrar a nova avaliação
    } catch (error) {
        console.error("Erro ao enviar avaliação: ", error);
        Alert.alert("Erro", "Não foi possível enviar sua avaliação. Por favor, tente novamente.");
    }
  };
  
  // Funções de renderização de UI
  const renderStars = (rating = 0, size = 18) => {
    const stars = Array(5).fill(0);
    return (
      <View style={styles.starsContainer}>
        {stars.map((_, i) => {
          const name = i < Math.floor(rating) ? 'star' : i < rating ? 'star-half' : 'star-outline';
          return <Ionicons key={i} name={name} size={size} color={COLORS.warning} />;
        })}
      </View>
    );
  };
  
  const getFeatureData = (featureKey) => {
    const featureMap = {
      'wheelchair': { icon: 'walk-outline', name: 'Cadeirante' },
      'blind': { icon: 'eye-off-outline', name: 'Def. Visual' },
      'deaf': { icon: 'ear-outline', name: 'Def. Auditiva' },
      'elevator': { icon: 'swap-vertical-outline', name: 'Elevador' },
      'parking': { icon: 'car-outline', name: 'Estacionamento' },
      'restroom': { icon: 'body-outline', name: 'Banheiro Adapt.' },
      'ramp': { icon: 'enter-outline', name: 'Rampa' },
      'Acessível para cadeirantes': { icon: 'walk-outline', name: 'Cadeirante' },
      'Piso tátil': { icon: 'analytics-outline', name: 'Piso Tátil' },
      'Rampa de acesso': { icon: 'enter-outline', name: 'Rampa' },
      'Banheiro acessível': { icon: 'body-outline', name: 'Banheiro' },
      'Vaga PCD': { icon: 'car-outline', name: 'Vaga PCD' },
      'Atendimento prioritário': { icon: 'people-outline', name: 'Atendimento' },
      'Cão-guia permitido': { icon: 'paw-outline', name: 'Cão-Guia' },
      'Sinalização em braile': { icon: 'bookmarks-outline', name: 'Braile' },
    };
    return featureMap[featureKey] || { icon: 'help-circle-outline', name: featureKey };
  };
  
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={60} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!location) return null;
  
  const { emoji, text: emojiText } = getLocationEmoji(location.rating);
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      
      <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{location.name}</Text>
        <View style={{flexDirection: 'row'}}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-social-outline" size={24} color="#fff" />
        </TouchableOpacity>
          <TouchableOpacity onPress={toggleFavorite} style={styles.headerButton}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? COLORS.error : "#fff"} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {location.imageUrl && (
          <Image source={{ uri: location.imageUrl }} style={styles.locationImage} />
        )}
        
        <View style={styles.mainContent}>
          <View style={styles.titleSection}>
            <Text style={styles.locationName}>{location.name}</Text>
            {distance !== null && (
              <View style={styles.distanceContainer}>
                <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                <Text style={styles.distanceText}>{distance.toFixed(1)} km de distância</Text>
          </View>
            )}
          </View>
          
          {location.author && (
            <View style={styles.authorCard}>
              {location.author.photoURL ? (
                <Image source={{ uri: location.author.photoURL }} style={styles.authorPhoto} />
              ) : (
                <View style={styles.authorPhotoPlaceholder}>
                  <Ionicons name="person-outline" size={18} color="#666" />
            </View>
              )}
              <Text style={styles.authorText}>
                Adicionado por <Text style={{fontWeight: 'bold'}}>{location.author.name || 'um usuário'}</Text>
              </Text>
          </View>
          )}
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Avaliação Geral</Text>
            <View style={styles.ratingSummary}>
              <Text style={styles.ratingScore}>{location.rating?.toFixed(1) || '-'}</Text>
              <View>
                {renderStars(location.rating, 24)}
                <Text style={styles.reviewCount}>
                    {location.reviewCount ? `${location.reviewCount} avaliações` : 'Sem avaliações'}
                  </Text>
                </View>
              <View style={[styles.emojiTag, { backgroundColor: getRatingColor(location.rating) }]}>
                <Text style={styles.emojiText}>{emoji}</Text>
                <Text style={styles.emojiTagText}>{emojiText}</Text>
              </View>
            </View>
            {location.description && (
              <Text style={styles.description}>{location.description}</Text>
            )}
          </View>
          
          <View style={styles.actionButtonsGrid}>
            <TouchableOpacity style={styles.gridButton} onPress={() => setReviewModalVisible(true)}>
              <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.gridButtonGradient}>
                <Ionicons name="star-outline" size={24} color="#fff" />
                <Text style={styles.gridButtonText}>Avaliar</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridButton} onPress={openInMaps}>
              <LinearGradient colors={['#43a047', '#66bb6a']} style={styles.gridButtonGradient}>
                <Ionicons name="map-outline" size={24} color="#fff" />
                <Text style={styles.gridButtonText}>Navegar</Text>
              </LinearGradient>
              </TouchableOpacity>
          </View>
          
          {location.accessibilityFeatures?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Recursos de Acessibilidade</Text>
              <View style={styles.featuresGrid}>
                {location.accessibilityFeatures.map((featureKey) => {
                  const data = getFeatureData(featureKey);
                  const avgRating = location.featureRatings?.[featureKey];
                  const ratingColor = getRatingColor(avgRating);
                  return (
                    <View key={featureKey} style={styles.featureItem}>
                      <Ionicons name={data.icon} size={24} color={ratingColor} />
                      <Text style={styles.featureText}>{data.name}</Text>
                      {avgRating !== undefined ? (
                        <Text style={[styles.featureRatingText, { color: ratingColor }]}>{avgRating.toFixed(1)}</Text>
                      ) : (
                        <Text style={[styles.featureRatingText, { color: COLORS.textSecondary }]}>N/A</Text>
              )}
            </View>
                  );
                })}
              </View>
            </View>
          )}
          
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Avaliações ({reviews.length})</Text>
            {reviews.length > 0 ? (
              reviews.map(item => (
                <View key={item.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    {item.photoURL ? (
                      <Image source={{uri: item.photoURL}} style={styles.reviewerPhoto} />
              ) : (
                      <View style={styles.reviewerPhotoPlaceholder}>
                         <Ionicons name="person-outline" size={18} color="#666" />
                </View>
              )}
                    <View style={styles.reviewHeaderText}>
                      <Text style={styles.reviewUser}>{item.userName || 'Anônimo'}</Text>
                      {renderStars(item.rating, 16)}
              </View>
            </View>
                  {item.comment && <Text style={styles.reviewComment}>{item.comment}</Text>}
                  
                  {item.featureRatings && Object.keys(item.featureRatings).length > 0 && (
                     <View style={styles.detailedRatingsContainer}>
                       {Object.entries(item.featureRatings).map(([feature, rating]) => {
                         const featureData = getFeatureData(feature);
                         return (
                           <View key={feature} style={styles.detailedRatingItem}>
                             <Ionicons name={featureData.icon} size={16} color={getRatingColor(rating)} />
                             <Text style={styles.detailedRatingText}>{featureData.name}:</Text>
                             {renderStars(rating, 14)}
                </View>
                         );
                       })}
              </View>
            )}

                  <Text style={styles.reviewDate}>
                    {item.createdAt?.toDate?.().toLocaleDateString?.('pt-BR') || ''}
              </Text>
                      </View>
              ))
            ) : (
              <Text style={styles.noReviewsText}>Nenhuma avaliação ainda.</Text>
            )}
                    </View>
            </View>
      </ScrollView>

      <ReviewModal 
        visible={reviewModalVisible} 
        onClose={() => setReviewModalVisible(false)}
        onSubmit={handleReviewSubmit}
        locationName={location.name}
        features={location.accessibilityFeatures || []}
      />
      
      <Modal visible={mapModalVisible} animationType="slide" onRequestClose={() => setMapModalVisible(false)}>
        <View style={styles.mapModalContainer}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.mapModalHeader}>
            <TouchableOpacity onPress={() => setMapModalVisible(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.mapModalTitle}>Localização</Text>
            <TouchableOpacity onPress={openInMaps}>
              <Ionicons name="open-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
            <Marker coordinate={location} title={location.name} />
            </MapView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: COLORS.text,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    paddingBottom: 15,
    paddingHorizontal: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  locationImage: {
    width: '100%',
    height: 250,
  },
  mainContent: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 16,
  },
  locationName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  ratingScore: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 12,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  reviewCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridButton: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  gridButtonGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    alignItems: 'center',
    width: '33%',
    paddingVertical: 12,
  },
  featureText: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  reviewItem: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUser: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 8,
  },
  noReviewsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  mapModalContainer: {
    flex: 1,
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    paddingBottom: 16,
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  map: {
    flex: 1,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 12,
  },
  authorPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  authorPhotoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emojiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  emojiText: {
    fontSize: 16,
    marginRight: 6,
  },
  emojiTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  featureRatingText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewHeaderText: {
    flex: 1,
  },
  detailedRatingsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
  },
  detailedRatingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailedRatingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginHorizontal: 8,
  },
  reviewerPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});