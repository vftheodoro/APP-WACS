import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const iconMap = {
  gas_station: 'fuel',
  restaurant: 'food',
  hospital: 'hospital',
  default: 'map-marker'
};

export const CustomMarker = ({ type }) => (
  <View style={styles.container}>
    <View style={styles.bubble}>
      <MaterialCommunityIcons 
        name={iconMap[type] || iconMap.default} 
        size={24} 
        color="white" 
      />
    </View>
    <View style={styles.arrow} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center'
  },
  bubble: {
    backgroundColor: '#6200EE',
    borderRadius: 20,
    padding: 10,
    elevation: 3
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#6200EE',
    transform: [{ rotate: '180deg' }]
  }
});
