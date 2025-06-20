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
        birthdate: values.birthdate,
        cidade: values.cidade,
        mobilityType: values.mobilityType,
        comorbidades: values.comorbidades,
        // outros campos customizados se necessário
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
                profilePic: user.photoURL || null,
                acceptTerms: user.acceptTerms || true,
              }}
              onSave={handleSaveProfileForm}
              onCancel={() => setEditMode(false)}
              readOnlyEmail={true}
              showTerms={true}
              isEditMode={true}
              loading={loading}
            />
          </View>
        ) : (
          <View style={styles.infoArea}>
            {/* Cartão de informações principais aprimorado */}
            <View style={styles.profileCard}>
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
              {user.birthdate && (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={22} color="#1976d2" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Nascimento</Text>
                  <Text style={styles.infoValue}>{new Date(user.birthdate).toLocaleDateString('pt-BR')}</Text>
                </View>
              )}
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
                  <Text style={styles.infoValue}>{user.mobilityType}</Text>
                </View>
              )}
              {user.comorbidades && user.comorbidades.length > 0 && (
                <View style={styles.infoRow}>
                  <Ionicons name="medkit" size={22} color="#1976d2" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Comorbidades</Text>
                  <Text style={styles.infoValue}>{user.comorbidades.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}</Text>
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
              <View style={styles.itemCardLeft}>
                {loc.imageUrl ? (
                  <Image source={{ uri: loc.imageUrl }} style={styles.itemImage} />
                ) : (
                  <View style={styles.itemImagePlaceholder}>
                    <Ionicons name="business" size={28} color="#b0b0b0" />
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
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(loc.rating) }]}>
                    <Ionicons name="star" size={14} color="#fff" />
                    <Text style={styles.ratingBadgeText}>{typeof loc.rating === 'number' && loc.rating > 0 ? loc.rating.toFixed(1) : '-'}</Text>
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
            <View key={review.id} style={[styles.itemCard, { backgroundColor: '#f8fafc' }] }>
              <View style={styles.itemCardLeft}>
                <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(review.rating), marginBottom: 6 }] }>
                  <Ionicons name="star" size={14} color="#fff" />
                  <Text style={styles.ratingBadgeText}>{typeof review.rating === 'number' ? review.rating.toFixed(1) : '-'}</Text>
                </View>
                <MaterialIcons name="rate-review" size={28} color="#1976d2" />
              </View>
              <View style={styles.itemCardBody}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Ionicons name="location" size={16} color="#1976d2" style={{ marginRight: 6 }} />
                  <Text style={styles.itemTitle}>{review.locationName || review.locationId}</Text>
                </View>
                {review.createdAt && (
                  <Text style={styles.itemMeta}>Avaliado em: {review.createdAt.toDate ? review.createdAt.toDate().toLocaleDateString('pt-BR') : '-'}</Text>
                )}
                {review.comment && (
                  <Text style={styles.itemSubtitle} numberOfLines={2}>{review.comment}</Text>
                )}
              </View>
              <View style={styles.itemCardActions}>
                <TouchableOpacity onPress={() => handleDeleteReview(review.id, review.locationName || review.locationId)} style={styles.deleteBtn} accessibilityLabel="Remover avaliação" onLongPress={() => Alert.alert('Remover avaliação', 'Remove esta avaliação do sistema.') }>
                  <Ionicons name="trash" size={22} color="#f44336" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {/* abrir modal de edição futura */}} style={styles.editBtn} accessibilityLabel="Editar avaliação" onLongPress={() => Alert.alert('Editar avaliação', 'Permite editar o comentário e nota desta avaliação.') }>
                  <Ionicons name="create-outline" size={22} color="#1976d2" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
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
});

