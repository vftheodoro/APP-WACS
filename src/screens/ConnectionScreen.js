import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export const ConnectionScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tela de Conexão Bluetooth</Text>
      {/* Adicionar aqui a lógica e UI para busca e conexão de dispositivos Bluetooth */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5', // Consistente com a tela de controle
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
}); 