import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchLocationById, fetchReviewsForLocation } from '../services/firebase/locations';
import { Ionicons } from '@expo/vector-icons';
import AccessibilityIcons from '../components/AccessibilityIcons';
import ReviewModal from '../components/ReviewModal';
import { db } from '../services/firebase/config';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { THEME } from '../config/constants';
import { useTheme } from '../contexts/ThemeContext';

// Função para obter a cor do ícone da acessibilidade com base na pontuação
const getFeatureIconColor = (score, themeColors) => {
  if (score >= 4) {
    return themeColors.success; // Verde para pontuação alta
  } else if (score >= 2) {
    return themeColors.warning; // Amarelo para pontuação média
  } else if (score > 0) {
    return themeColors.error; // Vermelho para pontuação baixa
  } else {
    return themeColors.text; // Cor padrão (cinza/preto) para sem avaliação ou 0
  }
};

export default function LocationDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { locationId } = route.params || {};
  const { theme } = useTheme();
  const [location, setLocation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [authorPhotoUrl, setAuthorPhotoUrl] = useState(null);
  const [showRatingInputs, setShowRatingInputs] = useState(false);
  const [featureRatings, setFeatureRatings] = useState({});
  const [comment, setComment] = useState('');

  // Função para lidar com a alteração da avaliação de um recurso específico
  const handleFeatureRatingChange = (feature, score) => {
    setFeatureRatings(prevRatings => ({
      ...prevRatings,
      [feature]: score,
    }));
  };

  // Função para submeter a avaliação detalhada
  const submitDetailedReview = async () => {
    if (!location || !location.accessibilityFeatures) return;

    // Validar se todas as acessibilidades foram avaliadas
    const allFeaturesRated = location.accessibilityFeatures.every(feature => featureRatings.hasOwnProperty(feature) && featureRatings[feature] > 0);
    if (!allFeaturesRated) {
      alert('Por favor, avalie todos os recursos de acessibilidade disponíveis.');
      return;
    }

    // Calcular a média das avaliações de acessibilidade
    const ratings = Object.values(featureRatings);
    const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

    try {
      // Adicionar a nova avaliação ao Firestore
      await addDoc(collection(db, 'reviews'), {
        locationId: locationId,
        userId: user.uid, // Substituir 'user' pela forma correta de obter o usuário autenticado
        userName: user.displayName || user.email.split('@')[0], // Substituir 'user' pela forma correta de obter o usuário autenticado
        rating: parseFloat(averageRating.toFixed(1)),
        featureRatings: featureRatings,
        comment: comment,
        createdAt: serverTimestamp(),
      });

      // Recarregar avaliações e detalhes do local para atualizar a UI
      loadData(); // Chamar a função que carrega os dados do local e reviews

      // Resetar estados e fechar a interface de avaliação
      setFeatureRatings({});
      setComment('');
      setShowRatingInputs(false);

      alert('Avaliação enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar avaliação detalhada:', error);
      alert('Ocorreu um erro ao enviar sua avaliação. Por favor, tente novamente.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const loc = await fetchLocationById(locationId);
        if (!loc) throw new Error('Local não encontrado');
        const revs = await fetchReviewsForLocation(locationId);

        let photoUrl = null;
        if (loc.userId) {
          const userDocRef = doc(db, 'users', loc.userId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            photoUrl = userDocSnap.data().photoURL || null;
          }
        }

        if (isMounted) {
          setLocation(loc);
          setReviews(revs);
          setAuthorPhotoUrl(photoUrl);
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
        stars.push(<Ionicons key={i} name="star" size={size} color={theme.colors.warning} />);
      } else if (rating >= i - 0.5) {
        stars.push(<Ionicons key={i} name="star-half" size={size} color={theme.colors.warning} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={size} color={theme.colors.warning} />);
      }
    }
    return stars;
  };

  // Render accessibility features as icons
  const renderAccessibilityIcons = (features) => <AccessibilityIcons features={features} themeColors={theme.colors} />;

  const renderReview = ({ item }) => (
    <View style={[styles.reviewCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.text + '10' }]}>
      <View style={styles.reviewHeader}>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.reviewerPhoto} />
        ) : (
        <Ionicons name="person-circle" size={28} color={theme.colors.primary} />
        )}
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={[styles.reviewUser, { color: theme.colors.text }]}>{item.userName || 'Usuário'}</Text>
          <Text style={[styles.reviewDate, { color: theme.colors.text + '80' }]}>{item.createdAt?.toDate?.().toLocaleDateString?.() || ''}</Text>
        </View>
      </View>
      {item.comment ? <Text style={[styles.reviewComment, { color: theme.colors.text }]}>{item.comment}</Text> : null}
      {item.featureRatings ? (
        <View style={styles.featureRatingsRow}>
          {Object.entries(item.featureRatings).map(([feature, score]) => {
            // Usar o mesmo mapeamento de ícones para consistência
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
            
            // Verificar se o recurso existe no mapeamento, caso contrário, usar o nome original e ícone genérico
            const featureName = data ? data.name : feature; // Use o nome em português ou o nome original
            const featureIcon = data ? data.icon : 'help-circle-outline'; // Use o ícone mapeado ou um genérico

            return (
              <View key={feature} style={styles.featureRatingItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Usar o ícone definido no mapeamento local */}
                  <Ionicons name={featureIcon} size={16} color={getFeatureIconColor(score, theme.colors)} style={styles.reviewFeatureIcon} />
                  {/* Exibir o nome em português */}
                  <Text style={[styles.reviewFeatureName, { color: theme.colors.text }]}>{featureName}</Text>
                </View>
                <View style={styles.reviewFeatureStars}>
                  {[1,2,3,4,5].map(i => (
                    <Ionicons
                      key={i}
                      name={i <= score ? 'star' : 'star-outline'}
                      size={14}
                      color={theme.colors.warning}
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
    let backgroundColor = theme.colors.background; // Cor padrão (branco para locais sem avaliações)
    if (rating >= 4) {
      backgroundColor = theme.colors.success + '20'; // Verde bem claro
    } else if (rating >= 2) {
      backgroundColor = theme.colors.warning + '20'; // Amarelo bem claro
    } else if (rating > 0) {
      backgroundColor = theme.colors.error + '20'; // Vermelho bem claro
    } else if (rating === 0 || rating === null || rating === undefined) {
      backgroundColor = theme.colors.text + '10'; // Cinza claro para locais sem avaliações
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
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.text, { color: theme.colors.text }]}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle" size={40} color={theme.colors.error} />
        <Text style={[styles.text, { color: theme.colors.text }]}>{error}</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.retryText, { color: theme.colors.background }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!location) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {location.imageUrl ? (
            <Image source={{ uri: location.imageUrl }} style={styles.locationImage} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: theme.colors.background }]}>
              <Ionicons name="image" size={50} color={theme.colors.text + '80'} />
              <Text style={[styles.placeholderText, { color: theme.colors.text + '80' }]}>Sem imagem</Text>
            </View>
          )}
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.colors.background + '80' }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <View style={[styles.detailsContainer, getLocationDetailStyle(location.rating)]}>
          <Text style={[styles.name, { color: theme.colors.text }]}>{location.name}</Text>
          <Text style={[styles.address, { color: theme.colors.text + '80' }]}>{location.address}</Text>
          {location.description ? <Text style={[styles.description, { color: theme.colors.text + '80' }]}>{location.description}</Text> : null}

          {/* Informações do autor */}
          <View style={styles.authorContainer}>
            {authorPhotoUrl ? (
              <Image source={{ uri: authorPhotoUrl }} style={styles.authorPhoto} />
            ) : (
              <View style={styles.authorPhotoPlaceholder}>
                 <Ionicons name="person-circle-outline" size={24} color={theme.colors.primary} />
              </View>
            )}
            <Text style={styles.authorText}>Adicionado por: {location.userName || 'Usuário'}</Text>
          </View>

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
                    <Ionicons name={data.icon} size={16} color={theme.colors.background} style={styles.accessibilityFeatureIcon} />
                    <Text style={styles.accessibilityFeatureText}>{data.name}</Text>
                  </View>
                );
              }
              return null;
            })}
          </View>
          <View style={styles.ratingSection}>
            <View style={styles.overallRating}>
              <Text style={[styles.overallRatingText, { color: theme.colors.text }]}>Avaliação Geral:</Text>
              <View style={styles.starsContainer}>
                {renderStars(location.rating, 24)}
                <Text style={[styles.ratingNumber, { color: theme.colors.text }]}>
                   {typeof location.rating === 'number' ? location.rating.toFixed(1) : '-'}
                   {location.reviewCount ? ` (${location.reviewCount})` : ''}
                 </Text>
                 <Text style={[styles.ratingEmoji, { color: theme.colors.text }]}>{getRatingEmoji(location.rating)}</Text>
              </View>
            </View>

            {/* Detalhes da Avaliação por Recurso */}
            {location.accessibilityFeatures && location.accessibilityFeatures.length > 0 && (
              <View style={styles.featureRatingsContainer}>
                <Text style={[styles.featureRatingsTitle, { color: theme.colors.text }]}>Avaliação por Recurso:</Text>
                 <View style={styles.featureRatingList}>
                   {location.accessibilityFeatures.map(feature => {
                     const featureData = {
                        'wheelchair': { name: 'Cadeira de Rodas' },
                        'blind': { name: 'Piso Tátil' },
                        'deaf': { name: 'Surdez' },
                        'elevator': { name: 'Elevador' },
                        'parking': { name: 'Estacionamento' },
                        'restroom': { name: 'Banheiro Adaptado' },
                        'ramp': { name: 'Rampa' }
                      };
                      const name = featureData[feature]?.name || feature;
                      // Encontrar a avaliação para este recurso nos reviews
                       const featureAvgRating = reviews.length > 0
                        ? reviews.reduce((sum, review) => {
                            return sum + (review.featureRatings?.[feature] || 0);
                          }, 0) / reviews.length
                        : 0;

                     return (
                       <View key={feature} style={styles.featureSummaryItem}>
                          <Text style={[styles.featureSummaryName, { color: theme.colors.text }]}>{name}:</Text>
                          <View style={styles.featureSummaryStars}>
                             {renderStars(featureAvgRating, 16)}
                             <Text style={[styles.featureSummaryRating, { color: theme.colors.text + '80' }]}>
                                {featureAvgRating > 0 ? featureAvgRating.toFixed(1) : '-'}
                             </Text>
                          </View>
                       </View>
                     );
                   })}
                 </View>
              </View>
             )}
          </View>

          {/* Recursos de Acessibilidade */}
          {location.accessibilityFeatures && location.accessibilityFeatures.length > 0 && (
            <View style={styles.accessibilitySection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recursos de Acessibilidade:</Text>
              <AccessibilityIcons features={location.accessibilityFeatures} themeColors={theme.colors} />
            </View>
          )}

          {/* Botão para Adicionar Avaliação */}
          <TouchableOpacity 
            style={[styles.addReviewButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setReviewModalVisible(true)}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.background} style={{ marginRight: 5 }} />
            <Text style={[styles.addReviewButtonText, { color: theme.colors.background }]}>Avaliar Local</Text>
          </TouchableOpacity>

          {/* Seção de Avaliações Existentes */}
          <View style={styles.reviewsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Avaliações:</Text>
            {reviews.length > 0 ? (
              <FlatList
                data={reviews}
                keyExtractor={item => item.id}
                renderItem={renderReview}
                ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: theme.colors.text + '10' }]} />}
                scrollEnabled={false} // Desabilitar scroll da FlatList dentro da ScrollView
              />
            ) : (
              <Text style={[styles.noReviewsText, { color: theme.colors.text + '80' }]}>Nenhuma avaliação ainda. Seja o primeiro a avaliar!</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal de Avaliação */}
      <ReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        locationId={locationId}
        locationFeatures={location?.accessibilityFeatures || []}
        // No SubmitReview prop here, handle submission within the modal or pass a function
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  retryText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  locationImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    marginTop: 5,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 8,
    zIndex: 1,
  },
  detailsContainer: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    position: 'relative',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  ratingSection: {
    marginTop: 10,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  overallRatingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  ratingEmoji: {
    fontSize: 20,
    marginLeft: 8,
  },
  featureRatingsContainer: {
    marginTop: 15,
  },
  featureRatingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  featureRatingList: {
  },
  featureSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureSummaryName: {
    fontSize: 15,
    flex: 1,
    marginRight: 10,
  },
  featureSummaryStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureSummaryRating: {
    fontSize: 15,
    marginLeft: 5,
  },
  accessibilitySection: {
    marginTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 20,
  },
  addReviewButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewsSection: {
    marginTop: 20,
  },
  reviewCard: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
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
    backgroundColor: '#ccc',
  },
  reviewUser: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 14,
    marginBottom: 10,
  },
  featureRatingsRow: {
    marginTop: 10,
  },
  featureRatingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewFeatureIcon: {
    marginRight: 5,
  },
  reviewFeatureName: {
    fontSize: 14,
  },
  reviewFeatureStars: {
    flexDirection: 'row',
  },
  separator: {
    height: 1,
    marginVertical: 10,
  },
  noReviewsText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  authorPhoto: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  authorPhotoPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: THEME.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 14,
    color: THEME.colors.textLight,
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
});
