import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID
} from '@env';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID
};

// Verificar configuração
console.log('Configuração do Firebase (mascarada):', {
  apiKey: FIREBASE_API_KEY ? '***' : 'não definido',
  authDomain: FIREBASE_AUTH_DOMAIN ? '***' : 'não definido',
  projectId: FIREBASE_PROJECT_ID ? '***' : 'não definido',
  storageBucket: FIREBASE_STORAGE_BUCKET ? '***' : 'não definido',
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID ? '***' : 'não definido',
  appId: FIREBASE_APP_ID ? '***' : 'não definido'
});

// Inicializar Firebase
const firebase = initializeApp(firebaseConfig);

// Inicializar Auth com persistência
const auth = initializeAuth(firebase, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Inicializar Storage
const storage = getStorage(firebase);
console.log('Firebase Storage inicializado:', storage ? 'sim' : 'não');

export { auth, firebase, storage }; 