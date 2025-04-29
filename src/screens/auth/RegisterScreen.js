import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, name);
      // Navegação será tratada pelo AuthProvider
    } catch (error) {
      let errorMessage = 'Erro ao criar conta';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email já está em uso';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operação não permitida';
          break;
        case 'auth/weak-password':
          errorMessage = 'Senha muito fraca';
          break;
      }
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>APP-WACS</Text>
          <Text style={styles.welcomeSubtitle}>Criar nova conta</Text>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#4CAF50" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#4CAF50" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#4CAF50" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              disabled={loading}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#4CAF50" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#4CAF50" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmar senha"
              placeholderTextColor="#666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
              disabled={loading}
            >
              <Ionicons 
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#4CAF50" 
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.registerButtonText}>Registrar</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Já tem uma conta? </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.loginLink}>Faça login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '85%',
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    color: '#4CAF50',
    fontSize: 32,
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonDisabled: {
    backgroundColor: '#2E7D32',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen; 