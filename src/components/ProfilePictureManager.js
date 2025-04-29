import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Text,
  Modal,
  Pressable,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { pickImage } from '../services/storage';
import { colors, shadows, borderRadius } from '../utils/theme';
import * as ImageManipulator from 'expo-image-manipulator';

const CROP_ASPECT_RATIO = [1, 1]; // Formato quadrado

const ProfilePictureManager = ({ size = 120, style }) => {
  const { user, updateProfilePicture, removeProfilePicture, isUploading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [avatarImage, setAvatarImage] = useState(null);

  // Gerar avatar com iniciais quando o usuário não tem foto
  useEffect(() => {
    if (!user?.photoURL && user?.name) {
      // Extrair iniciais do nome do usuário
      const initials = user.name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
      
      setAvatarImage(`https://ui-avatars.com/api/?name=${initials}&background=${colors.primary.replace('#', '')}&color=fff&size=100`);
    } else if (user?.photoURL) {
      setAvatarImage(null);
    }
  }, [user?.photoURL, user?.name]);

  // Função para monitorar o progresso do upload
  const handleProgress = (progress) => {
    setUploadProgress(progress);
  };

  // Função para manipular imagem (crop)
  const cropImage = async (uri) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ crop: { originX: 0, originY: 0, width: 1000, height: 1000 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult;
    } catch (error) {
      console.error('Erro ao recortar imagem:', error);
      return null;
    }
  };

  const handleImagePick = async () => {
    try {
      setIsLoading(true);
      setShowProgress(false);
      setUploadProgress(0);
      
      // Selecionar imagem da galeria
      const imageAsset = await pickImage();
      
      if (imageAsset) {
        // Exibir preview para confirmação
        setPreviewImage(imageAsset.uri);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePicture = async () => {
    try {
      setIsLoading(true);
      await removeProfilePicture(user?.photoURL);
    } catch (error) {
      console.error('Erro ao remover foto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImage = async () => {
    try {
      setIsLoading(true);
      setShowPreview(false);
      setShowProgress(true);
      
      // Recortar imagem antes de enviar
      const croppedImage = await cropImage(previewImage);
      
      if (croppedImage) {
        // Fazer upload com monitoramento de progresso
        await updateProfilePicture(
          { 
            uri: croppedImage.uri,
            type: 'image/jpeg',
            name: 'profile_picture.jpg'
          },
          handleProgress
        );
      }
    } catch (error) {
      console.error('Erro ao confirmar imagem:', error);
      Alert.alert('Erro', 'Não foi possível processar a imagem.');
    } finally {
      setIsLoading(false);
      setShowProgress(false);
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setPreviewImage(null);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Avatar container */}
      <View style={[styles.imageContainer, { width: size, height: size }, shadows.md]}>
        {user?.photoURL ? (
          // Foto do usuário
          <Image
            source={{ uri: user.photoURL }}
            style={[styles.image, { width: size, height: size }]}
            resizeMode="cover"
          />
        ) : avatarImage ? (
          // Avatar com iniciais
          <Image
            source={{ uri: avatarImage }}
            style={[styles.image, { width: size, height: size }]}
            resizeMode="cover"
          />
        ) : (
          // Placeholder padrão
          <View style={[styles.placeholder, { width: size, height: size }]}>
            <MaterialIcons name="person" size={size * 0.5} color={colors.gray} />
          </View>
        )}
        
        {(isUploading || isLoading) && !showProgress && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.white} />
          </View>
        )}

        {/* Ícone de câmera flutuante */}
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={handleImagePick}
          disabled={isUploading || isLoading}
        >
          <MaterialIcons name="photo-camera" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Barra de progresso */}
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${uploadProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
        </View>
      )}

      {/* Botões de ação */}
      {user?.photoURL && (
        <TouchableOpacity
          style={[styles.removeButton]}
          onPress={handleRemovePicture}
          disabled={isUploading || isLoading}
        >
          <MaterialIcons name="delete" size={16} color={colors.error} />
          <Text style={styles.removeButtonText}>Remover foto</Text>
        </TouchableOpacity>
      )}

      {/* Modal de pré-visualização */}
      <Modal
        visible={showPreview}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelPreview}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pré-visualização</Text>
            
            {previewImage && (
              <Image 
                source={{ uri: previewImage }} 
                style={styles.previewImage} 
                resizeMode="cover"
              />
            )}
            
            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={handleCancelPreview}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleConfirmImage}
              >
                <Text style={[styles.buttonText, styles.confirmText]}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  imageContainer: {
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: colors.lightGray,
    position: 'relative',
    borderWidth: 3,
    borderColor: colors.white,
  },
  image: {
    borderRadius: 100,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.sm,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
    borderRadius: borderRadius.md,
  },
  removeButtonText: {
    color: colors.error,
    marginLeft: 4,
    fontSize: 14,
  },
  progressContainer: {
    width: '80%',
    marginTop: 16,
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: colors.lightGray,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontWeight: 'bold',
    color: colors.darkGray,
  },
  confirmText: {
    color: colors.white,
  },
});

export default ProfilePictureManager; 