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
  Dimensions,
  Alert,
  Share,
  Linking,
  Platform,
  Animated,
  RefreshControl,
  Modal,
  StatusBar
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { fetchLocationById, fetchReviewsForLocation } from '../services/firebase/locations';
import { Ionicons } from '@expo/vector-icons';
import AccessibilityIcons from '../components/AccessibilityIcons';
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
  limit
} from 'firebase/firestore';
import { THEME } from '../config/constants';
import { useTheme } from '../contexts/ThemeContext';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 300;
const PARALLAX_HEADER_HEIGHT = 250;

// Função melhorada para obter cor do ícone da acessibilidade
const getFeatureIconColor = (score, themeColors) => {
  const colors = {
    excellent: themeColors.success || '#4CAF50',
    good: themeColors.warning || '#FF9800', 
    poor: themeColors.error || '#F44336',
    none: themeColors.text + '60' || '#9E9E9E'
  };

  if (score >= 4.5) return colors.excellent;
  if (score >= 3.5) return colors.good;
  if (score >= 2) return colors.warning;
  if (score > 0) return colors.poor;
  return colors.none;
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

export default function LocationDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { locationId } = route.params || {};
  const { theme } = useTheme();
  
  // Estados principais
  const [location, setLocation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para funcionalidades
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  
  // Estados para dados extras
  const [authorPhotoUrl, setAuthorPhotoUrl] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [nearbyLocations, setNearbyLocations] = useState([]);
  const [weatherInfo, setWeatherInfo] = useState(null);
  
  // Estados para avaliação
  const [showRatingInputs, setShowRatingInputs] = useState(false);
  const [featureRatings, setFeatureRatings] = useState({});
  const [comment, setComment] = useState('');
  const [reportReason, setReportReason] = useState('');
  
  // Estados para animações
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Estados para filtros e ordenação de reviews
  const [reviewSortBy, setReviewSortBy] = useState('newest'); // newest, oldest, highest, lowest
  const [reviewFilter, setReviewFilter] = useState('all'); // all, excellent, good, poor
  
  // Função para carregar dados
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [loc, revs] = await Promise.all([
        fetchLocationById(locationId),
        fetchReviewsForLocation(locationId)
      ]);
      
      if (!loc) throw new Error('Local não encontrado');
      
      // Buscar foto do autor
      let photoUrl = null;
      if (loc.userId) {
        const userDocRef = doc(db, 'users', loc.userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          photoUrl = userDocSnap.data().photoURL || null;
        }
      }
      
      // Buscar locais próximos
      let nearby = [];
      try {
        if (loc.category) {
          const nearbyQuery = query(
            collection(db, 'locations'),
            where('category', '==', loc.category),
            limit(5)
          );
          const nearbySnapshot = await getDocs(nearbyQuery);
          nearby = nearbySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item => item.id !== locationId);
        }
      } catch (nearbyError) {
        console.log('Erro ao buscar locais próximos:', nearbyError);
        // Não interrompe o fluxo principal se houver erro nos locais próximos
      }
      
      setLocation(loc);
      setReviews(revs);
      setAuthorPhotoUrl(photoUrl);
      setNearbyLocations(nearby);
      setLoading(false); // Definir loading como false após carregar os dados
      
      // Animação de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start();
      
    } catch (err) {
      setError(err.message || 'Erro ao carregar detalhes');
      setLoading(false); // Definir loading como false mesmo em caso de erro
    }
  }, [locationId, fadeAnim, scaleAnim]);
  
  // Função para obter localização do usuário
  const getUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      const userLoc = await Location.getCurrentPositionAsync({});
      setUserLocation(userLoc.coords);
      
      if (location?.latitude && location?.longitude) {
        const dist = calculateDistance(
          userLoc.coords.latitude,
          userLoc.coords.longitude,
          location.latitude,
          location.longitude
        );
        setDistance(dist);
      }
    } catch (error) {
      console.log('Erro ao obter localização:', error);
    }
  }, [location]);
  
  // Função para refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);
  
  // Função para compartilhar
  const handleShare = async () => {
    try {
      const message = `Confira este local acessível: ${location.name}\n${location.address}\nAvaliação: ${location.rating?.toFixed(1) || 'Sem avaliação'}/5 ⭐`;
      await Share.share({
        message,
        url: location.website || '',
        title: location.name
      });
    } catch (error) {
      console.log('Erro ao compartilhar:', error);
    }
  };
  
  // Função para abrir no mapa
  const openInMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${location.latitude},${location.longitude}`,
      android: `geo:0,0?q=${location.latitude},${location.longitude}(${location.name})`
    });
    Linking.openURL(url);
  };
  
  // Função para ligar
  const handleCall = () => {
    if (location.phone) {
      Linking.openURL(`tel:${location.phone}`);
    }
  };
  
  // Função para abrir website
  const openWebsite = () => {
    if (location.website) {
      Linking.openURL(location.website);
    }
  };
  
  // Função para reportar local
  const handleReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert('Erro', 'Por favor, descreva o motivo da denúncia.');
      return;
    }
    
    try {
      await addDoc(collection(db, 'reports'), {
        locationId,
        reason: reportReason,
        reportedAt: serverTimestamp(),
        status: 'pending'
      });
      
      setReportModalVisible(false);
      setReportReason('');
      Alert.alert('Sucesso', 'Denúncia enviada com sucesso. Nossa equipe irá analisar.');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao enviar denúncia. Tente novamente.');
    }
  };
  
  // Função para alternar favorito
  const toggleFavorite = async () => {
    try {
      // Implementar lógica de favoritos
      setIsFavorite(!isFavorite);
      // Aqui você salvaria no Firebase ou AsyncStorage
    } catch (error) {
      console.log('Erro ao favoritar:', error);
    }
  };
  
  // Função para filtrar e ordenar reviews
  const getFilteredAndSortedReviews = useCallback(() => {
    let filtered = [...reviews];
    
    // Aplicar filtro
    if (reviewFilter !== 'all') {
      filtered = filtered.filter(review => {
        const rating = review.rating || 0;
        switch (reviewFilter) {
          case 'excellent': return rating >= 4;
          case 'good': return rating >= 2.5 && rating < 4;
          case 'poor': return rating < 2.5 && rating > 0;
          default: return true;
        }
      });
    }
    
    // Aplicar ordenação
    filtered.sort((a, b) => {
      switch (reviewSortBy) {
        case 'newest':
          return (b.createdAt?.toDate?.() || new Date()) - (a.createdAt?.toDate?.() || new Date());
        case 'oldest':
          return (a.createdAt?.toDate?.() || new Date()) - (b.createdAt?.toDate?.() || new Date());
        case 'highest':
          return (b.rating || 0) - (a.rating || 0);
        case 'lowest':
          return (a.rating || 0) - (b.rating || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [reviews, reviewFilter, reviewSortBy]);
  
  // Effects
  useEffect(() => {
    if (locationId) {
      loadData();
    }
  }, [locationId, loadData]);
  
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);
  
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('default');
    }, [])
  );
  
  // Função para renderizar estrelas
  const renderStars = (rating = 0, size = 18, showNumber = false) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 1; i <= 5; i++) {
      let iconName = 'star-outline';
      if (i <= fullStars) {
        iconName = 'star';
      } else if (i === fullStars + 1 && hasHalfStar) {
        iconName = 'star-half';
      }
      
      stars.push(
        <Ionicons 
          key={i} 
          name={iconName} 
          size={size} 
          color={theme.colors.warning || '#FFD700'} 
        />
      );
    }
    
    return (
      <View style={styles.starsContainer}>
        {stars}
        {showNumber && (
          <Text style={[styles.ratingNumber, { color: theme.colors.text }]}>
            {rating > 0 ? rating.toFixed(1) : '-'}
          </Text>
        )}
      </View>
    );
  };
  
  // Render de review melhorado
  const renderReview = ({ item, index }) => (
    <Animated.View 
      style={[
        styles.reviewCard, 
        { 
          backgroundColor: theme.colors.surface || theme.colors.background,
          borderColor: theme.colors.border || theme.colors.text + '10',
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          }],
          opacity: fadeAnim
        }
      ]}
    >
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.reviewerPhoto} />
          ) : (
            <View style={[styles.reviewerPhotoPlaceholder, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="person" size={20} color={theme.colors.background} />
            </View>
          )}
          <View style={styles.reviewerDetails}>
            <Text style={[styles.reviewUser, { color: theme.colors.text }]}>
              {item.userName || 'Usuário'}
            </Text>
            <Text style={[styles.reviewDate, { color: theme.colors.textSecondary }]}>
              {item.createdAt?.toDate?.().toLocaleDateString?.('pt-BR') || ''}
            </Text>
          </View>
        </View>
        <View style={styles.reviewRating}>
          {renderStars(item.rating, 16, true)}
        </View>
      </View>
      
      {item.comment && (
        <Text style={[styles.reviewComment, { color: theme.colors.text }]}>
          {item.comment}
        </Text>
      )}
      
      {item.featureRatings && Object.keys(item.featureRatings).length > 0 && (
        <View style={styles.featureRatingsContainer}>
          <Text style={[styles.featureRatingsTitle, { color: theme.colors.text }]}>
            Avaliações por recurso:
          </Text>
          <View style={styles.featureRatingsList}>
            {Object.entries(item.featureRatings).map(([feature, score]) => {
              const featureData = getFeatureData(feature);
              return (
                <View key={feature} style={styles.featureRatingItem}>
                  <View style={styles.featureInfo}>
                    <Ionicons 
                      name={featureData.icon} 
                      size={16} 
                      color={getFeatureIconColor(score, theme.colors)} 
                      style={styles.featureIcon}
                    />
                    <Text style={[styles.featureName, { color: theme.colors.text }]}>
                      {featureData.name}
                    </Text>
                  </View>
                  <View style={styles.featureStars}>
                    {renderStars(score, 14)}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </Animated.View>
  );
  
  // Função para obter dados do recurso
  const getFeatureData = (feature) => {
    const featureMap = {
      'wheelchair': { icon: 'accessibility', name: 'Cadeira de Rodas' },
      'blind': { icon: 'eye-off-outline', name: 'Piso Tátil' },
      'deaf': { icon: 'volume-mute', name: 'Deficiência Auditiva' },
      'elevator': { icon: 'chevron-up-circle', name: 'Elevador' },
      'parking': { icon: 'car', name: 'Estacionamento' },
      'restroom': { icon: 'body', name: 'Banheiro Adaptado' },
      'ramp': { icon: 'trending-up', name: 'Rampa' }
    };
    return featureMap[feature] || { icon: 'help-circle', name: feature };
  };
  
  // Header animado
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, PARALLAX_HEADER_HEIGHT],
    outputRange: [0, -PARALLAX_HEADER_HEIGHT],
    extrapolate: 'clamp',
  });
  
  const imageOpacity = scrollY.interpolate({
    inputRange: [0, PARALLAX_HEADER_HEIGHT / 2, PARALLAX_HEADER_HEIGHT],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, PARALLAX_HEADER_HEIGHT - 100, PARALLAX_HEADER_HEIGHT - 50],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });
  
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Carregando detalhes...
        </Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle" size={60} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} 
          onPress={onRefresh}
        >
          <Text style={[styles.retryButtonText, { color: theme.colors.background }]}>
            Tentar Novamente
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!location) return null;
  
  const filteredReviews = getFilteredAndSortedReviews();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header fixo animado */}
      <Animated.View 
        style={[
          styles.fixedHeader, 
          { 
            backgroundColor: theme.colors.primary,
            opacity: headerOpacity 
          }
        ]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.background} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.background }]} numberOfLines={1}>
          {location.name}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={toggleFavorite}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? theme.colors.error : theme.colors.background} 
          />
        </TouchableOpacity>
      </Animated.View>
      
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header com imagem */}
        <Animated.View 
          style={[
            styles.headerImageContainer,
            { transform: [{ translateY: headerTranslateY }] }
          ]}
        >
          <Animated.View style={{ opacity: imageOpacity }}>
            {location.imageUrl ? (
              <TouchableOpacity onPress={() => setImageModalVisible(true)}>
                <Image source={{ uri: location.imageUrl }} style={styles.headerImage} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.placeholderImage, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name="image" size={60} color={theme.colors.textSecondary} />
                <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                  Sem imagem
                </Text>
              </View>
            )}
          </Animated.View>
          
          {/* Botões flutuantes */}
          <View style={styles.floatingButtons}>
            <TouchableOpacity
              style={[styles.floatingButton, { backgroundColor: theme.colors.background + 'E6' }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.floatingButton, { backgroundColor: theme.colors.background + 'E6' }]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          {/* Indicador de qualidade */}
          <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(location.rating) }]}>
            <Text style={styles.qualityText}>
              {getQualityLabel(location.rating)}
            </Text>
          </View>
        </Animated.View>
        
        {/* Conteúdo principal */}
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              backgroundColor: theme.colors.background,
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim
            }
          ]}
        >
          {/* Informações básicas */}
          <View style={styles.basicInfo}>
            <View style={styles.titleRow}>
              <Text style={[styles.locationName, { color: theme.colors.text }]}>
                {location.name}
              </Text>
              <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
                <Ionicons 
                  name={isFavorite ? "heart" : "heart-outline"} 
                  size={28} 
                  color={isFavorite ? theme.colors.error : theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.locationAddress, { color: theme.colors.textSecondary }]}>
              {location.address}
            </Text>
            
            {distance && (
              <Text style={[styles.distanceText, { color: theme.colors.primary }]}>
                📍 {distance.toFixed(1)} km de distância
              </Text>
            )}
            
            {location.description && (
              <Text style={[styles.description, { color: theme.colors.text }]}>
                {location.description}
              </Text>
            )}
          </View>
          
          {/* Avaliação geral */}
          <View style={[styles.ratingSection, { borderColor: theme.colors.border }]}>
            <View style={styles.overallRating}>
              <View style={styles.ratingMain}>
                <Text style={[styles.ratingScore, { color: theme.colors.text }]}>
                  {location.rating?.toFixed(1) || '-'}
                </Text>
                <View style={styles.ratingDetails}>
                  {renderStars(location.rating, 20)}
                  <Text style={[styles.reviewCount, { color: theme.colors.textSecondary }]}>
                    {location.reviewCount ? `${location.reviewCount} avaliações` : 'Sem avaliações'}
                  </Text>
                </View>
              </View>
              <Text style={styles.ratingEmoji}>
                {getRatingEmoji(location.rating)}
              </Text>
            </View>
          </View>
          
          {/* Recursos de acessibilidade */}
          {location.accessibilityFeatures && location.accessibilityFeatures.length > 0 && (
            <View style={styles.accessibilitySection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Recursos de Acessibilidade
              </Text>
              <View style={styles.accessibilityGrid}>
                {location.accessibilityFeatures.map((feature, index) => {
                  const featureData = getFeatureData(feature);
                  const avgRating = reviews.length > 0
                    ? reviews.reduce((sum, review) => 
                        sum + (review.featureRatings?.[feature] || 0), 0) / reviews.length
                    : 0;
                  
                  return (
                    <View 
                      key={index} 
                      style={[
                        styles.accessibilityCard,
                        { 
                          backgroundColor: theme.colors.surface,
                          borderColor: getFeatureIconColor(avgRating, theme.colors)
                        }
                      ]}
                    >
                      <Ionicons 
                        name={featureData.icon} 
                        size={24} 
                        color={getFeatureIconColor(avgRating, theme.colors)} 
                      />
                      <Text style={[styles.accessibilityCardTitle, { color: theme.colors.text }]}>
                        {featureData.name}
                      </Text>
                      <View style={styles.accessibilityCardRating}>
                        {renderStars(avgRating, 14)}
                        <Text style={[styles.accessibilityCardScore, { color: theme.colors.textSecondary }]}>
                          {avgRating > 0 ? avgRating.toFixed(1) : '-'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
          
          {/* Botões de ação */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setReviewModalVisible(true)}
            >
              <Ionicons name="star-outline" size={20} color={theme.colors.background} />
              <Text style={[styles.actionButtonText, { color: theme.colors.background }]}>
                Avaliar
              </Text>
            </TouchableOpacity>
            
            {location.latitude && location.longitude && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton, { borderColor: theme.colors.primary }]}
                onPress={() => setMapModalVisible(true)}
              >
                <Ionicons name="map-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                  Ver no Mapa
                </Text>
              </TouchableOpacity>
            )}
            
            {location.phone && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton, { borderColor: theme.colors.success }]}
                onPress={handleCall}
              >
                <Ionicons name="call-outline" size={20} color={theme.colors.success} />
                <Text style={[styles.actionButtonText, { color: theme.colors.success }]}>
                  Ligar
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Informações de contato */}
          {(location.phone || location.website || location.email) && (
            <View style={[styles.contactSection, { borderColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Contato
              </Text>
              
              {location.phone && (
                <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
                  <Ionicons name="call" size={20} color={theme.colors.primary} />
                  <Text style={[styles.contactText, { color: theme.colors.text }]}>
                    {location.phone}
                  </Text>
                </TouchableOpacity>
              )}
              
              {location.website && (
                <TouchableOpacity style={styles.contactItem} onPress={openWebsite}>
                  <Ionicons name="globe" size={20} color={theme.colors.primary} />
                  <Text style={[styles.contactText, { color: theme.colors.text }]}>
                    {location.website}
                  </Text>
                </TouchableOpacity>
              )}
              
              {location.email && (
                <TouchableOpacity 
                  style={styles.contactItem} 
                  onPress={() => Linking.openURL(`mailto:${location.email}`)}
                >
                  <Ionicons name="mail" size={20} color={theme.colors.primary} />
                  <Text style={[styles.contactText, { color: theme.colors.text }]}>
                    {location.email}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Horário de funcionamento */}
          {location.openingHours && (
            <View style={[styles.hoursSection, { borderColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Horário de Funcionamento
              </Text>
              <View style={styles.hoursContainer}>
                {Object.entries(location.openingHours).map(([day, hours]) => (
                  <View key={day} style={styles.hoursRow}>
                    <Text style={[styles.dayText, { color: theme.colors.text }]}>
                      {getDayName(day)}:
                    </Text>
                    <Text style={[styles.hoursText, { color: theme.colors.textSecondary }]}>
                      {hours || 'Fechado'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Informações do autor */}
          <View style={[styles.authorSection, { borderColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Adicionado por
            </Text>
            <View style={styles.authorInfo}>
              {authorPhotoUrl ? (
                <Image source={{ uri: authorPhotoUrl }} style={styles.authorPhoto} />
              ) : (
                <View style={[styles.authorPhotoPlaceholder, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="person" size={20} color={theme.colors.background} />
                </View>
              )}
              <View style={styles.authorDetails}>
                <Text style={[styles.authorName, { color: theme.colors.text }]}>
                  {location.userName || 'Usuário'}
                </Text>
                <Text style={[styles.authorDate, { color: theme.colors.textSecondary }]}>
                  {location.createdAt?.toDate?.().toLocaleDateString?.('pt-BR') || ''}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.reportButton}
                onPress={() => setReportModalVisible(true)}
              >
                <Ionicons name="flag-outline" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Seção de avaliações */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Avaliações ({reviews.length})
              </Text>
              
              {/* Filtros e ordenação */}
              {reviews.length > 0 && (
                <View style={styles.reviewFilters}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[
                        styles.filterButton,
                        reviewFilter === 'all' && { backgroundColor: theme.colors.primary },
                        { borderColor: theme.colors.primary }
                      ]}
                      onPress={() => setReviewFilter('all')}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        { color: reviewFilter === 'all' ? theme.colors.background : theme.colors.primary }
                      ]}>
                        Todas
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.filterButton,
                        reviewFilter === 'excellent' && { backgroundColor: theme.colors.success },
                        { borderColor: theme.colors.success }
                      ]}
                      onPress={() => setReviewFilter('excellent')}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        { color: reviewFilter === 'excellent' ? theme.colors.background : theme.colors.success }
                      ]}>
                        Excelentes
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.filterButton,
                        reviewFilter === 'good' && { backgroundColor: theme.colors.warning },
                        { borderColor: theme.colors.warning }
                      ]}
                      onPress={() => setReviewFilter('good')}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        { color: reviewFilter === 'good' ? theme.colors.background : theme.colors.warning }
                      ]}>
                        Boas
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.filterButton,
                        reviewFilter === 'poor' && { backgroundColor: theme.colors.error },
                        { borderColor: theme.colors.error }
                      ]}
                      onPress={() => setReviewFilter('poor')}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        { color: reviewFilter === 'poor' ? theme.colors.background : theme.colors.error }
                      ]}>
                        Ruins
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                  
                  {/* Ordenação */}
                  <TouchableOpacity 
                    style={[styles.sortButton, { borderColor: theme.colors.border }]}
                    onPress={() => {
                      const sortOptions = ['newest', 'oldest', 'highest', 'lowest'];
                      const currentIndex = sortOptions.indexOf(reviewSortBy);
                      const nextIndex = (currentIndex + 1) % sortOptions.length;
                      setReviewSortBy(sortOptions[nextIndex]);
                    }}
                  >
                    <Ionicons name="swap-vertical" size={16} color={theme.colors.text} />
                    <Text style={[styles.sortButtonText, { color: theme.colors.text }]}>
                      {getSortLabel(reviewSortBy)}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {/* Lista de avaliações */}
            {filteredReviews.length > 0 ? (
              <FlatList
                data={filteredReviews}
                keyExtractor={item => item.id}
                renderItem={renderReview}
                ItemSeparatorComponent={() => 
                  <View style={[styles.reviewSeparator, { backgroundColor: theme.colors.border }]} />
                }
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noReviewsContainer}>
                <Ionicons name="chatbubble-outline" size={40} color={theme.colors.textSecondary} />
                <Text style={[styles.noReviewsText, { color: theme.colors.textSecondary }]}>
                  {reviews.length === 0 
                    ? 'Nenhuma avaliação ainda. Seja o primeiro a avaliar!' 
                    : 'Nenhuma avaliação encontrada com os filtros aplicados.'
                  }
                </Text>
              </View>
            )}
          </View>
          
          {/* Locais próximos */}
          {nearbyLocations.length > 0 && (
            <View style={styles.nearbySection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Locais Próximos
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {nearbyLocations.map(nearbyLocation => (
                  <TouchableOpacity
                    key={nearbyLocation.id}
                    style={[styles.nearbyCard, { backgroundColor: theme.colors.surface }]}
                    onPress={() => navigation.replace('LocationDetail', { locationId: nearbyLocation.id })}
                  >
                    {nearbyLocation.imageUrl ? (
                      <Image source={{ uri: nearbyLocation.imageUrl }} style={styles.nearbyImage} />
                    ) : (
                      <View style={[styles.nearbyImagePlaceholder, { backgroundColor: theme.colors.border }]}>
                        <Ionicons name="image" size={20} color={theme.colors.textSecondary} />
                      </View>
                    )}
                    <Text style={[styles.nearbyName, { color: theme.colors.text }]} numberOfLines={2}>
                      {nearbyLocation.name}
                    </Text>
                    <View style={styles.nearbyRating}>
                      {renderStars(nearbyLocation.rating, 12)}
                      <Text style={[styles.nearbyRatingText, { color: theme.colors.textSecondary }]}>
                        {nearbyLocation.rating?.toFixed(1) || '-'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      </Animated.ScrollView>
      
      {/* Modal de imagem */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity 
            style={styles.imageModalClose}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          {location.imageUrl && (
            <Image 
              source={{ uri: location.imageUrl }} 
              style={styles.imageModalContent}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
      
      {/* Modal do mapa */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <View style={styles.mapModalContainer}>
          <View style={[styles.mapModalHeader, { backgroundColor: theme.colors.primary }]}>
            <TouchableOpacity onPress={() => setMapModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.background} />
            </TouchableOpacity>
            <Text style={[styles.mapModalTitle, { color: theme.colors.background }]}>
              Localização
            </Text>
            <TouchableOpacity onPress={openInMaps}>
              <Ionicons name="open-outline" size={24} color={theme.colors.background} />
            </TouchableOpacity>
          </View>
          {location.latitude && location.longitude && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={location.name}
                description={location.address}
              />
            </MapView>
          )}
        </View>
      </Modal>
      
      {/* Modal de denúncia */}
      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.reportModal, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.reportModalTitle, { color: theme.colors.text }]}>
              Reportar Local
            </Text>
            <TextInput
              style={[
                styles.reportInput,
                { 
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surface
                }
              ]}
              placeholder="Descreva o motivo da denúncia..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              value={reportReason}
              onChangeText={setReportReason}
            />
            <View style={styles.reportModalButtons}>
              <TouchableOpacity
                style={[styles.reportModalButton, { backgroundColor: theme.colors.border }]}
                onPress={() => {
                  setReportModalVisible(false);
                  setReportReason('');
                }}
              >
                <Text style={[styles.reportModalButtonText, { color: theme.colors.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reportModalButton, { backgroundColor: theme.colors.error }]}
                onPress={handleReport}
              >
                <Text style={[styles.reportModalButtonText, { color: theme.colors.background }]}>
                  Enviar Denúncia
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal de avaliação */}
      <ReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        locationId={locationId}
        locationFeatures={location?.accessibilityFeatures || []}
        onSubmitSuccess={() => {
          setReviewModalVisible(false);
          onRefresh();
        }}
      />
    </View>
  );
}

// Funções auxiliares
const getQualityColor = (rating) => {
  if (rating >= 4) return '#4CAF50';
  if (rating >= 3) return '#FF9800';
  if (rating >= 2) return '#FF5722';
  return '#9E9E9E';
};

const getQualityLabel = (rating) => {
  if (rating >= 4) return 'Excelente';
  if (rating >= 3) return 'Bom';
  if (rating >= 2) return 'Regular';
  if (rating > 0) return 'Ruim';
  return 'Sem Avaliação';
};

const getRatingEmoji = (rating) => {
  if (rating >= 4.5) return '🤩';
  if (rating >= 4) return '😊';
  if (rating >= 3) return '🙂';
  if (rating >= 2) return '😐';
  if (rating > 0) return '😞';
  return '❓';
};

const getDayName = (day) => {
  const days = {
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };
  return days[day] || day;
};

const getSortLabel = (sortBy) => {
  const labels = {
    newest: 'Mais Recentes',
    oldest: 'Mais Antigas',
    highest: 'Melhor Avaliadas',
    lowest: 'Pior Avaliadas'
  };
  return labels[sortBy] || sortBy;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Header
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  
  // Header com imagem
  headerImageContainer: {
    height: HEADER_HEIGHT,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    marginTop: 8,
  },
  floatingButtons: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  floatingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qualityBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  qualityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Conteúdo
  contentContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 20,
    minHeight: SCREEN_HEIGHT - HEADER_HEIGHT + 50,
  },
  
  // Informações básicas
  basicInfo: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  favoriteButton: {
    padding: 4,
  },
  locationAddress: {
    fontSize: 16,
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  
  // Seção de avaliação
  ratingSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 20,
    marginBottom: 24,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScore: {
    fontSize: 48,
    fontWeight: 'bold',
    marginRight: 16,
  },
  ratingDetails: {
    justifyContent: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  reviewCount: {
    fontSize: 14,
  },
  ratingEmoji: {
    fontSize: 32,
  },
  
  // Seção de acessibilidade
  accessibilitySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  accessibilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  accessibilityCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    alignItems: 'center',
  },
  accessibilityCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 8,
  },
  accessibilityCardRating: {
    alignItems: 'center',
  },
  accessibilityCardScore: {
    fontSize: 12,
    marginTop: 4,
  },
  
  // Botões de ação
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: (SCREEN_WIDTH - 52) / 2,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  // Seção de contato
  contactSection: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginBottom: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 12,
  },
  
  // Horário de funcionamento
  hoursSection: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginBottom: 24,
  },
  hoursContainer: {
    gap: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
  },
  hoursText: {
    fontSize: 16,
  },
  
  // Seção do autor
  authorSection: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginBottom: 24,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorPhotoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorDetails: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  authorDate: {
    fontSize: 14,
    marginTop: 2,
  },
  reportButton: {
    padding: 8,
  },
  
  // Seção de avaliações
  reviewsSection: {
    marginBottom: 24,
  },
  reviewsHeader: {
    marginBottom: 16,
  },
  reviewFilters: {
    marginTop: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
  },
  sortButtonText: {
    fontSize: 14,
    marginLeft: 4,
  },
  
  // Cards de avaliação
  reviewCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  reviewerPhotoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  reviewUser: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: 12,
    marginTop: 2,
  },
  reviewRating: {
    alignItems: 'flex-end',
  },
  reviewComment: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  featureRatingsContainer: {
    marginTop: 12,
  },
  featureRatingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureRatingsList: {
    gap: 6,
  },
  featureRatingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureName: {
    fontSize: 14,
  },
  featureStars: {
    flexDirection: 'row',
  },
  reviewSeparator: {
    height: 1,
    marginVertical: 8,
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noReviewsText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  
  // Locais próximos
  nearbySection: {
    marginBottom: 40,
  },
  nearbyCard: {
    width: 150,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  nearbyImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  nearbyImagePlaceholder: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  nearbyName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  nearbyRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearbyRatingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  
  // Modais
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  imageModalContent: {
    width: '90%',
    height: '70%',
  },
  mapModalContainer: {
    flex: 1,
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportModal: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
  },
});
// FIM DO ARQUIVO