import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MapSettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="settings" size={32} color="#1976d2" style={{ marginRight: 12 }} />
        <Text style={styles.title}>Configurações do Mapa</Text>
      </View>
      <Text style={styles.subtitle}>Personalize sua experiência de navegação:</Text>
      {/* Futuras opções de configuração aqui */}
      <View style={styles.optionBox}>
        <Text style={styles.optionLabel}>Tipo de mapa, camadas, acessibilidade, etc.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 18,
  },
  optionBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  optionLabel: {
    color: '#1976d2',
    fontWeight: '500',
    fontSize: 15,
  },
}); 