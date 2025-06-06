import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Vibration,
  ScrollView,
} from 'react-native';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBluetooth } from '../contexts/BluetoothContext';

const JOSTICK_SIZE = 280;
const STICK_SIZE = 100;
const VIBRATION_DURATION = 50;

export const ControlScreen = () => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [speedMode, setSpeedMode] = useState('manual');
  const [isLocked, setIsLocked] = useState(false);
  const [isPressingLock, setIsPressingLock] = useState(false);

  const { 
    isConnected,
    isConnecting,
    deviceInfo,
    batteryLevel,
    connectionStrength,
    estimatedAutonomy,
    disconnectFromDevice,
  } = useBluetooth();

  const navigation = useNavigation();

  useEffect(() => {
    if (!isConnected && !isConnecting && !deviceInfo) {
      navigation.goBack();
    }
  }, [isConnected, isConnecting, deviceInfo]);

  const handleGestureEvent = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      if (!isConnected) return;
      ctx.offsetX = translateX.value;
      ctx.offsetY = translateY.value;
    },
    onActive: (event, ctx) => {
      if (!isConnected) return;
      const newTranslateX = event.translationX + ctx.offsetX;
      const newTranslateY = event.translationY + ctx.offsetY;

      const distance = Math.sqrt(newTranslateX * newTranslateX + newTranslateY * newTranslateY);

      if (distance <= (JOSTICK_SIZE - STICK_SIZE) / 2) {
        translateX.value = newTranslateX;
        translateY.value = newTranslateY;
      } else {
        const angle = Math.atan2(newTranslateY, newTranslateX);
        translateX.value = Math.cos(angle) * ((JOSTICK_SIZE - STICK_SIZE) / 2);
        translateY.value = Math.sin(angle) * ((JOSTICK_SIZE - STICK_SIZE) / 2);
      }

      const normalizedX = translateX.value / ((JOSTICK_SIZE - STICK_SIZE) / 2);
      const normalizedY = translateY.value / ((JOSTICK_SIZE - STICK_SIZE) / 2);

      const command = {
        type: 'move',
        mode: speedMode,
        x: normalizedX,
        y: normalizedY,
      };
      console.log('Enviando comando:', command);

    },
    onEnd: () => {
      if (!isConnected) return;
      translateX.value = 0;
      translateY.value = 0;

      const stopCommand = {
        type: 'stop',
        mode: speedMode,
      };
      console.log('Enviando comando:', stopCommand);

    },
  });

  const stickAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      backgroundColor: isLocked ? '#ef5350' : '#42a5f5',
      opacity: isConnected ? 1 : 0.5,
    };
  });

  const handleSpeedSelect = (mode) => {
    if (!isConnected || isLocked) {
      Vibration.vibrate(VIBRATION_DURATION);
      return;
    }
    setSpeedMode(mode);
    const speedModeCommand = {
      type: 'set_speed_mode',
      mode: mode,
    };
    console.log('Enviando comando:', speedModeCommand);

  };

  const handleLockToggle = () => {
    if (!isConnected) {
      Vibration.vibrate(VIBRATION_DURATION);
      return;
    }
    const newState = !isLocked;
    setIsLocked(newState);

    Vibration.vibrate(VIBRATION_DURATION);

    console.log('Estado de bloqueio alterado para:', newState ? 'Travado' : 'Destravado');

  };

  const handleBluetoothPress = () => {
    navigation.navigate('ConnectionScreen');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#1976d2', '#2196f3']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Controle {deviceInfo?.name ? `(${deviceInfo.name})` : 'da Cadeira'}</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
        <View style={styles.headerStatus}>
          <View style={styles.headerStatusItem}>
            <Ionicons name="battery-half-outline" size={20} color="#fff" />
            <Text style={styles.headerStatusText}>{batteryLevel}%</Text>
          </View>
          <View style={styles.headerStatusItem}>
            <Ionicons name="time-outline" size={20} color="#fff" />
            <Text style={styles.headerStatusText}>{estimatedAutonomy}</Text>
          </View>
          <View style={styles.headerStatusItem}>
            <Ionicons name="bluetooth-outline" size={20} color="#fff" />
            <Text style={styles.headerStatusText}>{connectionStrength}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>

        {!isConnected ? (
          <View style={styles.disconnectedContainer}>
            <Text style={styles.disconnectedText}>Cadeira de rodas não conectada.</Text>
            <Pressable 
              style={styles.connectButton}
              onPress={handleBluetoothPress}
            >
              <LinearGradient
                colors={['#1976d2', '#2196f3']}
                style={styles.connectButtonGradient}
              >
                <Ionicons name="bluetooth-outline" size={20} color="#fff" />
                <Text style={styles.connectButtonText}>Conectar Cadeira</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View style={styles.mainContentArea}>
              <View style={styles.joystickContainer}>
                <View style={styles.joystickBase}>
                  <Pressable
                    onLongPress={handleLockToggle}
                    delayLongPress={500}
                    style={styles.pressableStickArea}
                    onPressIn={() => setIsPressingLock(true)}
                    onPressOut={() => setIsPressingLock(false)}
                  >
                    <PanGestureHandler onGestureEvent={handleGestureEvent} enabled={!isLocked && isConnected}>
                      <Animated.View style={[styles.joystickStick, stickAnimatedStyle]}>
                        {isPressingLock && (
                          <Text style={styles.lockStatusText}>{isLocked ? '🔒' : '🔓'}</Text>
                        )}
                      </Animated.View>
                    </PanGestureHandler>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.currentSpeedModeText}>Modo Atual: {speedMode.toUpperCase()}</Text>
            </View>
        )}

        <View style={[styles.speedControls, !isConnected && styles.speedControlsDisabled]}>
          <Pressable
            onPress={() => handleSpeedSelect('lento')}
            style={[styles.speedButton, speedMode === 'lento' && styles.selectedButton]}
            disabled={!isConnected || isLocked}
          >
            <Text style={[styles.buttonText, (!isConnected || isLocked) && styles.disabledText]}>Lento</Text>
          </Pressable>
          <Pressable
            onPress={() => handleSpeedSelect('medio')}
            style={[styles.speedButton, speedMode === 'medio' && styles.selectedButton]}
            disabled={!isConnected || isLocked}
          >
            <Text style={[styles.buttonText, (!isConnected || isLocked) && styles.disabledText]}>Médio</Text>
          </Pressable>
          <Pressable
            onPress={() => handleSpeedSelect('rapido')}
            style={[styles.speedButton, speedMode === 'rapido' && styles.selectedButton]}
            disabled={!isConnected || isLocked}
          >
            <Text style={[styles.buttonText, (!isConnected || isLocked) && styles.disabledText]}>Rápido</Text>
          </Pressable>
          <Pressable
            onPress={() => handleSpeedSelect('manual')}
            style={[styles.speedButton, speedMode === 'manual' && styles.selectedButton]}
            disabled={!isConnected}
          >
            <Text style={[styles.buttonText, !isConnected && styles.disabledText]}>Manual</Text>
          </Pressable>
        </View>

      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRightPlaceholder: {
    width: 44,
  },
  headerStatus: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingBottom: 10,
  },
  headerStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerStatusText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  mainContentArea: {
    paddingVertical: 20,
    width: '100%',
  },
  disconnectedContainer: {
    padding: 20,
    width: '100%',
  },
  disconnectedText: {
    fontSize: 18,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  connectButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 20,
    width: '100%',
  },
  connectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 25,
    gap: 8,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  joystickContainer: {
    marginBottom: 30,
    alignSelf: 'center',
  },
  joystickBase: {
    width: JOSTICK_SIZE,
    height: JOSTICK_SIZE,
    borderRadius: JOSTICK_SIZE / 2,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d0d0d0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4.0,
    elevation: 6,
  },
  joystickStick: {
    width: STICK_SIZE,
    height: STICK_SIZE,
    borderRadius: STICK_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressableStickArea: {
    width: JOSTICK_SIZE,
    height: JOSTICK_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockStatusText: {
    fontSize: 30,
  },
  currentSpeedModeText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginTop: 10,
    alignSelf: 'center',
  },
  speedControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 5,
    gap: 10,
    width: '100%',
  },
  speedControlsDisabled: {
    opacity: 0.5,
  },
  speedButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedButton: {
    backgroundColor: '#1976d2',
    shadowOpacity: 0.2,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  disabledText: {
    color: '#999',
  },
}); 