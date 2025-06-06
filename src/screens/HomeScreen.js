import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const HomeScreen = () => {
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <Text style={[styles.title, isDark && styles.darkText]}>
        Bem-vindo ao WACS
      </Text>
      <Text style={[styles.subtitle, isDark && styles.darkText]}>
        Seu assistente de acessibilidade
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#007AFF',
    textAlign: 'center',
  },
  darkText: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 18,
    color: '#007AFF',
    textAlign: 'center',
    opacity: 0.8,
  },
}); 