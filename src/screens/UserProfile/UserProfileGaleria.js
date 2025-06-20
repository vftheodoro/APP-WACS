import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function UserProfileGaleria() {
  // TODO: Receber props futuramente
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Locais</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {/* Cards de local - exemplo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Praça Central</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Biblioteca</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Restaurante Azul</Text>
        </View>
        {/* ... */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    marginLeft: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2193b0',
    marginBottom: 8,
    marginLeft: 4,
  },
  scroll: {
    flexDirection: 'row',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
}); 