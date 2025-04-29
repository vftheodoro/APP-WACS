import React, { useState } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { pickImage } from '../services/storage';
import { colors } from '../utils/theme';

const ProfilePictureManager = ({ size = 120, style }) => {
  const { user, updateProfilePicture, removeProfilePicture, isUploading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleImagePick = async () => {
    try {
      setIsLoading(true);
      const imageAsset = await pickImage();
      
      if (imageAsset) {
        await updateProfilePicture(imageAsset);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePicture = async () => {
    try {
      setIsLoading(true);
      await removeProfilePicture();
    } catch (error) {
      console.error('Erro ao remover foto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.imageContainer, { width: size, height: size }]}>
        {user?.photoURL ? (
          <Image
            source={{ uri: user.photoURL }}
            style={[styles.image, { width: size, height: size }]}
          />
        ) : (
          <View style={[styles.placeholder, { width: size, height: size }]}>
            <MaterialIcons name="person" size={size * 0.5} color={colors.gray} />
          </View>
        )}
        
        {(isUploading || isLoading) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleImagePick}
          disabled={isUploading || isLoading}
        >
          <MaterialIcons name="photo-camera" size={24} color={colors.white} />
        </TouchableOpacity>

        {user?.photoURL && (
          <TouchableOpacity
            style={[styles.button, styles.removeButton]}
            onPress={handleRemovePicture}
            disabled={isUploading || isLoading}
          >
            <MaterialIcons name="delete" size={24} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  imageContainer: {
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: colors.lightGray,
    position: 'relative',
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: colors.error,
  },
});

export default ProfilePictureManager; 