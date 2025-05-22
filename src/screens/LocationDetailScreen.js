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

// Função para obter a cor do ícone da acessibilidade com base na pontuação
const getFeatureIconColor = (score) => {
  if (score >= 4) {
    return THEME.colors.success; // Verde para pontuação alta
  } else if (score >= 2) {
    return THEME.colors.warning; // Amarelo para pontuação média
  } else if (score > 0) {
    return THEME.colors.error; // Vermelho para pontuação baixa
  } else {
    return THEME.colors.text; // Cor padrão (cinza/preto) para sem avaliação ou 0
  }
};

export default function LocationDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { locationId } = route.params || {};
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
                  <Ionicons name={featureIcon} size={16} color={getFeatureIconColor(score)} style={styles.reviewFeatureIcon} />
                  {/* Exibir o nome em português */}
                  <Text style={styles.reviewFeatureName}>{featureName}</Text>
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

        {/* Informações do autor */}
        <View style={styles.authorContainer}>
          {authorPhotoUrl ? (
            <Image source={{ uri: authorPhotoUrl }} style={styles.authorPhoto} />
          ) : (
            <View style={styles.authorPhotoPlaceholder}>
               <Ionicons name="person-circle-outline" size={24} color={THEME.colors.primary} />
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
          <TouchableOpacity style={styles.addReviewBtn} onPress={() => setShowRatingInputs(true)}>
            <Ionicons name="star-outline" size={20} color={THEME.colors.background} />
            <Text style={styles.addReviewBtnText}>Avaliar</Text>
          </TouchableOpacity>
        </View>

        {/* Interface de avaliação individual de acessibilidades */}
        {showRatingInputs && location && location.accessibilityFeatures && (
          <View style={styles.ratingInputsContainer}>
            <Text style={styles.sectionTitle}>Avaliar Acessibilidades</Text>
            {(location.accessibilityFeatures || []).map((feature) => {
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
                  <View key={feature} style={styles.featureRatingInputItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name={data.icon} size={18} color={THEME.colors.text} style={styles.featureRatingInputIcon} />
                      <Text style={styles.featureRatingInputName}>{data.name}</Text>
                    </View>
                    <View style={styles.featureRatingInputStars}>
                      {[1, 2, 3, 4, 5].map(score => (
                        <TouchableOpacity
                          key={score}
                          onPress={() => handleFeatureRatingChange(feature, score)}
                        >
                          <Ionicons
                            name={score <= (featureRatings[feature] || 0) ? 'star' : 'star-outline'}
                            size={24}
                            color={THEME.colors.warning}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              }
              return null;
            })}
            <Text style={styles.commentTitle}>Comentário (Opcional)</Text>
            <TextInput
              style={styles.commentInput}
              multiline
              placeholder="Escreva seu comentário aqui..."
              value={comment}
              onChangeText={setComment}
            />
            <TouchableOpacity style={styles.submitReviewBtn} onPress={submitDetailedReview}>
              <Text style={styles.submitReviewBtnText}>Enviar Avaliação</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelReviewBtn} onPress={() => setShowRatingInputs(false)}>
              <Text style={styles.cancelReviewBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lista de avaliações existentes */}
        {!showRatingInputs && (
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
  addReviewBtnText: {
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
  ratingInputsContainer: {
    padding: 20,
    backgroundColor: THEME.colors.background,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  featureRatingInputItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureRatingInputIcon: {
    marginRight: 10,
  },
  featureRatingInputName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  featureRatingInputStars: {
    flexDirection: 'row',
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 10,
  },
  commentInput: {
    height: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  submitReviewBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
  },
  submitReviewBtnText: {
    color: THEME.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelReviewBtn: {
    backgroundColor: THEME.colors.error,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelReviewBtnText: {
    color: THEME.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
