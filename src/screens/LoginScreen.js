import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getLastUser } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [lastUser, setLastUser] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLastUserLogin, setIsLastUserLogin] = useState(false);
  const { login, register, error: authError } = useAuth();
  const passwordInputRef = useRef(null);

  // Carregar último usuário ao iniciar
  useEffect(() => {
    const loadLastUser = async () => {
      const userData = await getLastUser();
      if (userData) {
        setLastUser(userData);
        // Pré-preencher o email para facilitar o login
        setEmail(userData.email);
      } else {
        // Se não houver último usuário, mostrar formulário de login diretamente
        setShowLoginForm(true);
      }
    };

    loadLastUser();
  }, []);

  // Focar no campo de senha quando estiver usando o login do último usuário
  useEffect(() => {
    if (isLastUserLogin && passwordInputRef.current) {
      // Pequeno delay para garantir que o input esteja renderizado
      setTimeout(() => {
        passwordInputRef.current.focus();
      }, 100);
    }
  }, [isLastUserLogin]);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (isRegistering && !name) {
      Alert.alert('Erro', 'Por favor, informe seu nome para registrar');
      return;
    }

    try {
      setIsLoading(true);
      
      if (isRegistering) {
        await register(email, password, name);
        Alert.alert('Sucesso', 'Conta criada com sucesso! Você já pode fazer login.');
        setIsRegistering(false);
        setName('');
      } else {
        await login(email, password);
      }
    } catch (err) {
      // Erro já tratado no contexto
    } finally {
      setIsLoading(false);
    }
  };

  const handleLastUserLogin = () => {
    // Mostrar formulário para inserir senha, mantendo o email preenchido
    setIsLastUserLogin(true);
    setShowLoginForm(true);
    setPassword(''); // Limpar senha por segurança
    // O foco no campo de senha será feito pelo useEffect
  };

  const handleSwitchAccount = () => {
    // Limpar dados do formulário e mostrar tela de login completa
    setEmail('');
    setPassword('');
    setShowLoginForm(true);
    setIsLastUserLogin(false);
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setName('');
    setIsLastUserLogin(false);
  };

  const renderLastUserSection = () => {
    return (
      <View style={styles.lastUserContainer}>
        <View style={styles.userInfoContainer}>
          <View style={styles.avatarContainer}>
            {lastUser?.photoURL ? (
              <Image source={{ uri: lastUser.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{lastUser?.name?.charAt(0) || 'U'}</Text>
              </View>
            )}
          </View>
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>{lastUser?.name}</Text>
            <Text style={styles.userEmail}>{lastUser?.email}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleLastUserLogin}
        >
          <Text style={styles.buttonText}>Entrar com esta conta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchAccountButton}
          onPress={handleSwitchAccount}
        >
          <Text style={styles.switchAccountText}>Usar outra conta</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLoginForm = () => {
    return (
      <View style={styles.formContainer}>
        {authError ? <Text style={styles.error}>{authError}</Text> : null}

        {isRegistering && (
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}

        {/* Se for login com último usuário, mostrar apenas o email sem poder editar */}
        {isLastUserLogin ? (
          <View style={styles.lastUserEmailContainer}>
            <Text style={styles.lastUserEmailLabel}>Email:</Text>
            <Text style={styles.lastUserEmailValue}>{email}</Text>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}

        <TextInput
          ref={passwordInputRef}
          style={styles.input}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          returnKeyType="go"
          onSubmitEditing={handleAuth}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isRegistering ? 'Registrar' : 'Entrar'}
            </Text>
          )}
        </TouchableOpacity>

        {!isLastUserLogin && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleMode}
            disabled={isLoading}
          >
            <Text style={styles.toggleText}>
              {isRegistering
                ? 'Já tem uma conta? Faça login'
                : 'Não tem uma conta? Registre-se'}
            </Text>
          </TouchableOpacity>
        )}

        {lastUser && !isRegistering && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setShowLoginForm(false);
              setIsLastUserLogin(false);
            }}
          >
            <Ionicons name="arrow-back" size={16} color="#007AFF" />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>WACS</Text>
        <Text style={styles.subtitle}>Controle de Arduino</Text>

        {lastUser && !showLoginForm ? renderLastUserSection() : renderLoginForm()}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 15,
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    color: '#007AFF',
    fontSize: 16,
  },
  lastUserContainer: {
    alignItems: 'center',
    padding: 10,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    width: '100%',
    paddingHorizontal: 10,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  switchAccountButton: {
    marginTop: 20,
    paddingVertical: 10,
  },
  switchAccountText: {
    color: '#007AFF',
    fontSize: 16,
  },
  formContainer: {
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 5,
  },
  lastUserEmailContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUserEmailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    color: '#555',
  },
  lastUserEmailValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  }
}); 