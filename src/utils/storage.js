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