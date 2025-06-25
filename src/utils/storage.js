import AsyncStorage from '@react-native-async-storage/async-storage';

// Chaves para o armazenamento
const KEYS = {
  LAST_USER: '@wacs:lastUser'
};

/**
 * Salva informações do último usuário logado
 */
export const saveLastUser = async (user) => {
  try {
    // Salva apenas as informações necessárias, não a senha
    const userData = {
      email: user.email,
      name: user.name || 'Usuário',
      photoURL: user.photoURL,
      timestamp: Date.now()
    };
    
    await AsyncStorage.setItem(KEYS.LAST_USER, JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Erro ao salvar dados do usuário:', error);
    return false;
  }
};

/**
 * Recupera informações do último usuário logado
 */
export const getLastUser = async () => {
  try {
    const userData = await AsyncStorage.getItem(KEYS.LAST_USER);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Erro ao recuperar dados do último usuário:', error);
    return null;
  }
};

/**
 * Remove as informações do último usuário
 */
export const clearLastUser = async () => {
  try {
    await AsyncStorage.removeItem(KEYS.LAST_USER);
    return true;
  } catch (error) {
    console.error('Erro ao limpar dados do último usuário:', error);
    return false;
  }
};

/**
 * Salva a lista de IDs de posts vistos pelo usuário
 */
export const saveSeenPosts = async (userId, postIds) => {
  try {
    await AsyncStorage.setItem(`@wacs:seenPosts:${userId}`, JSON.stringify(postIds));
    return true;
  } catch (error) {
    console.error('Erro ao salvar posts vistos:', error);
    return false;
  }
};

/**
 * Recupera a lista de IDs de posts vistos pelo usuário
 */
export const getSeenPosts = async (userId) => {
  try {
    const data = await AsyncStorage.getItem(`@wacs:seenPosts:${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao recuperar posts vistos:', error);
    return [];
  }
};

/**
 * Adiciona um post à lista de vistos
 */
export const addSeenPost = async (userId, postId) => {
  try {
    const seen = await getSeenPosts(userId);
    if (!seen.includes(postId)) {
      seen.push(postId);
      await saveSeenPosts(userId, seen);
    }
    return true;
  } catch (error) {
    console.error('Erro ao adicionar post visto:', error);
    return false;
  }
}; 