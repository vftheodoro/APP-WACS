import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Text, 
  ActivityIndicator,
  Alert,
  ToastAndroid,
  Platform
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { pickImage } from '../services/storage';
import { Ionicons } from '@expo/vector-icons';

// Função para mostrar toast em Android ou alert em iOS
const showToast = (message) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Aviso', message);
  }
};

/**
 * Componente de foto de perfil com opção de upload
 * @param {Object} props
 * @param {number} props.size Tamanho da imagem (default: 100)
 * @param {boolean} props.editable Se a imagem pode ser editada (default: true)
 * @param {function} props.onImageUpdated Callback chamado quando a imagem é atualizada com sucesso
 */
export const ProfilePicture = ({ 
  size = 100, 
  editable = true,
  onImageUpdated = null
}) => {
  const { user, updateProfilePicture, isUploading } = useAuth();
  const [localLoading, setLocalLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Estilo dinâmico com base no tamanho
  const dynamicStyles = {
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    image: {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    placeholderText: {
      fontSize: size * 0.4,
    },
    editButton: {
      width: size * 0.3,
      height: size * 0.3,
      borderRadius: size * 0.15,
      bottom: 0,
      right: 0,
    },
    editIcon: {
      fontSize: size * 0.15,
    }
  };

  const handleSelectImage = async () => {
    try {
      setLocalLoading(true);
      showToast('Abrindo galeria...');
      console.log('Iniciando seleção de imagem no componente ProfilePicture');
      
      // Selecionar imagem da galeria
      const imageAsset = await pickImage();
      
      setLocalLoading(false);
      
      if (!imageAsset) {
        console.log('Nenhuma imagem selecionada');
        return;
      }
      
      console.log('Imagem selecionada no componente ProfilePicture:', imageAsset.uri);
      
      // Confirmação antes de fazer upload
      Alert.alert(
        'Atualizar foto',
        'Deseja atualizar sua foto de perfil?',
        [
          {
            text: 'Cancelar',
            style: 'cancel'
          },
          {
            text: 'Sim',
            onPress: async () => {
              try {
                setLocalLoading(true);
                showToast('Enviando imagem...');
                
                // Fazer upload da imagem
                const success = await updateProfilePicture(imageAsset);
                
                setLocalLoading(false);
                
                if (success) {
                  showToast('Foto atualizada com sucesso!');
                  if (onImageUpdated) {
                    onImageUpdated(user.photoURL);
                  }
                  // Resetar contagem de tentativas
                  setRetryCount(0);
                } else {
                  throw new Error('Falha no upload da imagem');
                }
              } catch (error) {
                setLocalLoading(false);
                console.error('Erro ao fazer upload da imagem:', error);
                
                // Se falhar, oferece opção de tentar novamente (até 3 vezes)
                if (retryCount < 3) {
                  Alert.alert(
                    'Erro',
                    'Não foi possível atualizar sua foto de perfil. Deseja tentar novamente?',
                    [
                      {
                        text: 'Cancelar',
                        style: 'cancel'
                      },
                      {
                        text: 'Tentar novamente',
                        onPress: () => {
                          setRetryCount(prev => prev + 1);
                          // Tentar novamente com a mesma imagem
                          setTimeout(() => {
                            updateProfilePicture(imageAsset)
                              .then(success => {
                                if (success && onImageUpdated) {
                                  onImageUpdated(user.photoURL);
                                  showToast('Foto atualizada com sucesso!');
                                }
                              })
                              .catch(err => console.error('Erro na tentativa:', err))
                              .finally(() => setLocalLoading(false));
                          }, 1000);
                        }
                      }
                    ]
                  );
                } else {
                  Alert.alert('Erro', 'Não foi possível atualizar sua foto depois de várias tentativas. Por favor, tente mais tarde.');
                }
              }
            }
          }
        ]
      );
    } catch (error) {
      setLocalLoading(false);
      console.error('Erro ao selecionar imagem no componente:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem. Tente novamente.');
    }
  };

  // Renderiza placeholder se não houver foto
  const renderPlaceholder = () => {
    const initial = user?.name?.charAt(0) || '?';
    
    return (
      <View style={[styles.placeholder, dynamicStyles.container]}>
        <Text style={[styles.placeholderText, dynamicStyles.placeholderText]}>
          {initial}
        </Text>
      </View>
    );
  };

  // Renderiza botão de edição
  const renderEditButton = () => {
    if (!editable) return null;
    
    return (
      <TouchableOpacity 
        style={[styles.editButton, dynamicStyles.editButton]}
        onPress={handleSelectImage}
        disabled={isUploading || localLoading}
      >
        <Ionicons 
          name="camera" 
          style={dynamicStyles.editIcon} 
          color="#fff" 
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, dynamicStyles.container]}>
        {isUploading || localLoading ? (
          <View style={[styles.loading, dynamicStyles.container]}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : user?.photoURL ? (
          <Image 
            source={{ uri: user.photoURL }}
            style={[styles.image, dynamicStyles.image]}
          />
        ) : (
          renderPlaceholder()
        )}
        {renderEditButton()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'white',
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  loading: {
    backgroundColor: 'rgba(245, 245, 245, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 