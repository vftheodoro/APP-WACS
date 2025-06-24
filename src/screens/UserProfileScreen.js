import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import ProfileForm from '../components/common/ProfileForm';
import { fetchLocations, fetchReviewsForLocation, deleteLocationById, deleteReviewById, updateReviewById } from '../services/firebase/locations';
import ReviewModal from '../components/ReviewModal';
import { fetchLocationById } from '../services/firebase/locations';
import { getUserGamificationData, getLevelNameAndReward, addXP } from '../services/gamification';
import ProfileProgressRing from '../components/common/ProfileProgressRing';

const { width } = Dimensions.get('window');

// Função utilitária para cor da badge de nota
function getRatingColor(rating) {
  if (typeof rating !== 'number' || isNaN(rating) || rating === 0) return '#b0b0b0'; // cinza
  if (rating >= 4) return '#43e97b'; // verde
  if (rating >= 2.5) return '#FFEB3B'; // amarelo
  return '#F44336'; // vermelho
}

export default function UserProfileScreen() {
  const { user, updateUser, updateProfilePicture, logout, isUploading, changePassword } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [localImage, setLocalImage] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-50));
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation();

  // Estados para alteração de senha
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [userLocations, setUserLocations] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [loadingUserData, setLoadingUserData] = useState(true);

  const [editReviewModalVisible, setEditReviewModalVisible] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);
  const [editReviewFeatures, setEditReviewFeatures] = useState([]);
  const [editReviewFeatureRatings, setEditReviewFeatureRatings] = useState({});
  const [editReviewComment, setEditReviewComment] = useState('');
  const [editReviewLocationName, setEditReviewLocationName] = useState('');
  const [editReviewLoading, setEditReviewLoading] = useState(false);

  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const [gamification, setGamification] = useState({ xp: 0, level: 1, badges: [], streak: 0 });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }

    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [user]);

  // Ocultar o header padrão da navegação
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    if (!user) return;
    setLoadingUserData(true);
    // Buscar locais do usuário
    fetchLocations().then(locations => {
      setUserLocations(locations.filter(l => l.userId === user.id));
    });
    // Buscar avaliações do usuário
    fetchAllUserReviews(user.id).then(reviews => {
      setUserReviews(reviews);
      setLoadingUserData(false);
    });
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      getUserGamificationData(user.id).then(setGamification);
    }
  }, [user]);

  // Função para buscar todas as avaliações do usuário
  async function fetchAllUserReviews(userId) {
    // Busca todas as avaliações de todos os locais e filtra pelo userId
    const locations = await fetchLocations();
    let allReviews = [];
    for (const loc of locations) {
      const reviews = await fetchReviewsForLocation(loc.id);
      allReviews = allReviews.concat(reviews.filter(r => r.userId === userId));
    }
    return allReviews;
  }

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        await updateProfilePicture(result.assets[0], setUploadProgress);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handleSaveProfileForm = async (values) => {
    setLoading(true);
    try {
      // Atualiza foto de perfil se mudou
      if (values.profilePic && values.profilePic !== user.photoURL) {
        await updateProfilePicture({ uri: values.profilePic }, setUploadProgress);
      }
      // Atualiza demais campos
      await updateUser({
        displayName: values.fullName,
        name: values.fullName,
        birthdate: values.birthdate,
        cidade: values.cidade,
        mobilityType: values.mobilityType,
        comorbidades: values.comorbidades,
        acceptTerms: values.acceptTerms,
        phoneNumber: values.phoneNumber,
        instagram: values.instagram,
      });
      setEditMode(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      Alert.alert('Erro', 'Não foi possível fazer logout.');
    }
  };

  // Função para lidar com a alteração de senha
  const handleChangePassword = async () => {
    try {
      setPasswordError('');
      setPasswordSuccess(false);
      
      // Validações
      if (!currentPassword) {
        setPasswordError('Digite sua senha atual');
        return;
      }
      
      if (!newPassword) {
        setPasswordError('Digite a nova senha');
        return;
      }
      
      if (newPassword.length < 6) {
        setPasswordError('A nova senha deve ter pelo menos 6 caracteres');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setPasswordError('As senhas não coincidem');
        return;
      }
      
      // Alterar a senha
      await changePassword(currentPassword, newPassword);
      
      // Limpar campos e mostrar mensagem de sucesso
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setPasswordError(error.message || 'Erro ao alterar senha');
    }
  };

  // Função para deletar local e suas avaliações
  const handleDeleteLocation = async (locationId, locationName) => {
    Alert.alert(
      'Remover local',
      `Tem certeza que deseja remover o local "${locationName}"? Todas as avaliações associadas também serão removidas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: async () => {
          try {
            setLoadingUserData(true);
            const reviews = await fetchReviewsForLocation(locationId);
            for (const review of reviews) {
              await deleteReviewById(review.id);
            }
            await deleteLocationById(locationId);
            setUserLocations(prev => prev.filter(l => l.id !== locationId));
            setUserReviews(prev => prev.filter(r => r.locationId !== locationId));
            Alert.alert('Sucesso', 'Local e avaliações removidos.');
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível remover o local.');
          } finally {
            setLoadingUserData(false);
          }
        }},
      ]
    );
  };

  // Função para deletar avaliação
  const handleDeleteReview = async (reviewId, locationName) => {
    Alert.alert(
      'Remover avaliação',
      `Tem certeza que deseja remover sua avaliação para "${locationName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: async () => {
          try {
            setLoadingUserData(true);
            await deleteReviewById(reviewId);
            setUserReviews(prev => prev.filter(r => r.id !== reviewId));
            Alert.alert('Sucesso', 'Avaliação removida.');
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível remover a avaliação.');
          } finally {
            setLoadingUserData(false);
          }
        }},
      ]
    );
  };

  const openEditReviewModal = async (review) => {
    setEditReviewLoading(true);
    setReviewToEdit(review);
    setEditReviewComment(review.comment || '');
    setEditReviewFeatureRatings(review.featureRatings || {});
    try {
      const location = await fetchLocationById(review.locationId);
      setEditReviewFeatures(location.features || []);
      setEditReviewLocationName(location.name || '');
      setEditReviewModalVisible(true);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os dados do local para edição.');
    } finally {
      setEditReviewLoading(false);
    }
  };

  const closeEditReviewModal = () => {
    setEditReviewModalVisible(false);
    setReviewToEdit(null);
    setEditReviewFeatures([]);
    setEditReviewFeatureRatings({});
    setEditReviewComment('');
    setEditReviewLocationName('');
  };

  const handleSaveEditedReview = async ({ rating, comment, featureRatings }) => {
    if (!reviewToEdit) return;
    try {
      setEditReviewLoading(true);
      await updateReviewById(reviewToEdit.id, {
        rating,
        comment,
        featureRatings,
      });
      setUserReviews(prev => prev.map(r => r.id === reviewToEdit.id ? { ...r, rating, comment, featureRatings } : r));
      if (user?.id) {
        await addXP(user.id, 'review');
        getUserGamificationData(user.id).then(setGamification);
      }
      closeEditReviewModal();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a avaliação.');
    } finally {
      setEditReviewLoading(false);
    }
  };

  // Calcule o progresso antes do JSX
  const currentLevelXP = getLevelXP(gamification.level) || 0;
  const nextLevelXP = getNextLevelXP(gamification.level);
  const progressPercent = Math.min(
    1,
    (gamification.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)
  );

  // Antes da exibição dos badges, calcule as contribuições
  const totalContribuicoes = (gamification.reviewsDone || 0) + (user.locationsAdded || 0);
  const percentilAtivo = totalContribuicoes >= 20 ? 'Você está entre os 10% mais ativos!' : totalContribuicoes >= 10 ? 'Continue assim, você está crescendo!' : 'Contribua para a comunidade e desbloqueie conquistas!';

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header visual */}
        <LinearGradient colors={['#1976d2', '#2196f3']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Meu Perfil</Text>
          </View>
        </LinearGradient>
        {/* Foto de perfil centralizada, única */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <ProfileProgressRing progress={progressPercent} size={140} strokeWidth={10} color="#1976d2">
              {user.photoURL ? (
                <Image
                  source={{ uri: user.photoURL }}
                  style={styles.avatarLarge}
                />
              ) : (
                <View style={[styles.avatarLarge, { backgroundColor: '#e3f2fd', alignItems: 'center', justifyContent: 'center' }]}> 
                  <Ionicons name="person-circle" size={100} color="#b0b0b0" />
                </View>
              )}
            </ProfileProgressRing>
            <TouchableOpacity style={styles.avatarEditBtn} onPress={handlePickImage} accessibilityLabel="Trocar foto de perfil">
              <LinearGradient colors={['#1976d2', '#2196f3']} style={styles.avatarEditGradient}>
                <Ionicons name="camera" size={22} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            {isUploading && (
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
              </View>
            )}
          </View>
        </View>
        {/* Gamificação logo abaixo da foto */}
        <View style={{ alignItems: 'center', marginTop: 0, marginBottom: 18 }}>
          <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 20, marginBottom: 6 }}>
            Nível {gamification.level} - {gamification.xp} XP
          </Text>
          <View style={{ width: 220, height: 16, backgroundColor: '#e3f2fd', borderRadius: 8, overflow: 'hidden', marginBottom: 4 }}>
            <View style={{ width: `${progressPercent * 100}%`, height: 16, backgroundColor: '#1976d2', borderRadius: 8 }} />
          </View>
          {/* Card de contribuições estilizado */}
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 18,
            padding: 18,
            marginTop: 14,
            marginBottom: 8,
            alignItems: 'center',
            width: '90%',
            maxWidth: 320,
            alignSelf: 'center',
            shadowColor: '#1976d2',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.10,
            shadowRadius: 12,
            elevation: 8,
            borderWidth: 1,
            borderColor: '#e3f2fd',
            overflow: 'hidden',
          }}>
            <LinearGradient colors={['#e3f2fd', '#fff']} style={{ ...StyleSheet.absoluteFillObject, zIndex: -1, borderRadius: 18 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="medal-outline" size={22} color="#1976d2" style={{ marginRight: 7 }} />
              <Text style={{ fontWeight: 'bold', color: '#1976d2', fontSize: 17, letterSpacing: 0.2 }}>Contribuições</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 2 }}>
              <Text style={{ fontSize: 32, color: '#1976d2', fontWeight: 'bold', marginRight: 8 }}>{totalContribuicoes}</Text>
              <Text style={{ color: '#7B8BB2', fontSize: 15, fontWeight: '600', marginTop: 8 }}>total</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 6, marginBottom: 2 }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Ionicons name="star-outline" size={20} color="#1976d2" />
                <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 15 }}>{gamification.reviewsDone || 0}</Text>
                <Text style={{ color: '#7B8BB2', fontSize: 13 }}>Avaliações</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Ionicons name="location-outline" size={20} color="#1976d2" />
                <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 15 }}>{user.locationsAdded || 0}</Text>
                <Text style={{ color: '#7B8BB2', fontSize: 13 }}>Locais</Text>
              </View>
            </View>
            <Text style={{ color: '#1976d2', fontSize: 13, marginTop: 8, fontStyle: 'italic', fontWeight: '600', textAlign: 'center' }}>{percentilAtivo}</Text>
          </View>
          {/* Exibir badges exceto primeiros_passos */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, justifyContent: 'center' }}>
            {gamification.badges.filter(badge => badge !== 'primeiros_passos').map(badge => (
              <View key={badge} style={{ backgroundColor: '#fffbe6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, margin: 3, borderWidth: 1, borderColor: '#FFD700', flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="star" size={16} color="#FFD700" style={{ marginRight: 4 }} />
                <Text style={{ color: '#222B45', fontWeight: 'bold', fontSize: 13 }}>{badge.replace('_', ' ').toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* Modo edição: formulário tela cheia */}
        {editMode ? (
          <View style={styles.editFormArea}>
            <ProfileForm
              initialValues={{
                fullName: user.name || '',
                email: user.email || '',
                birthdate: user.birthdate || '',
                cidade: user.cidade || '',
                mobilityType: user.mobilityType || '',
                comorbidades: user.comorbidades || [],
                acceptTerms: user.acceptTerms || true,
                phoneNumber: user.phoneNumber || '',
                instagram: user.instagram || '',
              }}
              onSave={handleSaveProfileForm}
              onCancel={() => setEditMode(false)}
              readOnlyEmail={true}
              showTerms={true}
              isEditMode={true}
              loading={loading}
              hideProfilePicField={true}
            />
          </View>
        ) : (
          <View style={styles.infoArea}>
            {/* Cartão de informações principais aprimorado */}
            <View style={styles.profileCard}>
              {/* Principais */}
              <View style={styles.infoRow}>
                <Ionicons name="person" size={22} color="#1976d2" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Nome</Text>
                <Text style={styles.infoValue}>{user.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="mail" size={22} color="#1976d2" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={22} color="#1976d2" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Cidade</Text>
                <Text style={styles.infoValue}>{user.cidade || '-'}</Text>
                <View style={styles.ufBadge}><Text style={styles.ufBadgeText}>SP</Text></View>
              </View>
              {user.mobilityType && (
                <View style={styles.infoRow}>
                  <Ionicons name="walk" size={22} color="#1976d2" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Mobilidade</Text>
                  <Text style={styles.infoValue}>{user.mobilityType.charAt(0).toUpperCase() + user.mobilityType.slice(1)}</Text>
                </View>
              )}
              {user.comorbidades && user.comorbidades.length > 0 && (
                <View style={styles.infoRow}>
                  <Ionicons name="medkit" size={22} color="#1976d2" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Comorbidades</Text>
                  <Text style={styles.infoValue}>{user.comorbidades.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}</Text>
                </View>
              )}
              {/* Botão ver mais/ver menos */}
              <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 6, marginBottom: 2 }} onPress={() => setShowMoreInfo(v => !v)}>
                <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 15 }}>{showMoreInfo ? 'Ver menos' : 'Ver mais'}</Text>
              </TouchableOpacity>
              {/* Informações complementares (expandido) */}
              {showMoreInfo && (
                <View>
                  {user.birthdate && (
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar" size={22} color="#1976d2" style={styles.infoIcon} />
                      <Text style={styles.infoLabel}>Nascimento</Text>
                      <Text style={styles.infoValue}>{new Date(user.birthdate).toLocaleDateString('pt-BR')}</Text>
                    </View>
                  )}
                  {user.phoneNumber && (
                    <View style={styles.infoRow}>
                      <Ionicons name="call" size={22} color="#1976d2" style={styles.infoIcon} />
                      <Text style={styles.infoLabel}>Telefone</Text>
                      <Text style={styles.infoValue}>{user.phoneNumber}</Text>
                    </View>
                  )}
                  {user.instagram && (
                    <View style={styles.infoRow}>
                      <Ionicons name="logo-instagram" size={22} color="#1976d2" style={styles.infoIcon} />
                      <Text style={styles.infoLabel}>Instagram</Text>
                      <Text style={styles.infoValue}>{user.instagram.startsWith('@') ? user.instagram : `@${user.instagram}`}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            {/* Botões de ação aprimorados */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                onPress={() => setEditMode(true)}
                activeOpacity={0.8}
                accessibilityLabel="Editar perfil"
              >
                <LinearGradient colors={['#1976d2', '#2196f3']} style={styles.actionBtnGradient}>
                  <Ionicons name="create-outline" size={24} color="#fff" style={styles.actionBtnIcon} />
                  <Text style={styles.actionBtnText}>Editar Perfil</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                onPress={() => setShowPasswordModal(true)}
                activeOpacity={0.8}
                accessibilityLabel="Alterar senha"
              >
                <LinearGradient colors={['#1976d2', '#2196f3']} style={styles.actionBtnGradient}>
                  <Ionicons name="lock-closed-outline" size={24} color="#fff" style={styles.actionBtnIcon} />
                  <Text style={styles.actionBtnText}>Alterar Senha</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnDanger, { marginLeft: 0, marginRight: 0, marginTop: 8 }]}
                onPress={() => setShowLogoutConfirm(true)}
                activeOpacity={0.85}
                accessibilityLabel="Sair da conta"
              >
                <LinearGradient colors={['#f44336', '#d32f2f']} style={styles.actionBtnGradientDanger}>
                  <Ionicons name="log-out-outline" size={28} color="#fff" style={styles.actionBtnIcon} />
                  <Text style={styles.actionBtnTextDanger}>Sair</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Modals */}
        <Modal
          visible={showLogoutConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogoutConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Sair da conta?</Text>
              <Text style={styles.modalText}>Tem certeza que deseja sair da sua conta?</Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => setShowLogoutConfirm(false)}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalConfirmButton]}
                  onPress={() => {
                    setShowLogoutConfirm(false);
                    handleLogout();
                  }}
                >
                  <LinearGradient
                    colors={['#f44336', '#d32f2f']}
                    style={styles.modalConfirmGradient}
                  >
                    <Text style={styles.modalConfirmText}>Sair</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showPasswordModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
            setPasswordSuccess(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.passwordModalContent]}>
              <Text style={styles.modalTitle}>Alterar Senha</Text>
              
              {passwordSuccess ? (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={60} color="#34C759" />
                  <Text style={styles.successText}>Senha alterada com sucesso!</Text>
                </View>
              ) : (
                <>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Senha atual"
                    placeholderTextColor="#888"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Nova senha"
                    placeholderTextColor="#888"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirmar nova senha"
                    placeholderTextColor="#888"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  
                  {passwordError ? (
                    <Text style={styles.errorText}>{passwordError}</Text>
                  ) : null}
                  
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalCancelButton]}
                      onPress={() => {
                        setShowPasswordModal(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setPasswordError('');
                      }}
                    >
                      <Text style={styles.modalCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.modalButton, styles.saveButton]}
                      onPress={handleChangePassword}
                    >
                      <LinearGradient
                        colors={['#1976d2', '#2196f3']}
                        style={styles.saveButtonGradient}
                      >
                        <Text style={styles.saveButtonText}>Salvar</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Seção Locais adicionados pelo usuário */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Locais adicionados</Text>
          {loadingUserData ? <ActivityIndicator size="small" color="#1976d2" /> : null}
          {userLocations.length === 0 && !loadingUserData && (
            <Text style={styles.sectionEmpty}>Você ainda não adicionou locais.</Text>
          )}
          {userLocations.map(loc => (
            <View key={loc.id} style={styles.itemCard}>
              <View style={styles.itemCardLeftCentered}>
                {loc.imageUrl ? (
                  <Image source={{ uri: loc.imageUrl }} style={styles.itemImageLarge} />
                ) : (
                  <View style={styles.itemImagePlaceholderLarge}>
                    <Ionicons name="business" size={38} color="#b0b0b0" />
                  </View>
                )}
              </View>
              <View style={styles.itemCardBody}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Ionicons name="location" size={18} color="#1976d2" style={{ marginRight: 6 }} />
                  <Text style={styles.itemTitle}>{loc.name}</Text>
                </View>
                <Text style={styles.itemSubtitle}>{loc.address}</Text>
                {loc.createdAt && (
                  <Text style={styles.itemMeta}>Adicionado em: {loc.createdAt.toDate ? loc.createdAt.toDate().toLocaleDateString('pt-BR') : '-'}</Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <View style={styles.ratingBadgeLarge}>
                    <Ionicons name="star" size={20} color="#FFD700" />
                    <Text style={styles.ratingBadgeTextLarge}>{typeof loc.rating === 'number' && loc.rating > 0 ? loc.rating.toFixed(1) : '-'}</Text>
                  </View>
                  <Text style={styles.itemMeta}>{loc.reviewCount > 0 ? `${loc.reviewCount} avaliações` : 'Sem avaliações'}</Text>
                </View>
              </View>
              <View style={styles.itemCardActions}>
                <TouchableOpacity onPress={() => handleDeleteLocation(loc.id, loc.name)} style={styles.deleteBtn} accessibilityLabel="Remover local" onLongPress={() => Alert.alert('Remover local', 'Remove este local e todas as avaliações associadas.') }>
                  <Ionicons name="trash" size={22} color="#f44336" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        {/* Seção Avaliações feitas pelo usuário */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Avaliações feitas</Text>
          {loadingUserData ? <ActivityIndicator size="small" color="#1976d2" /> : null}
          {userReviews.length === 0 && !loadingUserData && (
            <Text style={styles.sectionEmpty}>Você ainda não avaliou nenhum local.</Text>
          )}
          {userReviews.map(review => (
            <View key={review.id} style={styles.reviewCardModern}>
              <View style={styles.reviewLeftColumn}>
                <View style={styles.reviewRatingBadge}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.reviewRatingText}>{typeof review.rating === 'number' ? review.rating.toFixed(1) : '-'}</Text>
                </View>
                <View style={styles.reviewIconCircle}>
                  <MaterialIcons name="rate-review" size={22} color="#fff" />
              </View>
              </View>
              <View style={styles.reviewContentColumn}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Ionicons name="location" size={15} color="#1976d2" style={{ marginRight: 5 }} />
                  <Text style={styles.reviewTitle}>{review.locationName || review.locationId}</Text>
                </View>
                {review.createdAt && (
                  <Text style={styles.reviewMeta}>Avaliado em: {review.createdAt.toDate ? review.createdAt.toDate().toLocaleDateString('pt-BR') : '-'}</Text>
                )}
                {review.comment && (
                  <Text style={styles.reviewComment} numberOfLines={2}>{review.comment}</Text>
                )}
              </View>
              <View style={styles.reviewActionsColumn}>
                <TouchableOpacity onPress={() => handleDeleteReview(review.id, review.locationName || review.locationId)} style={styles.reviewActionBtn} accessibilityLabel="Remover avaliação" onLongPress={() => Alert.alert('Remover avaliação', 'Remove esta avaliação do sistema.') }>
                  <Ionicons name="trash" size={20} color="#f44336" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openEditReviewModal(review)} style={styles.reviewActionBtn} accessibilityLabel="Editar avaliação">
                  <Ionicons name="create-outline" size={20} color="#1976d2" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      {/* Modal de edição de avaliação */}
      <ReviewModal
        visible={editReviewModalVisible}
        onClose={closeEditReviewModal}
        onSubmit={handleSaveEditedReview}
        features={editReviewFeatures}
        locationName={editReviewLocationName}
        initialComment={editReviewComment}
        initialFeatureRatings={editReviewFeatureRatings}
        loading={editReviewLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 10,
    zIndex: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.2,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 18,
    zIndex: 2,
  },
  avatarWrapper: {
    position: 'relative',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarLarge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#e3f2fd',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarEditGradient: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: -12,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#e3f2fd',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1976d2',
    borderRadius: 2,
  },
  editFormArea: {
    padding: 20,
    paddingTop: 8,
  },
  infoArea: {
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 18,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 8,
    width: '100%',
    maxWidth: 370,
    alignSelf: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F7',
    minHeight: 36,
  },
  infoIcon: {
    marginRight: 10,
    opacity: 0.7,
    fontSize: 18,
  },
  infoLabel: {
    fontSize: 14,
    color: '#B0B8C9',
    fontWeight: '500',
    marginRight: 6,
    minWidth: 70,
  },
  infoValue: {
    fontSize: 16,
    color: '#222B45',
    fontWeight: '700',
    flexShrink: 1,
  },
  ufBadge: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8,
    alignSelf: 'center',
  },
  ufBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 12,
    marginBottom: 10,
    marginTop: 10,
    maxWidth: 370,
    alignSelf: 'center',
  },
  actionBtn: {
    width: '31%',
    minWidth: 100,
    maxWidth: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    alignItems: 'center',
    elevation: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
  },
  actionBtnGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 0,
    borderRadius: 16,
    width: '100%',
  },
  actionBtnIcon: {
    marginBottom: 6,
    fontSize: 22,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: 'transparent',
  },
  actionBtnDanger: {
    backgroundColor: 'transparent',
  },
  actionBtnGradientDanger: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    width: '100%',
  },
  actionBtnTextDanger: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(34,43,69,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  passwordModalContent: {
    width: '98%',
    padding: 28,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222B45',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 15,
    color: '#7B8BB2',
    textAlign: 'center',
    marginBottom: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 48,
    maxWidth: 120,
  },
  modalCancelButton: {
    backgroundColor: '#F0F2F7',
    padding: 12,
  },
  modalConfirmButton: {
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  modalCancelText: {
    color: '#7B8BB2',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  passwordInput: {
    width: '100%',
    backgroundColor: '#F0F2F7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    color: '#222B45',
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  errorText: {
    color: '#f44336',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    padding: 18,
  },
  successText: {
    fontSize: 17,
    color: '#34C759',
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#7B8BB2',
    fontWeight: '500',
  },
  saveButton: {
    overflow: 'hidden',
  },
  saveButtonGradient: {
    padding: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 8,
    width: '100%',
    maxWidth: 370,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222B45',
    marginBottom: 10,
  },
  sectionEmpty: {
    fontSize: 15,
    color: '#7B8BB2',
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F7',
    minHeight: 36,
  },
  itemCardLeft: {
    flex: 1,
  },
  itemCardBody: {
    flex: 1,
  },
  itemCardActions: {
    padding: 5,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 10,
  },
  itemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    color: '#222B45',
    fontWeight: '700',
    flexShrink: 1,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#7B8BB2',
    flexShrink: 1,
  },
  itemMeta: {
    fontSize: 12,
    color: '#7B8BB2',
    flexShrink: 1,
  },
  deleteBtn: {
    padding: 5,
  },
  editBtn: {
    padding: 5,
  },
  ratingBadge: {
    backgroundColor: '#b0b0b0',
    borderRadius: 8,
    padding: 4,
    marginRight: 6,
  },
  ratingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemCardLeftCentered: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    minWidth: 100,
  },
  itemImageLarge: {
    width: 90,
    height: 90,
    borderRadius: 18,
    marginBottom: 2,
    backgroundColor: '#f7fafd',
  },
  itemImagePlaceholderLarge: {
    width: 90,
    height: 90,
    borderRadius: 18,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  ratingBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbe6',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  ratingBadgeTextLarge: {
    color: '#222B45',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 7,
  },
  reviewCardModern: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  reviewLeftColumn: {
    alignItems: 'center',
    marginRight: 14,
    width: 44,
  },
  reviewRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbe6',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    elevation: 1,
  },
  reviewRatingText: {
    color: '#222B45',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reviewIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  reviewContentColumn: {
    flex: 1,
    marginRight: 10,
  },
  reviewTitle: {
    fontSize: 16,
    color: '#222B45',
    fontWeight: '700',
    flexShrink: 1,
  },
  reviewMeta: {
    fontSize: 12,
    color: '#7B8BB2',
    marginBottom: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: '#444',
    marginTop: 2,
  },
  reviewActionsColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    gap: 8,
  },
  reviewActionBtn: {
    padding: 6,
  },
  input: {
    width: '100%',
    backgroundColor: '#F0F2F7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    color: '#222B45',
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  formCancelButtonCompact: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 48,
    backgroundColor: '#F0F2F7',
    padding: 12,
  },
  formCancelButtonTextCompact: {
    color: '#7B8BB2',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  formSaveButtonCompact: {
    overflow: 'hidden',
  },
  formSaveButtonGradientCompact: {
    padding: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  formSaveButtonTextCompact: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

// Funções auxiliares para XP de nível
function getLevelXP(level) {
  const LEVELS = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 999999];
  return LEVELS[Math.max(0, Math.min(level - 1, LEVELS.length - 1))];
}
function getNextLevelXP(level) {
  const LEVELS = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 999999];
  return LEVELS[Math.max(1, Math.min(level, LEVELS.length - 1))];
}

