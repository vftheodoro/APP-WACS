import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchLocationById, fetchReviewsForLocation } from '../services/firebase/locations';
import { Ionicons } from '@expo/vector-icons';
import AccessibilityIcons from '../components/AccessibilityIcons';
import ReviewModal from '../components/ReviewModal';
import { db } from '../services/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
        stars.push(<Ionicons key={i} name="star" size={size} color="#FFD700" />);
      } else if (rating >= i - 0.5) {
        stars.push(<Ionicons key={i} name="star-half" size={size} color="#FFD700" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={size} color="#FFD700" />);
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
          <Ionicons name="person-circle" size={28} color="#007AFF" />
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
            const iconEntry = AccessibilityIcons.featureIconMap?.[feature];
            return (
              <View key={feature} style={styles.featureRatingItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={iconEntry?.icon || 'help-circle'} size={16} color="#007AFF" style={styles.reviewFeatureIcon} />
                </View>
                <View style={styles.reviewFeatureStars}>
                  {[1,2,3,4,5].map(i => (
                    <Ionicons
                      key={i}
                      name={i <= score ? 'star' : 'star-outline'}
                      size={14}
                      color="#FFD700"
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.text}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={40} color="#FF3B30" />
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
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          {location.imageUrl ? (
            <Image source={{ uri: location.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image" size={48} color="#aaa" />
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
              'wheelchair': { icon: 'wheelchair', name: 'Cadeira de Rodas' },
              'blind': { icon: 'eye-off', name: 'Cegueira' },
              'deaf': { icon: 'ear', name: 'Surdez' },
              'elevator': { icon: 'elevator', name: 'Elevador' },
              'parking': { icon: 'car', name: 'Estacionamento' },
              'restroom': { icon: 'restroom', name: 'Banheiro' },
              'ramp': { icon: 'ramp', name: 'Rampa' }
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
        <View style={styles.ratingRow}>
          {renderStars(location.rating)}
          <Text style={styles.ratingText}>
            {typeof location.rating === 'number' ? location.rating.toFixed(1) : '-'}
            {location.reviewCount ? ` (${location.reviewCount} avaliações)` : ''}
          </Text>
        </View>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
          <Text style={styles.sectionTitle}>Avaliações</Text>
          <TouchableOpacity style={styles.addReviewBtn} onPress={() => setReviewModalVisible(true)}>
            <Ionicons name="star-outline" size={20} color="#fff" />
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
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    marginBottom: 2,
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 5,
  },
  imageSection: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#eaeaea',
    marginBottom: 18,
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
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  address: {
    fontSize: 15,
    color: '#444',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  accessibilityFeaturesContainer: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginTop: 20,
    marginBottom: 8,
  },
  addReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  addReviewText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 15,
  },
  noReviews: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#f7faff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewUser: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },
  reviewDate: {
    fontSize: 12,
    color: '#888',
  },
  reviewComment: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
    marginBottom: 4,
  },
  featureRatingsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  featureRatingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eaeaea',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
    marginBottom: 4,
  },
  featureRatingName: {
    fontSize: 12,
    color: '#555',
    marginRight: 3,
  },
  featureRatingScore: {
    fontSize: 12,
    color: '#222',
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
  reviewFeatureIcon: {
    marginRight: 4,
    color: '#007AFF',
  },
  reviewFeatureName: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  reviewFeatureStars: {
    flexDirection: 'row',
    marginLeft: 6,
  },
  reviewerPhoto: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },
});
