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
import { uploadImageToFirebase, deleteImageFromFirebase } from '../services/storage';
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

  // Atualizar foto de perfil do usuário
  const updateProfilePicture = async (imageAsset) => {
    if (!user || !user.id || !imageAsset) {
      console.error('Dados inválidos para atualizar foto de perfil:', { user, imageAsset });
      Alert.alert('Erro', 'Não foi possível atualizar a foto de perfil.');
      return false;
    }

    try {
      console.log('Iniciando processo de atualização de foto de perfil');
      setIsUploading(true);
      setError(null);

      // Se já existir uma foto, tenta excluir a antiga (não bloqueia em caso de erro)
      if (user.photoURL) {
        try {
          console.log('Tentando excluir foto antiga');
          await deleteImageFromFirebase(user.id);
          console.log('Foto antiga excluída com sucesso');
        } catch (error) {
          console.warn('Erro ao excluir imagem antiga:', error);
          // Não interrompe o fluxo em caso de erro na exclusão
        }
      }

      // Fazer upload da nova imagem
      console.log('Iniciando upload da nova imagem');
      const downloadURL = await uploadImageToFirebase(user.id, imageAsset);
      
      if (!downloadURL) {
        console.error('Não foi possível obter URL de download após o upload');
        throw new Error('Não foi possível obter URL da imagem após o upload');
      }

      console.log('Imagem enviada com sucesso. URL:', downloadURL);

      // Atualizar o perfil do usuário com a nova URL
      console.log('Atualizando perfil do usuário com a nova URL');
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      console.log('Perfil atualizado com sucesso');
      
      // Atualizar estado local
      setUser(prev => ({
        ...prev,
        photoURL: downloadURL
      }));

      // Atualizar dados do último usuário
      if (user) {
        saveLastUser({
          ...user,
          photoURL: downloadURL
        });
      }

      console.log('Processo de atualização de foto concluído com sucesso');
      Alert.alert('Sucesso', 'Sua foto de perfil foi atualizada com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao atualizar foto de perfil:', err);
      setError('Ocorreu um erro ao atualizar sua foto de perfil. Tente novamente.');
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar sua foto de perfil. Tente novamente.');
      return false;
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
      login, 
      logout, 
      register,
      updateUser,
      updateProfilePicture,
      isUploading, 
      loading, 
      error 
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