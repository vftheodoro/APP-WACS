import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const VALID_MAP_TYPES = ['satellite', 'standard', 'hybrid'];
const VALID_LAYER_TYPES = ['traffic', 'transit', 'bicycling'];
const VALID_MODE_TYPES = ['driving', 'walking', 'bicycling'];

const MapControls = ({ 
  onStyleChange, 
  onLayerToggle,
  onModeChange,
  on3DToggle
}) => {
  const [expanded, setExpanded] = useState(false);
  const rotation = useState(new Animated.Value(0))[0];

  const toggleMenu = () => {
    Animated.spring(rotation, {
      toValue: expanded ? 0 : 1,
      useNativeDriver: true
    }).start();
    setExpanded(!expanded);
  };

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  });

  return (
    <View style={styles.container}>
      {expanded && (
        <View style={styles.menu}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => onStyleChange('satellite')}
            disabled={!VALID_MAP_TYPES.includes('satellite')}
          >
            <MaterialCommunityIcons name="satellite-variant" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => onLayerToggle('traffic')}
            disabled={!VALID_LAYER_TYPES.includes('traffic')}
          >
            <Ionicons name="car-sport" size={24} color="#FF5722" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => on3DToggle()}
          >
            <MaterialCommunityIcons name="cube-scan" size={24} color="#9C27B0" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => onModeChange('walking')}
            disabled={!VALID_MODE_TYPES.includes('walking')}
          >
            <Ionicons name="walk" size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>
      )}
      <Animated.View style={[styles.mainButton, { transform: [{ rotate }] }]}>
        <TouchableOpacity onPress={toggleMenu}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    alignItems: 'center'
  },
  mainButton: {
    backgroundColor: '#6200EE',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5
  },
  menu: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 10,
    marginBottom: 15,
    elevation: 3
  },
  button: {
    padding: 10,
    alignItems: 'center'
  }
});

export default MapControls;
