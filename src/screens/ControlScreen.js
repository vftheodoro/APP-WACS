import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Vibration,
} from 'react-native';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, } from 'react-native-reanimated';
import ControlHeader from '../components/common/ControlHeader';
import { useNavigation } from '@react-navigation/native';

const JOSTICK_SIZE = 280;
const STICK_SIZE = 100;
const VIBRATION_DURATION = 50;

export const ControlScreen = () => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [speedMode, setSpeedMode] = useState('manual');
  const [isLocked, setIsLocked] = useState(false);
  const [isPressingLock, setIsPressingLock] = useState(false);

  const [batteryPercentage, setBatteryPercentage] = useState(0);
  const [estimatedAutonomy, setEstimatedAutonomy] = useState('--');
  const [connectionQuality, setConnectionQuality] = useState('Desconectado');
  const [isConnected, setIsConnected] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    setIsConnected(false);
  }, []);

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
    if (!isConnected) {
      Vibration.vibrate(VIBRATION_DURATION);
      return;
    }
    if (isLocked) {
      console.log('Controles travados. Não é possível mudar o modo de velocidade.');
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
      <View style={styles.container}>
        <ControlHeader
          batteryPercentage={batteryPercentage}
          estimatedAutonomy={estimatedAutonomy}
          connectionQuality={connectionQuality}
        />

        {!isConnected ? (
          <View style={styles.disconnectedContainer}>
            <Text style={styles.disconnectedText}>Cadeira de rodas não conectada.</Text>
            <Pressable style={styles.connectButton} onPress={handleBluetoothPress}>
              <Text style={styles.connectButtonText}>Conectar via Bluetooth</Text>
            </Pressable>
          </View>
        ) : (
          <>
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

            <View style={styles.speedControls}>
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
          </>
        )}

      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingTop: 20,
  },
  mainContentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disconnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disconnectedText: {
    fontSize: 18,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  connectButton: {
    backgroundColor: '#1e88e5',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    elevation: 3,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  joystickContainer: {
    marginBottom: 30,
  },
  joystickBase: {
    width: JOSTICK_SIZE,
    height: JOSTICK_SIZE,
    borderRadius: JOSTICK_SIZE / 2,
    backgroundColor: '#616161',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#424242',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8.0,
    elevation: 15,
  },
  joystickStick: {
    width: STICK_SIZE,
    height: STICK_SIZE,
    borderRadius: STICK_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1565c0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4.0,
    elevation: 6,
  },
  pressableStickArea: {
    width: STICK_SIZE,
    height: STICK_SIZE,
    borderRadius: STICK_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockStatusText: {
    fontSize: 36,
  },
  speedControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  speedButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
    elevation: 2,
  },
  selectedButton: {
    backgroundColor: '#1e88e5',
    borderColor: '#1e88e5',
    elevation: 4,
  },
  buttonText: {
    color: '#424242',
    fontWeight: '600',
    fontSize: 13,
  },
  disabledText: {
    color: '#b0b0b0',
  },
  currentSpeedModeText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
}); 