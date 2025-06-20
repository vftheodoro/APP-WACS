import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NavigationPanel = ({ 
  onStartNavigation, 
  onCancelNavigation,
  distance,
  duration,
  arrivalTime
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      {expanded ? (
        <View style={styles.expandedPanel}>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#666" />
            <Text style={styles.infoText}>{duration} • {distance}</Text>
          </View>
          <Text style={styles.arrivalText}>Chegada: {arrivalTime}</Text>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onCancelNavigation}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.startButton]}
              onPress={onStartNavigation}
            >
              <Text style={styles.buttonText}>Iniciar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.collapsedPanel}
          onPress={() => setExpanded(true)}
        >
          <Ionicons name="navigate" size={24} color="#007bff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default NavigationPanel;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    width: '90%',
    alignSelf: 'center',
  },
  expandedPanel: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
  collapsedPanel: {
    alignSelf: 'flex-end',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 30,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 16,
  },
  arrivalText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
  },
  startButton: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#fff',
  },
});
