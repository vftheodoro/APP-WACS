import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const MapScreen = () => {
  const { isDark } = useTheme();
  
  return (
    <View style={[
      styles.container,
      isDark ? styles.containerDark : null
    ]}>
      <Text style={[
        styles.text,
        isDark ? styles.textDark : null
      ]}>
        Área do mapa em desenvolvimento
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  text: {
    fontSize: 18,
    color: '#333333',
  },
  textDark: {
    color: '#ffffff',
  }
});

export default MapScreen; 