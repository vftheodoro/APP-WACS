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
  Switch
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UserProfileScreen() {
  const { isDark, toggleTheme, theme } = useTheme();
  const { user, updateUser, updateProfilePicture, logout, isUploading, changePassword } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [localImage, setLocalImage] = useState(null);
  
  // Estados para alteração de senha
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Inicializar os estados com os dados do usuário
  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  const handlePickImage = async () => {
    try {
      Alert.alert(
        'Foto de Perfil',
        'Escolha uma opção',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Escolher da Galeria', 
            onPress: async () => {
              // Solicitar permissões de acesso à galeria
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              
              if (status !== 'granted') {
                Alert.alert('Permissão negada', 'Precisamos de permissão para acessar suas fotos.');
                return;
              }

              // Abrir seletor de imagem
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets[0]) {
                setLocalImage(result.assets[0]);
                handleUpdateProfilePicture(result.assets[0]);
              }
            } 
          },
          { 
            text: 'Tirar Foto', 
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              
              if (status !== 'granted') {
                Alert.alert('Permissão negada', 'Precisamos de permissão para acessar sua câmera.');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled && result.assets && result.assets[0]) {
                setLocalImage(result.assets[0]);
                handleUpdateProfilePicture(result.assets[0]);
              }
            } 
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const handleUpdateProfilePicture = async (imageAsset) => {
    try {
      await updateProfilePicture(imageAsset, (progress) => {
        setUploadProgress(progress);
      });
      setUploadProgress(0);
      Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      setUploadProgress(0);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!name.trim()) {
        Alert.alert('Erro', 'O nome não pode estar vazio.');
        return;
      }

      await updateUser({ displayName: name });
      setEditMode(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
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
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Meu Perfil</Text>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={() => setShowLogoutConfirm(true)}
          >
            <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        <View style={[styles.profileSection, { backgroundColor: theme.colors.card }]}>
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={handlePickImage} style={styles.profileImageWrapper}>
              {user.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.colors.primary }]}>
                  <Text style={[styles.profileImagePlaceholderText, { color: theme.colors.background }]}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </TouchableOpacity>

            {isUploading && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
                <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            {editMode ? (
              <TextInput
                style={[styles.nameInput, { color: theme.colors.text, borderBottomColor: theme.colors.border }]}
                value={name}
                onChangeText={setName}
                placeholder="Seu nome"
                placeholderTextColor={theme.colors.textSecondary || '#888'}
                autoCapitalize="words"
              />
            ) : (
              <Text style={[styles.userName, { color: theme.colors.text }]}>{user.name}</Text>
            )}
            <Text style={styles.userEmail}>{user.email}</Text>

            <View style={styles.themeSwitcherContainer}>
              <Text style={[styles.themeSwitcherText, { color: theme.colors.text }]}>Tema Escuro</Text>
              <Switch
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={isDark ? theme.colors.background : theme.colors.backgroundSecondary || '#f4f3f4'}
                ios_backgroundColor={theme.colors.border}
                onValueChange={toggleTheme}
                value={isDark}
              />
            </View>

            {editMode ? (
              <View style={styles.editButtonsRow}>
                <TouchableOpacity 
                  style={[styles.editButton, styles.cancelButton]} 
                  onPress={() => {
                    setEditMode(false);
                    setName(user.name || '');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.editButton, styles.saveButton]} 
                  onPress={handleSaveProfile}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator color={theme.colors.background} />
                  ) : (
                    <Text style={[styles.saveButtonText, { color: theme.colors.background }]}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.editButtonsRow}>
                <TouchableOpacity 
                  style={[styles.editButton, styles.cancelButton]} 
                  onPress={() => setEditMode(true)}
                >
                  <Ionicons name="create-outline" size={20} color={theme.colors.textSecondary || '#555'} style={styles.editIcon} />
                  <Text style={[styles.editButtonText, { color: theme.colors.textSecondary || '#555' }]}>Editar Perfil</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.editButton, styles.changePasswordButton]} 
                  onPress={() => setShowPasswordModal(true)}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary || '#555'} style={styles.editIcon} />
                  <Text style={[styles.changePasswordButtonText, { color: theme.colors.textSecondary || '#555' }]}>Alterar Senha</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informações da Conta</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="person" size={22} color="#007AFF" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Nome</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="mail" size={22} color="#007AFF" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="key" size={22} color="#007AFF" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>ID do Usuário</Text>
              <Text style={styles.infoValue}>{user.id}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Ações</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handlePickImage}>
            <Ionicons name="camera" size={22} color="#007AFF" />
            <Text style={styles.actionText}>Alterar Foto de Perfil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setEditMode(true)}
          >
            <Ionicons name="create" size={22} color="#007AFF" />
            <Text style={styles.actionText}>Editar Informações</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowPasswordModal(true)}
          >
            <Ionicons name="key" size={22} color="#007AFF" />
            <Text style={styles.actionText}>Alterar Senha</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={toggleTheme}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={22} color="#007AFF" />
            <Text style={styles.actionText}>{isDark ? 'Tema Claro' : 'Tema Escuro'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutAction]} 
            onPress={() => setShowLogoutConfirm(true)}
          >
            <Ionicons name="log-out" size={22} color="#FF3B30" />
            <Text style={styles.logoutActionText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de confirmação de logout */}
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
                <Text style={styles.modalConfirmText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal de alteração de senha */}
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
          <View style={[styles.modalContent, { width: '90%' }]}>
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
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nova senha"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirmar nova senha"
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
                    <Text style={styles.saveButtonText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 4,
  },
  profileSection: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  profileImageContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  profileImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  profileImagePlaceholderText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  nameInput: {
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    width: 250,
    textAlign: 'center',
    marginBottom: 12,
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  editIcon: {
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  changePasswordButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 6,
  },
  changePasswordButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5ff',
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
  actionsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,
    marginBottom: 30,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  logoutAction: {
    borderBottomWidth: 0,
  },
  logoutActionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#FF3B30',
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
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalCancelButton: {
    backgroundColor: '#f1f1f1',
  },
  modalConfirmButton: {
    backgroundColor: '#FF3B30',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '600',
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Estilos para o modal de alteração de senha
  passwordInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '100%',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 12,
    textAlign: 'center',
  },
  themeSwitcherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  themeSwitcherText: {
    fontSize: 16,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  successText: {
    fontSize: 18,
    color: '#34C759',
    marginTop: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
