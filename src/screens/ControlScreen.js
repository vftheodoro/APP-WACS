import React, { useState } from 'react';
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

const JOSTICK_SIZE = 300;
const STICK_SIZE = 120;
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

  const handleGestureEvent = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.offsetX = translateX.value;
      ctx.offsetY = translateY.value;
    },
    onActive: (event, ctx) => {
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
      backgroundColor: isLocked ? '#e57373' : '#2196f3',
    };
  });

  const handleSpeedSelect = (mode) => {
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
    const newState = !isLocked;
    setIsLocked(newState);

    Vibration.vibrate(VIBRATION_DURATION);

    console.log('Estado de bloqueio alterado para:', newState ? 'Travado' : 'Destravado');

  };

  return (
    <View style={styles.container}>
      <ControlHeader
        batteryPercentage={batteryPercentage}
        estimatedAutonomy={estimatedAutonomy}
        connectionQuality={connectionQuality}
      />

      <View style={styles.joystickBase}>
        <Pressable
          onLongPress={handleLockToggle}
          delayLongPress={500}
          style={styles.pressableStickArea}
          onPressIn={() => setIsPressingLock(true)}
          onPressOut={() => setIsPressingLock(false)}
        >
          <PanGestureHandler onGestureEvent={handleGestureEvent} enabled={!isLocked}>
            <Animated.View style={[styles.joystickStick, stickAnimatedStyle]}>
              {isPressingLock && (
                <Text style={styles.lockStatusText}>{isLocked ? '🔒' : '🔓'}</Text>
              )}
            </Animated.View>
          </PanGestureHandler>
        </Pressable>
      </View>

      <View style={styles.speedControls}>
        <Pressable
          onPress={() => handleSpeedSelect('lento')}
          style={[styles.speedButton, speedMode === 'lento' && styles.selectedButton]}
          disabled={isLocked}
        >
          <Text style={[styles.buttonText, isLocked && styles.disabledText]}>Lento</Text>
        </Pressable>
        <Pressable
          onPress={() => handleSpeedSelect('medio')}
          style={[styles.speedButton, speedMode === 'medio' && styles.selectedButton]}
          disabled={isLocked}
        >
          <Text style={[styles.buttonText, isLocked && styles.disabledText]}>Médio</Text>
        </Pressable>
        <Pressable
          onPress={() => handleSpeedSelect('rapido')}
          style={[styles.speedButton, speedMode === 'rapido' && styles.selectedButton]}
          disabled={isLocked}
        >
          <Text style={[styles.buttonText, isLocked && styles.disabledText]}>Rápido</Text>
        </Pressable>
        <Pressable
          onPress={() => handleSpeedSelect('manual')}
          style={[styles.speedButton, speedMode === 'manual' && styles.selectedButton]}
        >
          <Text style={styles.buttonText}>Manual</Text>
        </Pressable>
      </View>

      <Text style={styles.currentSpeedModeText}>Modo Atual: {speedMode.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  joystickBase: {
    width: JOSTICK_SIZE,
    height: JOSTICK_SIZE,
    borderRadius: JOSTICK_SIZE / 2,
    backgroundColor: '#bdbdbd',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#616161',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  joystickStick: {
    width: STICK_SIZE,
    height: STICK_SIZE,
    borderRadius: STICK_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0d47a1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pressableStickArea: {
    width: STICK_SIZE,
    height: STICK_SIZE,
    borderRadius: STICK_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockStatusText: {
    fontSize: 30,
  },
  speedControls: {
    flexDirection: 'row',
    marginTop: 20,
  },
  speedButton: {
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  selectedButton: {
    backgroundColor: '#2196f3',
  },
  buttonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#9e9e9e',
  },
  currentSpeedModeText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 