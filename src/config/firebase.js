// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Obter as variáveis de ambiente do Expo
const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID
} = Constants.expoConfig.extra;

// Verificar se todas as variáveis de ambiente estão definidas
const requiredEnvVars = {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Variáveis de ambiente do Firebase faltando:', missingVars);
  throw new Error('Configuração do Firebase incompleta. Verifique o arquivo .env');
}

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID
};

// Verificar se o Firebase já foi inicializado
let app;
let auth;
let storage;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase inicializado com sucesso');
  } else {
    app = getApps()[0];
    console.log('Firebase já inicializado, reutilizando instância existente');
  }

  // Initialize Auth with persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log('Firebase Auth inicializado com sucesso');

  // Initialize Storage
  storage = getStorage(app);
  console.log('Firebase Storage inicializado com sucesso');
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error);
  throw error;
}

export { auth, app, storage }; 