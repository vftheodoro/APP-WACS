import { db } from './config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const USERS_COLLECTION = 'users';

// Cria ou atualiza o usuário no Firestore
export async function saveUserData(uid, data) {
  try {
    await setDoc(doc(db, USERS_COLLECTION, uid), data, { merge: true });
    return true;
  } catch (error) {
    console.error('Erro ao salvar dados do usuário:', error);
    throw error;
  }
}

// Busca os dados do usuário, com fallback para campos ausentes
export async function getUserData(uid) {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (!userDoc.exists()) {
      // Usuário não existe no banco ainda
      return null;
    }
    const data = userDoc.data();
    // Fallback para campos ausentes
    return {
      name: data.name || '',
      email: data.email || '',
      photoURL: data.photoURL || null,
      birthdate: data.birthdate || '',
      cidade: data.cidade || '',
      mobilityType: data.mobilityType || '',
      comorbidades: data.comorbidades || [],
      acceptTerms: data.acceptTerms !== undefined ? data.acceptTerms : true,
      ...data,
    };
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    throw error;
  }
}

// Atualiza apenas campos específicos do usuário
export async function updateUserData(uid, data) {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, uid), data);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar dados do usuário:', error);
    throw error;
  }
} 