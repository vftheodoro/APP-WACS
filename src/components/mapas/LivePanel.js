import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const LivePanel = ({ speed, accuracy, elevation }) => (
  <View style={styles.container}>
    <View style={styles.item}>
      <MaterialCommunityIcons name="speedometer" size={20} color="#FF5722" />
      <Text style={styles.text}>{speed || '--'} km/h</Text>
    </View>
    
    <View style={styles.item}>
      <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#4CAF50" />
      <Text style={styles.text}>{accuracy ? `${accuracy}m` : '--'}</Text>
    </View>
    
    <View style={styles.item}>
      <MaterialCommunityIcons name="image-filter-hdr" size={20} color="#2196F3" />
      <Text style={styles.text}>{elevation ? `${Math.round(elevation)}m` : '--'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    padding: 12,
    elevation: 3
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333'
  }
});
