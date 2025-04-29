import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, insira seu email');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      Alert.alert(
        'Sucesso',
        'Um email de redefinição de senha foi enviado para seu endereço de email',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      let errorMessage = 'Erro ao enviar email de redefinição';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Nenhuma conta encontrada com este email';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
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
          <Text style={styles.welcomeSubtitle}>Recuperar senha</Text>
        </View>

        <View style={styles.inputContainer}>
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
        </View>

        <TouchableOpacity 
          style={[styles.resetButton, loading && styles.resetButtonDisabled]} 
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.resetButtonText}>Enviar email de recuperação</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Lembrou sua senha? </Text>
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
  resetButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonDisabled: {
    backgroundColor: '#2E7D32',
  },
  resetButtonText: {
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

export default ForgotPasswordScreen; 