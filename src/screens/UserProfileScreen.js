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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import ProfileForm from '../components/common/ProfileForm';

const { width } = Dimensions.get('window');

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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 20,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    zIndex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 0,
  },
  backButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerRightPlaceholder: {
    width: 44,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#1976d2',
    padding: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  progressContainer: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1976d2',
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    top: 8,
    fontSize: 12,
    color: '#666',
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  nameInput: {
    fontSize: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    padding: 8,
    width: '100%',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#1976d2',
    backgroundColor: '#fff',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButton: {
    overflow: 'hidden',
  },
  saveButtonGradient: {
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  passwordModalContent: {
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalCancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  modalConfirmButton: {
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    padding: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordInput: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#f44336',
    marginBottom: 12,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successText: {
    fontSize: 18,
    color: '#34C759',
    fontWeight: '600',
    marginTop: 12,
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
    fontSize: 16,
    color: '#666',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  avatarEditGradient: {
    padding: 8,
    borderRadius: 15,
    alignItems: 'center',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  editFormArea: {
    padding: 20,
  },
  infoArea: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIcon: {
    marginRight: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    padding: 12,
    alignItems: 'center',
  },
  actionBtnIcon: {
    marginRight: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ufBadge: {
    backgroundColor: '#1976d2',
    borderRadius: 10,
    padding: 2,
    marginLeft: 8,
  },
  ufBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionBtnPrimary: {
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
  },
  actionBtnDanger: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  actionBtnGradientDanger: {
    padding: 12,
    alignItems: 'center',
  },
  actionBtnTextDanger: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
