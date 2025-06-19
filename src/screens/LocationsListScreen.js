import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
  Platform,
  BackHandler,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fetchLocations } from '../services/firebase/locations';
import { Ionicons } from '@expo/vector-icons';
import AddLocationModal from '../components/AddLocationModal';
import { db, storage, auth } from '../services/firebase/config';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { THEME } from '../config/constants';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import AppHeader from '../components/common/AppHeader';

const { width, height } = Dimensions.get('window');

export default function LocationsListScreen() {
  // State management
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [locations, setLocations] = useState([]);
  const [displayedLocations, setDisplayedLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // newest, rating, name, distance
  const [filterBy, setFilterBy] = useState('all'); // all, wheelchair, blind, deaf, etc.
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Animations
  const searchAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(height)).current;

  const { theme } = useTheme();
  const navigation = useNavigation();

  // Enhanced sort options
  const sortOptions = [
    { key: 'newest', label: 'Mais Recentes', icon: 'time-outline' },
    { key: 'rating', label: 'Melhor Avaliados', icon: 'star' },
    { key: 'name', label: 'Nome A-Z', icon: 'text' },
    { key: 'distance', label: 'Distância', icon: 'location' }
  ];

  // Enhanced filter options
  const filterOptions = [
    { key: 'all', label: 'Todos', icon: 'apps', color: theme.colors.primary },
    { key: 'wheelchair', label: 'Cadeirante', icon: 'walk', color: '#4CAF50' },
    { key: 'blind', label: 'Deficiência Visual', icon: 'eye-off', color: '#FF9800' },
    { key: 'deaf', label: 'Deficiência Auditiva', icon: 'ear', color: '#9C27B0' },
    { key: 'elevator', label: 'Elevador', icon: 'swap-vertical', color: '#2196F3' },
    { key: 'parking', label: 'Estacionamento', icon: 'car', color: '#795548' },
    { key: 'restroom', label: 'Banheiro Adaptado', icon: 'body', color: '#607D8B' },
    { key: 'ramp', label: 'Rampa', icon: 'enter', color: '#F44336' }
  ];

  // Load locations with enhanced error handling
  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLocations();
      setLocations(data);
      applyFiltersAndSort(data, searchQuery, sortBy, filterBy);
      
      // Animate content in
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error('Error loading locations:', err);
      setError('Erro ao carregar locais. Verifique sua conexão.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, sortBy, filterBy]);

  // Enhanced sorting and filtering
  const applyFiltersAndSort = useCallback((locationsData, query, sort, filter) => {
    let filtered = [...locationsData];

    // Apply search filter
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(location =>
        location.name.toLowerCase().includes(lowerQuery) ||
        location.address.toLowerCase().includes(lowerQuery) ||
        (location.description && location.description.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply accessibility filter
    if (filter !== 'all') {
      filtered = filtered.filter(location =>
        location.accessibilityFeatures && location.accessibilityFeatures.includes(filter)
      );
    }

    // Apply sorting
    switch (sort) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'distance':
        // Placeholder for distance sorting (would need user location)
        filtered.sort((a, b) => Math.random() - 0.5);
        break;
      case 'newest':
      default:
        // Keep original order (newest first from Firestore)
        break;
    }

    setDisplayedLocations(filtered);
  }, []);

  // Search functionality
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    applyFiltersAndSort(locations, query, sortBy, filterBy);
  }, [locations, sortBy, filterBy, applyFiltersAndSort]);

  // Toggle search visibility
  const toggleSearch = () => {
    const toValue = searchVisible ? 0 : 1;
    setSearchVisible(!searchVisible);
    
    Animated.timing(searchAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (!searchVisible) {
      setTimeout(() => searchInputRef.current?.focus(), 300);
    } else {
      setSearchQuery('');
      handleSearch('');
    }
  };

  const searchInputRef = useRef();

  // Enhanced star rendering with animation
  const renderStars = (rating = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(
          <Ionicons
            key={i}
            name="star"
            size={16}
            color="#FFD700"
            style={styles.starIcon}
          />
        );
      } else if (rating >= i - 0.5) {
        stars.push(
          <Ionicons
            key={i}
            name="star-half"
            size={16}
            color="#FFD700"
            style={styles.starIcon}
          />
        );
      } else {
        stars.push(
          <Ionicons
            key={i}
            name="star-outline"
            size={16}
            color="#DDD"
            style={styles.starIcon}
          />
        );
      }
    }
    return stars;
  };

  // Enhanced card styling with dynamic colors
  const getLocationCardStyle = (rating, isSelected = false) => {
    let backgroundColor = theme.colors.background;
    let borderColor = 'transparent';
    
    if (isSelected) {
      borderColor = theme.colors.primary;
      backgroundColor = theme.colors.primary + '10';
    } else {
      if (rating >= 4.5) {
        backgroundColor = '#E8F5E8';
      } else if (rating >= 3.5) {
        backgroundColor = '#FFF8E1';
      } else if (rating >= 2) {
        backgroundColor = '#FFE0E0';
      } else if (rating > 0) {
        backgroundColor = '#FFEBEE';
      } else {
        backgroundColor = '#F5F5F5';
      }
    }

    return [
      viewMode === 'grid' ? styles.gridCard : styles.listCard,
      { 
        backgroundColor,
        borderColor,
        borderWidth: isSelected ? 2 : 0,
      }
    ];
  };

  // Enhanced location rendering
  const renderLocation = ({ item, index }) => {
    return (
      <TouchableOpacity
        style={getLocationCardStyle(item.rating)}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('LocationDetail', { locationId: item.id })}
      >
        <View style={viewMode === 'grid' ? styles.gridImageContainer : styles.listImageContainer}>
          {item.imageUrl ? (
            <>
              <Image
                source={{ uri: item.imageUrl }}
                style={viewMode === 'grid' ? styles.gridImage : styles.listImage}
                resizeMode="cover"
              />
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image" size={36} color="#AAA" />
              <Text style={styles.placeholderText}>Sem imagem</Text>
            </View>
          )}
          
          {/* Quick rating indicator */}
          <View style={styles.quickRating}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.quickRatingText}>
              {typeof item.rating === 'number' ? item.rating.toFixed(1) : '-'}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.locationName} numberOfLines={2}>
            {item.name}
          </Text>
          
          <Text style={styles.locationAddress} numberOfLines={1}>
            {item.address}
          </Text>

          {item.description && viewMode === 'list' && (
            <Text style={styles.locationDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(item.rating)}
            </View>
            <Text style={styles.reviewCount}>
              {item.reviewCount ? `(${item.reviewCount})` : ''}
            </Text>
          </View>

          {/* Accessibility features */}
          <View style={styles.accessibilityContainer}>
            {(item.accessibilityFeatures || []).slice(0, viewMode === 'grid' ? 2 : 4).map((feature, idx) => {
              const featureData = {
                'wheelchair': { icon: 'walk', color: '#4CAF50' },
                'blind': { icon: 'eye-off', color: '#FF9800' },
                'deaf': { icon: 'ear', color: '#9C27B0' },
                'elevator': { icon: 'swap-vertical', color: '#2196F3' },
                'parking': { icon: 'car', color: '#795548' },
                'restroom': { icon: 'body', color: '#607D8B' },
                'ramp': { icon: 'enter', color: '#F44336' }
              };
              const data = featureData[feature];
              return data ? (
                <View key={idx} style={[styles.accessibilityTag, { backgroundColor: data.color }]}>
                  <Ionicons name={data.icon} size={12} color="white" />
                </View>
              ) : null;
            })}
            {item.accessibilityFeatures && item.accessibilityFeatures.length > (viewMode === 'grid' ? 2 : 4) && (
              <View style={styles.moreTag}>
                <Text style={styles.moreTagText}>
                  +{item.accessibilityFeatures.length - (viewMode === 'grid' ? 2 : 4)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Effects
  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const route = navigation.getState().routes.find(r => r.name === 'LocationsList');
      if (route?.params?.selectedLat && route?.params?.selectedLng) {
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

  // Handle back button in selection mode
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  // Header component
  const headerActions = [
    {
      icon: 'search',
      label: '',
      onPress: toggleSearch,
    },
    {
      icon: 'filter',
      label: filterOptions.find(f => f.key === filterBy)?.label || 'Filtro',
      onPress: () => setFilterModalVisible(true),
    },
    {
      icon: 'swap-vertical',
      label: sortOptions.find(s => s.key === sortBy)?.label || 'Ordenar',
      onPress: () => setSortModalVisible(true),
    },
    {
      icon: viewMode === 'grid' ? 'list' : 'grid',
      label: viewMode === 'grid' ? 'Lista' : 'Grade',
      onPress: () => setViewMode(viewMode === 'grid' ? 'list' : 'grid'),
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    loadLocations();
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando locais...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={60} color="#F44336" />
        <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadLocations}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (locations.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="location-outline" size={80} color="#DDD" />
        <Text style={styles.emptyTitle}>Nenhum local encontrado</Text>
        <Text style={styles.emptyText}>
          Adicione o primeiro local acessível à sua lista!
        </Text>
        <TouchableOpacity
          style={styles.addFirstButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addFirstButtonText}>Adicionar Local</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <AppHeader
        title="Locais Acessíveis"
        onBack={() => navigation.goBack()}
        actions={headerActions}
      >
        {/* Search bar */}
        <Animated.View
          style={[
            styles.searchContainer,
            {
              height: searchAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 50],
              }),
              opacity: searchAnimation,
            },
          ]}
        >
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Buscar locais..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={handleSearch}
            clearButtonMode="while-editing"
          />
        </Animated.View>
      </AppHeader>

      <Animated.View style={[styles.listContainer, { opacity: fadeAnimation }]}>
        <FlatList
          data={displayedLocations}
          keyExtractor={item => item.id}
          renderItem={renderLocation}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when view mode changes
          contentContainerStyle={[
            styles.listContent,
            displayedLocations.length === 0 && styles.emptyListContent
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyResults}>
              <Ionicons name="search" size={60} color="#DDD" />
              <Text style={styles.emptyResultsText}>
                Nenhum local encontrado com os filtros aplicados
              </Text>
            </View>
          )}
        />
      </Animated.View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Add Location Modal */}
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
              const currentUser = auth.currentUser;
              if (!currentUser) {
                throw new Error('Usuário não autenticado');
              }
              
              const timestamp = new Date().getTime();
              const safeFileName = `${currentUser.uid}_${timestamp}_${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.jpg`;
              const storageRef = ref(storage, `location_images/${safeFileName}`);
              
              const response = await fetch(image.uri);
              const blob = await response.blob();
              
              await uploadBytes(storageRef, blob);
              imageUrl = await getDownloadURL(storageRef);
            }

            await addDoc(collection(db, 'accessibleLocations'), {
              name,
              address,
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              accessibilityFeatures: accessibility,
              imageUrl,
              rating: 0,
              reviewCount: 0,
              createdAt: serverTimestamp(),
            });

            loadLocations();
            setAddModalVisible(false);
            setSelectedLocation(null);
          } catch (e) {
            console.error('Error adding location:', e);
            Alert.alert('Erro', 'Não foi possível adicionar o local. Tente novamente.');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    zIndex: 1000,
  },
  headerContainer: {
    // Para garantir espaçamento e alinhamento
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginRight: 8,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 4,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 4,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  searchContainer: {
    overflow: 'hidden',
    marginBottom: 8,
  },
  searchInput: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filtersRow: {
    flex: 1,
    marginRight: 12,
  },
  filtersList: {
    flexGrow: 0,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: '#fff',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  // Grid Card Styles
  gridCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  gridImageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  // List Card Styles
  listCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  listImageContainer: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 4,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickRating: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  quickRatingText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  locationDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    lineHeight: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  starIcon: {
    marginRight: 1,
  },
  reviewCount: {
    fontSize: 12,
    color: '#888',
  },
  accessibilityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  accessibilityTag: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    marginBottom: 4,
  },
  moreTag: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  moreTagText: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  // Loading and Error States
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Empty States
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 24,
  },
  addFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyResultsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  // Floating Action Button
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pickerSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 8,
    marginTop: 4,
    gap: 12,
  },
  pickerSummaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  pickerSummaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pickerModalContainer: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1001,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 18,
    textAlign: 'center',
  },
  pickerModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  pickerModalItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  pickerModalItemText: {
    fontSize: 15,
    color: '#333',
  },
});