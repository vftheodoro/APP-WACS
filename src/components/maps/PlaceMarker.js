import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const PlaceMarker = ({
  place,
  isSelected = false,
  isUserLocation = false,
  isDestination = false,
  isPrimaryDestination = false,
  onPress
}) => {
  const { isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Efeito de "pulsar" quando o marcador é selecionado
  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Resetar animação
      scaleAnim.setValue(1);
    }
  }, [isSelected]);
  
  // Mostrar um marcador diferente para a localização do usuário
  if (isUserLocation) {
    return (
      <Marker
        coordinate={{
          latitude: place.latitude,
          longitude: place.longitude
        }}
        title="Sua localização"
        description="Você está aqui"
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={styles.userLocationContainer}>
          <View style={styles.userLocationDot} />
          <View style={styles.userLocationRing} />
        </View>
      </Marker>
    );
  }
  
  // Determinar a cor e ícone baseado no tipo de marcador
  const getMarkerColor = () => {
    if (isPrimaryDestination) return '#FF3B30'; // vermelho para destino principal
    if (isDestination) return '#FF9500';        // laranja para destinos
    if (isSelected) return '#007AFF';           // azul para selecionado
    return '#34C759';                          // verde para lugares normais
  };
  
  const getMarkerIcon = () => {
    if (isPrimaryDestination) return 'place';
    if (isDestination) return 'location-on';
    
    // Escolher ícone baseado no tipo do lugar, se disponível
    if (place.types) {
      if (place.types.includes('restaurant')) return 'restaurant';
      if (place.types.includes('cafe')) return 'local-cafe';
      if (place.types.includes('store') || place.types.includes('shopping_mall')) return 'shopping-cart';
      if (place.types.includes('lodging') || place.types.includes('hotel')) return 'hotel';
      if (place.types.includes('bar')) return 'local-bar';
      if (place.types.includes('pharmacy')) return 'local-pharmacy';
      if (place.types.includes('hospital')) return 'local-hospital';
      if (place.types.includes('park')) return 'park';
      if (place.types.includes('museum')) return 'museum';
      if (place.types.includes('gas_station')) return 'local-gas-station';
    }
    
    return 'location-on';
  };
  
  const markerColor = getMarkerColor();
  const markerIcon = getMarkerIcon();
  
  // Coordenadas do lugar (pode receber diferentes formatos)
  const coordinates = {
    latitude: place.geometry ? place.geometry.location.lat : place.latitude,
    longitude: place.geometry ? place.geometry.location.lng : place.longitude
  };
  
  return (
    <Marker
      coordinate={coordinates}
      title={place.name}
      description={place.vicinity || place.formatted_address}
      onPress={() => onPress && onPress(place)}
      tracksViewChanges={false}
    >
      <Animated.View style={[
        styles.markerContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <MaterialIcons name={markerIcon} size={26} color={markerColor} />
        {isSelected && (
          <View style={[styles.markerShadow, { backgroundColor: markerColor }]} />
        )}
      </Animated.View>
      
      <Callout tooltip>
        <View style={[
          styles.calloutContainer,
          isDark ? styles.calloutContainerDark : null
        ]}>
          <Text style={[
            styles.calloutTitle,
            isDark ? styles.calloutTitleDark : null
          ]}>
            {place.name}
          </Text>
          
          <Text style={[
            styles.calloutDescription,
            isDark ? styles.calloutDescriptionDark : null
          ]}>
            {place.vicinity || place.formatted_address || ''}
          </Text>
          
          {place.rating && (
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((i) => (
                <FontAwesome5 
                  key={i}
                  name="star" 
                  solid={i <= Math.floor(place.rating)}
                  size={12} 
                  color={i <= Math.floor(place.rating) ? '#FFD700' : '#C4C4C4'} 
                  style={{ marginRight: 2 }}
                />
              ))}
              <Text style={styles.ratingText}>
                {place.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
  },
  markerShadow: {
    position: 'absolute',
    bottom: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.3,
  },
  calloutContainer: {
    width: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  calloutContainerDark: {
    backgroundColor: '#333',
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  calloutTitleDark: {
    color: '#fff',
  },
  calloutDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  calloutDescriptionDark: {
    color: '#ccc',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  userLocationContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: 'white',
  },
  userLocationRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
});

export default PlaceMarker; 