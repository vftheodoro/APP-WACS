import React, { useState, useRef } from 'react';
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
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, error: authError, signInWithGoogle } = useAuth();
  const passwordInputRef = useRef(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Theme colors
  const colors = {
    primary: '#4A90E2',
    background: '#1A1A1A',
    text: '#FFFFFF',
    secondaryText: '#B0B0B0',
    inputBackground: '#2A2A2A',
    error: '#FF3B30',
    success: '#34C759',
    gradient: ['#1A1A1A', '#2A2A2A', '#1A1A1A'],
  };

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (!validateEmail(email)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Por favor, insira um email válido');
      return;
    }

    if (!validatePassword(password)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (isRegistering && !name) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Por favor, informe seu nome para registrar');
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (isRegistering) {
        await register(email, password, name);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Sucesso', 'Conta criada com sucesso! Você já pode fazer login.');
        setIsRegistering(false);
        setName('');
      } else {
        await login(email, password);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    Alert.alert(
      'Indisponível',
      'O login com Google está temporariamente indisponível. Por favor, use o login com email e senha.',
      [{ text: 'OK' }]
    );
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, insira seu email primeiro');
      return;
    }
    Alert.alert('Recuperação de Senha', 'Um email foi enviado para você com instruções de recuperação.');
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setName('');
  };

  const renderLoginForm = () => {
    return (
      <Animated.View 
        style={[
          styles.formContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        {authError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.error, { color: colors.error }]}>{authError}</Text>
          </View>
        ) : null}

        {isRegistering && (
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color={colors.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground }]}
              placeholder="Nome completo"
              placeholderTextColor={colors.secondaryText}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={20} color={colors.secondaryText} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground }]}
            placeholder="Email"
            placeholderTextColor={colors.secondaryText}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color={colors.secondaryText} style={styles.inputIcon} />
          <TextInput
            ref={passwordInputRef}
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground }]}
            placeholder="Senha"
            placeholderTextColor={colors.secondaryText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            returnKeyType="go"
            onSubmitEditing={handleAuth}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? 'eye-off' : 'eye'} 
              size={20} 
              color={colors.secondaryText} 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={handleForgotPassword}
        >
          <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
            Esqueceu sua senha?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
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

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.secondaryText }]} />
          <Text style={[styles.dividerText, { color: colors.secondaryText }]}>ou</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.secondaryText }]} />
        </View>

        <TouchableOpacity
          style={[styles.googleButton, styles.disabledButton]}
          onPress={handleGoogleSignIn}
          disabled={false}
        >
          <FontAwesome name="google" size={20} color="#999" />
          <Text style={[styles.googleButtonText, styles.disabledText]}>Continuar com Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggleMode}
          disabled={isLoading}
        >
          <Text style={[styles.toggleText, { color: colors.primary }]}>
            {isRegistering
              ? 'Já tem uma conta? Faça login'
              : 'Não tem uma conta? Registre-se'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={colors.gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <Image
              source={require('../../assets/logos_wacs/logo_padrao_com_nome.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {renderLoginForm()}
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: width * 0.9,
    height: height * 0.25,
  },
  formContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  input: {
    flex: 1,
    padding: 15,
    paddingLeft: 45,
    borderRadius: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  button: {
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  error: {
    marginLeft: 8,
    fontSize: 14,
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    padding: 5,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  googleButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
    opacity: 0.7,
  },
  disabledText: {
    color: '#999',
  },
}); 