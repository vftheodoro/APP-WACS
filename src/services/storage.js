import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { storage } from '../config/firebase';

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
 * Converte URI para Blob
 */
const uriToBlob = async (uri) => {
  try {
    console.log('Convertendo URI para blob:', uri);
    const response = await fetch(uri);
    console.log('Fetch response status:', response.status);
    const blob = await response.blob();
    console.log('Blob criado com sucesso, tamanho:', blob.size);
    return blob;
  } catch (error) {
    console.error('Erro ao converter URI para blob:', error);
    throw new Error('Falha ao converter imagem para formato adequado');
  }
};

/**
 * Faz upload de uma imagem para o Firebase Storage
 * @param {string} userId ID do usuário
 * @param {object} imageAsset Objeto da imagem selecionada
 * @param {string} fileName Nome do arquivo (opcional)
 * @returns {Promise<string|null>} URL da imagem ou null em caso de erro
 */
export const uploadImageToFirebase = async (userId, imageAsset, fileName = 'profile_picture.jpg') => {
  if (!userId || !imageAsset || !imageAsset.uri) {
    console.error('Parâmetros inválidos para upload de imagem:', { userId, imageAsset });
    return null;
  }

  try {
    console.log('Iniciando upload de imagem para o Firebase Storage...');
    console.log('Informações da imagem:', { uri: imageAsset.uri, type: imageAsset.type });
    
    // Caminho onde a imagem será armazenada no Firebase Storage
    const storagePath = `users/${userId}/${fileName}`;
    console.log('Caminho de armazenamento:', storagePath);
    
    // Converter a URI da imagem para Blob
    const blob = await uriToBlob(imageAsset.uri);
    
    // Referência ao local de armazenamento
    const storageRef = ref(storage, storagePath);
    console.log('Referência do storage criada');
    
    // Fazer upload
    console.log('Iniciando upload...');
    const snapshot = await uploadBytes(storageRef, blob);
    console.log('Upload concluído com sucesso:', snapshot);
    
    // Obter URL da imagem
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('URL de download obtida:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    // Log detalhado do erro completo
    console.error('Erro detalhado ao fazer upload da imagem (objeto completo):', JSON.stringify(error, null, 2));
    
    console.error('Código de erro:', error.code);
    console.error('Mensagem de erro:', error.message);
    
    // Tentar acessar a resposta do servidor, se existir
    if (error.serverResponse) {
      console.error('Resposta do servidor:', error.serverResponse);
    }

    // Mensagens de erro mais específicas
    let errorMessage = 'Ocorreu um problema ao enviar a imagem.';
    
    if (error.code === 'storage/unauthorized') {
      errorMessage = 'Você não tem permissão para fazer upload desta imagem.';
    } else if (error.code === 'storage/canceled') {
      errorMessage = 'Upload cancelado.';
    } else if (error.code === 'storage/unknown') {
      errorMessage = 'Erro desconhecido durante o upload. Verifique sua conexão.';
    }
    
    Alert.alert('Erro', errorMessage);
    return null;
  }
};

/**
 * Exclui uma imagem do Firebase Storage
 * @param {string} userId ID do usuário
 * @param {string} fileName Nome do arquivo (opcional)
 * @returns {Promise<boolean>} true se a exclusão for bem-sucedida
 */
export const deleteImageFromFirebase = async (userId, fileName = 'profile_picture.jpg') => {
  if (!userId) return false;
  
  try {
    console.log('Tentando excluir imagem:', userId, fileName);
    
    // Caminho da imagem no Firebase Storage
    const storagePath = `users/${userId}/${fileName}`;
    
    // Referência ao arquivo
    const storageRef = ref(storage, storagePath);
    
    // Excluir arquivo
    await deleteObject(storageRef);
    console.log('Imagem excluída com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao excluir imagem:', error);
    
    // Não exibir erro se o arquivo não existir
    if (error.code === 'storage/object-not-found') {
      console.log('Arquivo não encontrado para exclusão, ignorando erro');
      return true;
    }
    
    return false;
  }
}; 