import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function UserProfileResumo() {
  // TODO: Receber props futuramente
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.value}>12</Text>
        <Text style={styles.label}>Locais adicionados</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.value}>34</Text>
        <Text style={styles.label}>Avaliações</Text>
      </View>
      {/* Adicione mais cards conforme necessário */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    marginHorizontal: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 120,
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2193b0',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#555',
  },
}); 