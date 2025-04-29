import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';

/**
 * Faz upload da foto de perfil para o Firebase Storage
 * @param {string} userId ID do usuário
 * @param {object} imageAsset Objeto da imagem selecionada
 * @returns {Promise<string|null>} URL da imagem no Firebase Storage ou null em caso de erro
 */
export const uploadProfilePicture = async (userId, imageAsset) => {
  if (!userId || !imageAsset || !imageAsset.uri) {
    console.error('Parâmetros inválidos para upload:', { userId, imageAsset });
    return null;
  }

  try {
    console.log('Iniciando upload da foto de perfil...');

    // Criar referência para o arquivo no Storage
    const storageRef = ref(storage, `profile_pictures/${userId}_profile_picture.jpg`);

    // Converter a imagem para blob
    const response = await fetch(imageAsset.uri);
    const blob = await response.blob();

    // Fazer upload do arquivo
    await uploadBytes(storageRef, blob);
    console.log('Upload concluído com sucesso');

    // Obter URL de download
    const downloadURL = await getDownloadURL(storageRef);
    console.log('URL de download obtida:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('Erro ao fazer upload da foto de perfil:', error);
    throw error;
  }
};

/**
 * Deleta a foto de perfil do Firebase Storage
 * @param {string} userId ID do usuário
 * @returns {Promise<boolean>} true se a deleção foi bem sucedida
 */
export const deleteProfilePicture = async (userId) => {
  if (!userId) {
    console.error('ID do usuário não fornecido');
    return false;
  }

  try {
    console.log('Iniciando deleção da foto de perfil...');

    // Criar referência para o arquivo no Storage
    const storageRef = ref(storage, `profile_pictures/${userId}_profile_picture.jpg`);

    // Deletar o arquivo
    await deleteObject(storageRef);
    console.log('Foto de perfil deletada com sucesso');

    return true;
  } catch (error) {
    console.error('Erro ao deletar foto de perfil:', error);
    throw error;
  }
}; 