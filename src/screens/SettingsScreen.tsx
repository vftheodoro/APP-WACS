import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export const SettingsScreen = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    highContrast: false,
    largerText: false,
    screenReader: false,
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para alterar a foto de perfil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const toggleAccessibilitySetting = (setting: keyof typeof accessibilitySettings) => {
    setAccessibilitySettings(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  return (
    <ScrollView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Perfil</Text>
        
        <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={40} color={isDark ? '#fff' : '#666'} />
            </View>
          )}
          <Text style={[styles.changePhotoText, isDark && styles.darkText]}>
            Alterar foto
          </Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={[styles.label, isDark && styles.darkText]}>Nome</Text>
          <Text style={[styles.value, isDark && styles.darkText]}>
            {user?.name || 'Usuário'}
          </Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.label, isDark && styles.darkText]}>Email</Text>
          <Text style={[styles.value, isDark && styles.darkText]}>
            {user?.email || 'email@exemplo.com'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
          Acessibilidade
        </Text>

        <View style={styles.settingItem}>
          <Text style={[styles.settingText, isDark && styles.darkText]}>
            Alto Contraste
          </Text>
          <Switch
            value={accessibilitySettings.highContrast}
            onValueChange={() => toggleAccessibilitySetting('highContrast')}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={[styles.settingText, isDark && styles.darkText]}>
            Texto Maior
          </Text>
          <Switch
            value={accessibilitySettings.largerText}
            onValueChange={() => toggleAccessibilitySetting('largerText')}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={[styles.settingText, isDark && styles.darkText]}>
            Leitor de Tela
          </Text>
          <Switch
            value={accessibilitySettings.screenReader}
            onValueChange={() => toggleAccessibilitySetting('screenReader')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
          Aparência
        </Text>

        <View style={styles.settingItem}>
          <Text style={[styles.settingText, isDark && styles.darkText]}>
            Tema Escuro
          </Text>
          <Switch value={isDark} onValueChange={toggleTheme} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
          Segurança
        </Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Alterar Senha</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  darkText: {
    color: '#fff',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    marginTop: 10,
    color: '#007AFF',
  },
  infoContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 