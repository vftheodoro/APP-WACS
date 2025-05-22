import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchLocationById, fetchReviewsForLocation } from '../services/firebase/locations';
import { Ionicons } from '@expo/vector-icons';
import AccessibilityIcons from '../components/AccessibilityIcons';
import ReviewModal from '../components/ReviewModal';
import { db } from '../services/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { THEME } from '../config/constants';

export default function LocationDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { locationId } = route.params || {};
  const [location, setLocation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const loc = await fetchLocationById(locationId);
        if (!loc) throw new Error('Local não encontrado');
        const revs = await fetchReviewsForLocation(locationId);
        if (isMounted) {
          setLocation(loc);
          setReviews(revs);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Erro ao carregar detalhes');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    if (locationId) loadData();
    return () => { isMounted = false; };
  }, [locationId]);

  const renderStars = (rating = 0, size = 18) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<Ionicons key={i} name="star" size={size} color={THEME.colors.warning} />);
      } else if (rating >= i - 0.5) {
        stars.push(<Ionicons key={i} name="star-half" size={size} color={THEME.colors.warning} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={size} color={THEME.colors.warning} />);
      }
    }
    return stars;
  };

  // Render accessibility features as icons
  const renderAccessibilityIcons = (features) => <AccessibilityIcons features={features} />;

  const renderReview = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.reviewerPhoto} />
        ) : (
        <Ionicons name="person-circle" size={28} color={THEME.colors.primary} />
        )}
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.reviewUser}>{item.userName || 'Usuário'}</Text>
          <Text style={styles.reviewDate}>{item.createdAt?.toDate?.().toLocaleDateString?.() || ''}</Text>
        </View>
      </View>
      {item.comment ? <Text style={styles.reviewComment}>{item.comment}</Text> : null}
      {item.featureRatings ? (
        <View style={styles.featureRatingsRow}>
          {Object.entries(item.featureRatings).map(([feature, score]) => {
            // Usar o mesmo mapeamento de ícones para consistência
            const featureData = {
              'wheelchair': { icon: 'walk' },
              'blind': { icon: 'eye-off' },
              'deaf': { icon: 'ear' },
              'elevator': { icon: 'swap-vertical' },
              'parking': { icon: 'car' },
              'restroom': { icon: 'body' },
              'ramp': { icon: 'enter' }
            };
            const data = featureData[feature];
            
            return (
              <View key={feature} style={styles.featureRatingItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Usar o ícone definido no mapeamento local */}
                  <Ionicons name={data.icon || 'help-circle-outline'} size={16} color={THEME.colors.background} style={styles.reviewFeatureIcon} />
                </View>
                <View style={styles.reviewFeatureStars}>
                  {[1,2,3,4,5].map(i => (
                    <Ionicons
                      key={i}
                      name={i <= score ? 'star' : 'star-outline'}
                      size={14}
                      color={THEME.colors.warning}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );

  const getLocationDetailStyle = (rating) => {
    let backgroundColor = THEME.colors.background; // Cor padrão (branco para locais sem avaliações)
    if (rating >= 4) {
      backgroundColor = '#f0fff0'; // Verde bem claro
    } else if (rating >= 2) {
      backgroundColor = '#ffffe0'; // Amarelo bem claro
    } else if (rating > 0) {
      backgroundColor = '#ffe0e0'; // Vermelho bem claro
    } else if (rating === 0 || rating === null || rating === undefined) {
      backgroundColor = '#f0f0f0'; // Cinza claro para locais sem avaliações
    }
    return { backgroundColor };
  };

  const getRatingEmoji = (rating) => {
    if (rating >= 4) {
      return '😊';
    } else if (rating >= 2) {
      return '😐';
    } else if (rating > 0) {
      return '😞';
    } else if (rating === 0 || rating === null || rating === undefined) {
      return '➖'; // Emoji neutro para locais sem avaliações
    }
    return '';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.text}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={40} color={THEME.colors.error} />
        <Text style={styles.text}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!location) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={THEME.colors.primary} />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={[styles.scrollContent, getLocationDetailStyle(location.rating)]} showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          {location.imageUrl ? (
            <Image source={{ uri: location.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image" size={48} color={THEME.colors.text} />
            </View>
          )}
        </View>
        <Text style={styles.name}>{location.name}</Text>
        <Text style={styles.address}>{location.address}</Text>
        {location.description ? <Text style={styles.description}>{location.description}</Text> : null}
        {/* Adicionar exibição de ícones e nomes de acessibilidade combinados (badges) */}
        <View style={styles.accessibilityFeaturesContainer}>
          {(location.accessibilityFeatures || []).map((feature, index) => {
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
                  <Ionicons name={data.icon} size={16} color={THEME.colors.background} style={styles.accessibilityFeatureIcon} />
                  <Text style={styles.accessibilityFeatureText}>{data.name}</Text>
                </View>
              );
            }
            return null;
          })}
          </View>
        <View style={styles.ratingRow}>
          {renderStars(location.rating, 24)}
          <Text style={styles.ratingText}>
            {typeof location.rating === 'number' ? location.rating.toFixed(1) : '-'}
            {location.reviewCount ? ` (${location.reviewCount} avaliações)` : ''}
          </Text>
          <Text style={styles.ratingEmoji}>{getRatingEmoji(location.rating)}</Text>
        </View>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
          <Text style={styles.sectionTitle}>Avaliações</Text>
          <TouchableOpacity style={styles.addReviewBtn} onPress={() => setReviewModalVisible(true)}>
            <Ionicons name="star-outline" size={20} color={THEME.colors.background} />
            <Text style={styles.addReviewText}>Avaliar</Text>
          </TouchableOpacity>
        </View>
        {reviews.length === 0 ? (
          <Text style={styles.noReviews}>Nenhuma avaliação ainda. Seja o primeiro a avaliar!</Text>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={item => item.id}
            renderItem={renderReview}
            contentContainerStyle={{ paddingBottom: 24 }}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
      <ReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        onSubmit={async ({ rating, comment, featureRatings }) => {
          try {
            await addDoc(collection(db, 'reviews'), {
              locationId,
              rating,
              comment,
              featureRatings,
              createdAt: serverTimestamp(),
              userName: 'Usuário', // TODO: pegar nome real do usuário logado
            });
            setReviewModalVisible(false);
            // Refresh reviews
            const revs = await fetchReviewsForLocation(locationId);
            setReviews(revs);
          } catch (e) {
            alert('Erro ao enviar avaliação');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    minHeight: '100%', // Ensure background covers the whole scroll view area
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    marginBottom: 2,
  },
  backText: {
    color: THEME.colors.primary,
    fontSize: 16,
    marginLeft: 5,
  },
  imageSection: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
    marginBottom: 15,
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
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 5,
  },
  address: {
    fontSize: 16,
    color: THEME.colors.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: THEME.colors.text,
    marginBottom: 15,
  },
  accessibilityFeaturesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingText: {
    fontSize: 18,
    color: THEME.colors.text,
    marginLeft: 5,
  },
  ratingEmoji: {
    fontSize: 24,
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginTop: 10,
    marginBottom: 10,
  },
  addReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addReviewText: {
    color: THEME.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  noReviews: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: THEME.colors.background,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewerPhoto: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  reviewDate: {
    fontSize: 12,
    color: THEME.colors.text,
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: THEME.colors.text,
    marginBottom: 10,
  },
  featureRatingsRow: {
    flexDirection: 'column',
    marginTop: 5,
  },
  featureRatingItem: {
    flexDirection: 'row',
    alignItems: 'center'
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
  reviewFeatureIcon: {
    marginRight: 4,
    color: THEME.colors.background,
  },
  reviewFeatureName: {
    fontSize: 12,
    color: THEME.colors.text,
    fontWeight: '500',
  },
  reviewFeatureStars: {
    flexDirection: 'row',
    marginLeft: 6,
  },
});
