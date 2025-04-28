import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Opções para seleção de imagem
 */
const imagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

/**
 * Solicita permissão para acessar a galeria
 */
const requestMediaLibraryPermission = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permissão necessária',
      'Precisamos de permissão para acessar sua galeria de fotos.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

/**
 * Abre a galeria para selecionar uma imagem
 * @returns {Promise<object|null>} Objeto com a imagem selecionada ou null se cancelado
 */
export const pickImage = async () => {
  try {
    console.log('Iniciando seleção de imagem...');
    
    // Verificar permissão
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) {
      console.log('Permissão para acessar galeria negada');
      return null;
    }
    
    // Abrir seletor de imagem
    const result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions);
    console.log('Resultado do ImagePicker:', result);
    
    if (result.canceled || !result.assets || result.assets.length === 0) {
      console.log('Seleção de imagem cancelada pelo usuário');
      return null;
    }
    
    // Obter a primeira imagem selecionada
    const selectedImage = result.assets[0];
    console.log('Imagem selecionada:', selectedImage.uri);
    
    return {
      uri: selectedImage.uri,
      type: 'image/jpeg',
      name: 'profile_picture.jpg',
    };
  } catch (error) {
    console.error('Erro ao escolher imagem:', error);
    Alert.alert('Erro', 'Ocorreu um erro ao tentar selecionar a imagem.');
    return null;
  }
};

/**
 * Salva a imagem localmente no dispositivo
 * @param {string} userId ID do usuário
 * @param {object} imageAsset Objeto da imagem selecionada
 * @returns {Promise<string|null>} URI da imagem salva ou null em caso de erro
 */
export const saveImageLocally = async (userId, imageAsset) => {
  if (!userId || !imageAsset || !imageAsset.uri) {
    console.error('Parâmetros inválidos para salvar imagem:', { userId, imageAsset });
    return null;
  }

  try {
    console.log('Iniciando salvamento local da imagem...');
    
    // Criar diretório se não existir
    const directory = `${FileSystem.documentDirectory}profile_pictures/`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    
    // Caminho onde a imagem será salva
    const filePath = `${directory}${userId}_profile_picture.jpg`;
    
    // Copiar a imagem para o local desejado
    await FileSystem.copyAsync({
      from: imageAsset.uri,
      to: filePath
    });
    
    console.log('Imagem salva com sucesso em:', filePath);
    return filePath;
  } catch (error) {
    console.error('Erro ao salvar imagem localmente:', error);
    Alert.alert('Erro', 'Ocorreu um erro ao salvar a imagem. Tente novamente.');
    return null;
  }
};

/**
 * Remove a imagem salva localmente
 * @param {string} userId ID do usuário
 * @returns {Promise<boolean>} true se a exclusão for bem-sucedida
 */
export const deleteLocalImage = async (userId) => {
  if (!userId) return false;
  
  try {
    const filePath = `${FileSystem.documentDirectory}profile_pictures/${userId}_profile_picture.jpg`;
    await FileSystem.deleteAsync(filePath, { idempotent: true });
    console.log('Imagem local excluída com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao excluir imagem local:', error);
    return false;
  }
}; 