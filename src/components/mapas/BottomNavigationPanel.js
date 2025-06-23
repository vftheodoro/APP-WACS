import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

/**
 * BottomNavigationPanel - Painel inferior Waze-like (tema claro)
 * Props:
 *  - eta: string (ex: '12:34')
 *  - duration: string (ex: '51 min')
 *  - distance: string (ex: '3,8 km')
 *  - progress: number (0-1)
 *  - onStop, onRoutes, onShare: funções
 *  - alerts: array de { type, description }
 */
const alertIcons = {
  'obstacle': 'warning',
  'incline': 'trending-up',
  'step': 'stairs',
  'hole': 'report-problem',
  'ramp': 'accessible',
};

export default function BottomNavigationPanel({ eta, duration, distance, progress = 0, onStop, onRoutes, onShare, alerts = [] }) {
  return (
    <View style={styles.container} accessibilityRole="summary">
      {/* Barra de progresso */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBar, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      {/* Linha principal: ETA, tempo, distância */}
      <View style={styles.row}>
        <Text style={styles.eta}>{eta}</Text>
        <Text style={styles.info}>{duration} <Ionicons name="time-outline" size={18} color="#1976d2" /></Text>
        <Text style={styles.info}>{distance} <Ionicons name="walk" size={18} color="#1976d2" /></Text>
      </View>
      {/* Alertas */}
      {alerts.length > 0 && (
        <View style={styles.alertsRow}>
          {alerts.map((a, idx) => (
            <View key={idx} style={styles.alertIconBox}>
              <MaterialIcons name={alertIcons[a.type] || 'warning'} size={22} color="#FF9800" />
              <Text style={styles.alertText}>{a.description}</Text>
            </View>
          ))}
        </View>
      )}
      {/* Botões grandes */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.button} onPress={onRoutes} accessibilityLabel="Rotas alternativas">
          <Ionicons name="swap-horizontal" size={26} color="#1976d2" />
          <Text style={styles.buttonText}>Rotas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onShare} accessibilityLabel="Compartilhar rota">
          <Ionicons name="share-social" size={26} color="#1976d2" />
          <Text style={styles.buttonText}>Compartilhar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#ff4444' }]} onPress={onStop} accessibilityLabel="Parar navegação">
          <Ionicons name="close-circle" size={26} color="#fff" />
          <Text style={[styles.buttonText, { color: '#fff' }]}>Parar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingBottom: 18,
    paddingHorizontal: 18,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    borderTopWidth: 1,
    borderColor: '#e3eaf2',
  },
  progressBarBg: {
    height: 7,
    backgroundColor: '#e3eaf2',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: 7,
    backgroundColor: '#1976d2',
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eta: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  info: {
    fontSize: 18,
    color: '#1976d2',
    fontWeight: '500',
  },
  alertsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  alertIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  alertText: {
    color: '#FF9800',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3eaf2',
    borderRadius: 14,
    paddingVertical: 10,
    marginHorizontal: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 2,
  },
}); 