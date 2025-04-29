import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { saveLastUser } from '../utils/storage';
import { saveImageLocally, deleteLocalImage } from '../services/storage';
import { uploadProfilePicture, deleteProfilePicture } from '../services/profilePictureService';
import { Alert } from 'react-native';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Monitorar estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Convertendo o usuário do Firebase para o formato esperado no app
        const formattedUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Usuário',
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL
        };
        
        setUser(formattedUser);
        
        // Salvar informações do usuário para uso futuro
        saveLastUser(formattedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Limpeza ao desmontar o componente
    return () => unsubscribe();
  }, []);

  // Login com email e senha
  const login = async (email, password) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (err) {
      console.error('Erro no login:', err.message);
      setError(getErrorMessage(err.code));
      throw err;
    }
  };

  // Registro de novo usuário
  const register = async (email, password, name) => {
    try {
      setError(null);
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Adicionar o nome de exibição
      if (name) {
        await updateProfile(firebaseUser, { displayName: name });
      }
      
      return true;
    } catch (err) {
      console.error('Erro no registro:', err.message);
      setError(getErrorMessage(err.code));
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      return true;
    } catch (err) {
      console.error('Erro ao fazer logout:', err.message);
      setError(getErrorMessage(err.code));
      throw err;
    }
  };

  // Atualizar dados do usuário
  const updateUser = async (userData) => {
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, userData);
        
        // Atualizar estado local também
        setUser(prev => ({
          ...prev,
          ...userData
        }));
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err.message);
      setError(getErrorMessage(err.code));
      throw err;
    }
  };

  // Atualizar foto de perfil
  const updateProfilePicture = async (imageAsset) => {
    if (!user || !imageAsset) {
      Alert.alert('Erro', 'Usuário ou imagem inválidos');
      return;
    }

    try {
      setIsUploading(true);
      
      // Fazer upload da imagem para o Firebase Storage
      const photoURL = await uploadProfilePicture(user.id, imageAsset);
      
      if (!photoURL) {
        throw new Error('Falha ao fazer upload da imagem');
      }

      // Atualizar o perfil do usuário com a nova URL da foto
      await updateProfile(auth.currentUser, { photoURL });

      // Atualizar estado local
      setUser(prev => ({
        ...prev,
        photoURL
      }));

      // Salvar imagem localmente para cache
      await saveImageLocally(user.id, imageAsset);

      Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
      return photoURL;
    } catch (error) {
      console.error('Erro ao atualizar foto de perfil:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a foto de perfil. Tente novamente.');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Deletar foto de perfil
  const removeProfilePicture = async () => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não encontrado');
      return;
    }

    try {
      setIsUploading(true);

      // Deletar foto do Firebase Storage
      await deleteProfilePicture(user.id);

      // Atualizar perfil do usuário removendo a foto
      await updateProfile(auth.currentUser, { photoURL: null });

      // Atualizar estado local
      setUser(prev => ({
        ...prev,
        photoURL: null
      }));

      // Deletar imagem local
      await deleteLocalImage(user.id);

      Alert.alert('Sucesso', 'Foto de perfil removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover foto de perfil:', error);
      Alert.alert('Erro', 'Não foi possível remover a foto de perfil. Tente novamente.');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Função auxiliar para tratamento de erros
  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Email ou senha incorretos';
      case 'auth/email-already-in-use':
        return 'Este email já está em uso';
      case 'auth/weak-password':
        return 'A senha precisa ter pelo menos 6 caracteres';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/network-request-failed':
        return 'Erro de conexão com a internet';
      default:
        return 'Ocorreu um erro, tente novamente';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      isUploading,
      login,
      register,
      logout,
      updateUser,
      updateProfilePicture,
      removeProfilePicture
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 