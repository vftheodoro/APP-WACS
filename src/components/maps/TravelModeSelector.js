import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TravelModeSelector = ({ selectedMode, onSelectMode }) => {
  const modes = [
    { id: 'driving', icon: 'car', label: 'Carro' },
    { id: 'walking', icon: 'walk', label: 'A pé' },
    { id: 'bicycling', icon: 'bicycle', label: 'Bicicleta' },
  ];

  return (
    <View style={styles.container}>
      {modes.map((mode) => (
        <TouchableOpacity
          key={mode.id}
          style={[
            styles.modeButton,
            selectedMode === mode.id && styles.selectedMode,
          ]}
          onPress={() => onSelectMode(mode.id)}
        >
          <Ionicons
            name={mode.icon}
            size={24}
            color={selectedMode === mode.id ? '#fff' : '#666'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 20,
  },
  selectedMode: {
    backgroundColor: '#2196F3',
  },
});

export default TravelModeSelector; 