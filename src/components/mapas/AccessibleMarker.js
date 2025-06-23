import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

// Helper para determinar a cor do marcador com base na avaliação
const getMarkerStyle = (rating = 0) => {
  if (rating >= 4.0) {
    return {
      color: '#4CAF50', // Verde
      shadowColor: '#2E7D32',
    };
  }
  if (rating >= 2.5) {
    return {
      color: '#FFC107', // Amarelo
      shadowColor: '#FFA000',
    };
  }
  if (rating > 0) {
    return {
      color: '#F44336', // Vermelho
      shadowColor: '#D32F2F',
    };
  }
  return {
    color: '#9E9E9E', // Cinza
    shadowColor: '#616161',
  };
};

const AccessibleMarker = ({ location, isSelected }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const { color, shadowColor } = getMarkerStyle(location.rating);

  useEffect(() => {
    // Animação de entrada
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  useEffect(() => {
    // Animação de seleção
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.2 : 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [isSelected, scaleAnim]);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.bubble, { backgroundColor: color, shadowColor }]}>
        <FontAwesome5 name="universal-access" size={16} color="#fff" />
      </View>
      <View style={[styles.arrow, { borderTopColor: color }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF5A5F', // Cor padrão
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 12,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -4, // Sobrepõe um pouco para unir as formas
    alignSelf: 'center',
  },
});

export default AccessibleMarker; 