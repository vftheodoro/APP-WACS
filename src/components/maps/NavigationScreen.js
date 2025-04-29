import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const NavigationScreen = ({
  routeData,
  currentLocation,
  nextManeuver,
  distanceToNext,
  travelMode,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getManeuverIcon = (maneuver) => {
    switch (maneuver) {
      case 'turn-left':
        return 'arrow-back';
      case 'turn-right':
        return 'arrow-forward';
      case 'turn-slight-left':
        return 'arrow-back';
      case 'turn-slight-right':
        return 'arrow-forward';
      case 'turn-sharp-left':
        return 'arrow-back';
      case 'turn-sharp-right':
        return 'arrow-forward';
      case 'uturn-left':
        return 'return-up-back';
      case 'uturn-right':
        return 'return-up-forward';
      case 'straight':
        return 'arrow-up';
      case 'ramp-left':
        return 'arrow-back';
      case 'ramp-right':
        return 'arrow-forward';
      case 'merge':
        return 'git-merge';
      case 'fork-left':
        return 'git-branch';
      case 'fork-right':
        return 'git-branch';
      case 'ferry':
        return 'boat';
      case 'ferry-train':
        return 'train';
      default:
        return 'arrow-up';
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {routeData && (
          <Polyline
            coordinates={routeData.overview_polyline.points.map(point => ({
              latitude: point.lat,
              longitude: point.lng,
            }))}
            strokeWidth={4}
            strokeColor="#2196F3"
          />
        )}
      </MapView>

      <View style={[styles.navigationInfo, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.distanceText}>
            {formatDistance(distanceToNext)}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.maneuverContainer}>
          <Ionicons
            name={getManeuverIcon(nextManeuver)}
            size={48}
            color="white"
          />
          <Text style={styles.maneuverText}>
            {nextManeuver.replace(/-/g, ' ')}
          </Text>
        </View>

        <View style={styles.travelModeContainer}>
          <Ionicons
            name={
              travelMode === 'driving'
                ? 'car'
                : travelMode === 'walking'
                ? 'walk'
                : 'bicycle'
            }
            size={24}
            color="white"
          />
          <Text style={styles.travelModeText}>
            {travelMode.charAt(0).toUpperCase() + travelMode.slice(1)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  navigationInfo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  distanceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maneuverContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  maneuverText: {
    fontSize: 18,
    color: 'white',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  travelModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  travelModeText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 8,
  },
});

export default NavigationScreen; 