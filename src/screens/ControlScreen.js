import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedGestureHandler, 
  useAnimatedStyle, 
  useSharedValue,
  withSpring,
  runOnJS,
  useDerivedValue,
  interpolate,
  Extrapolate,
  useSharedValue as useRNSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBluetooth } from '../contexts/BluetoothContext';
import * as Haptics from 'expo-haptics';

const JOYSTICK_SIZE = 280;
const STICK_SIZE = 100;
const MAX_DISTANCE = (JOYSTICK_SIZE - STICK_SIZE) / 2;

export const ControlScreen = () => {
  // Estados principais - Usados para a UI do React, sincronizados com shared values quando necessário
  const [speedMode, setSpeedMode] = useState('manual');
  const [isLocked, setIsLocked] = useState(false);
  const [brakeReleased, setBrakeReleased] = useState(false);
  const currentSpeed = useSharedValue(0);
  const [isPressingLock, setIsPressingLock] = useState(false);

  // Refs - Usados para valores persistentes que não causam re-renderização
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const joystickRef = useRef(null);
  const longPressTimer = useRef(null);
  const speedUpdateTimer = useRef(null);
  const sessionStartTime = useRef(Date.now()); // Adicionado ref para o tempo de início da sessão

  // Shared values - Sincronizados com os estados regulares quando sua mudança precisa ser lida no worklet
  const isLockedShared = useSharedValue(false);
  const speedModeShared = useSharedValue('manual');
  const maxSpeedShared = useSharedValue(10);

  // Estado de exibição para maxSpeed, sincronizado para mostrar na UI regular
  const [displayMaxSpeed, setDisplayMaxSpeed] = useState(10);

  // Estado para exibir a velocidade do gauge sem acessar .value no render
  const [displaySpeed, setDisplaySpeed] = useState('0.0');
  useDerivedValue(() => {
    runOnJS(setDisplaySpeed)(currentSpeed.value.toFixed(1));
  }, [currentSpeed]);

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
  const route = useRoute();
  const mockMode = route.params?.mockMode === true;

  // Redireciona se não estiver conectado, exceto em modo simulado
  useEffect(() => {
    if (!mockMode && !isConnected && !isConnecting && !deviceInfo) {
      navigation.goBack();
    }
  }, [isConnected, isConnecting, deviceInfo, navigation, mockMode]);

  // Sincroniza shared values com estados regulares do React
  useEffect(() => {
    isLockedShared.value = isLocked;
  }, [isLocked]);

  useEffect(() => {
    speedModeShared.value = speedMode;
    const speedLimits = {
      'eco': 5, // 50% da potência
      'sport': 10,
      'manual': 10
    };
    maxSpeedShared.value = speedLimits[speedMode];
    runOnJS(setDisplayMaxSpeed)(speedLimits[speedMode]); // Sincroniza estado regular para exibição
  }, [speedMode, speedModeShared, maxSpeedShared]); // Adicionado shared values como dependência

  // Derived value para calcular a velocidade em tempo real e atualizar o shared value
  useDerivedValue(() => {
    const distance = Math.sqrt(translateX.value ** 2 + translateY.value ** 2);
    const normalizedDistance = distance / MAX_DISTANCE;
    currentSpeed.value = normalizedDistance * maxSpeedShared.value;
  });

  // Derived value para calcular o percentual da velocidade para o gauge
  const speedPercentage = useDerivedValue(() => {
    // Garante que a divisão não seja por zero e lida com valores negativos (embora improvável para velocidade)
    const maxSpd = maxSpeedShared.value > 0 ? maxSpeedShared.value : 1;
    const percentage = (currentSpeed.value / maxSpd) * 100;
    return interpolate(percentage, [0, 100], [0, 100], Extrapolate.CLAMP);
  });

  // Animated style para o preenchimento do gauge
  const speedGaugeFillStyle = useAnimatedStyle(() => {
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (speedPercentage.value / 100) * circumference;
    
    // Cor baseada no modo de velocidade
    let fillColor = '#10b981'; // eco default
    if (speedModeShared.value === 'comfort') {
      fillColor = '#3b82f6';
    } else if (speedModeShared.value === 'sport') {
      fillColor = '#ef4444';
    }

    return {
      strokeDashoffset,
      borderColor: fillColor, // Usando borderColor para o círculo parcial
    };
  });

  // Estados sincronizados com shared values para uso no JSX
  const [isLockedSharedState, setIsLockedSharedState] = useState(false);
  useDerivedValue(() => {
    runOnJS(setIsLockedSharedState)(isLockedShared.value);
  }, [isLockedShared]);

  const [scrollLocked, setScrollLocked] = useState(false);
  // Animação para overlay de scroll travado
  const scrollLockAnim = useRNSharedValue(0);
  useEffect(() => {
    scrollLockAnim.value = withTiming(scrollLocked ? 1 : 0, { duration: 350 });
  }, [scrollLocked]);
  const scrollLockOverlayStyle = useAnimatedStyle(() => ({
    opacity: scrollLockAnim.value,
    transform: [{ translateY: interpolate(scrollLockAnim.value, [0, 1], [40, 0]) }],
    pointerEvents: scrollLockAnim.value > 0.1 ? 'auto' : 'none',
  }));

  const handleGestureEvent = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      if (!(isConnected || mockMode) || isLockedSharedState || brakeReleased) {
        return;
      }
      ctx.offsetX = translateX.value;
      ctx.offsetY = translateY.value;
      // Travar scroll automaticamente ao iniciar joystick
      if (!scrollLocked) runOnJS(setScrollLocked)(true);
    },
    onActive: (event, ctx) => {
      if (!(isConnected || mockMode) || isLockedSharedState || brakeReleased) {
        return;
      }
      const newTranslateX = event.translationX + ctx.offsetX;
      const newTranslateY = event.translationY + ctx.offsetY;
      const distance = Math.sqrt(newTranslateX * newTranslateX + newTranslateY * newTranslateY);
      if (distance <= MAX_DISTANCE) {
        translateX.value = newTranslateX;
        translateY.value = newTranslateY;
      } else {
        const angle = Math.atan2(newTranslateY, newTranslateX);
        translateX.value = Math.cos(angle) * MAX_DISTANCE;
        translateY.value = Math.sin(angle) * MAX_DISTANCE;
      }
      const normalizedX = translateX.value / MAX_DISTANCE;
      const normalizedY = translateY.value / MAX_DISTANCE;
      const command = {
        type: 'move',
        mode: speedModeShared.value,
        x: normalizedX,
        y: normalizedY,
      };
      // TODO: Enviar comando real via Bluetooth para o HC-06 aqui, se conectado
      // Exemplo: bluetoothWrite(command)
    },
    onEnd: () => {
      if (!(isConnected || mockMode) || isLockedSharedState || brakeReleased) {
        return;
      }
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      currentSpeed.value = 0;
      const stopCommand = {
        type: 'stop',
        mode: speedModeShared.value,
      };
      // TODO: Enviar comando de parada real via Bluetooth para o HC-06 aqui
      // Exemplo: bluetoothWrite(stopCommand)
    },
  });

  const stickAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      backgroundColor: isLockedSharedState 
        ? '#ef5350' 
        : '#42a5f5',
      opacity: (isConnected || mockMode) ? 1 : 0.5,
    };
  });

  // Função auxiliar para formatar tempo (não precisa ser memoizada ou workletizada para este uso)
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSpeedModeChange = (mode) => {
    // Usar estados regulares do React para lógica UI/vibração
    if (!(isConnected || mockMode) || isLocked || brakeReleased) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSpeedMode(mode);
    // maxSpeedShared.value é atualizado no useEffect quando speedMode muda
  };

  const handleLockToggle = () => {
    // Usar estados regulares do React para lógica UI/vibração
    if (!(isConnected || mockMode) || brakeReleased) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const newState = !isLocked;
    setIsLocked(newState); // Atualiza o estado regular do React, que sincroniza o shared value via useEffect
    Haptics.impactAsync(newState ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);

    if (newState) {
      // Resetar joystick e velocidade no worklet
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      currentSpeed.value = 0; // Reseta o shared value
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Desconectar Cadeira",
      "Tem certeza que deseja desconectar a cadeira?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Desconectar",
          style: "destructive",
          onPress: () => {
            disconnectFromDevice();
            navigation.goBack();
          }
        }
      ]
    );
  };

  const renderSpeedGauge = () => {
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = circumference;
    return (
      <View style={styles.speedGaugeContainer}>
        <View style={styles.speedGauge}>
          <View style={styles.speedGaugeBackground} />
          <Animated.View style={[
            styles.speedGaugeFill,
            speedGaugeFillStyle,
            { 
              strokeDasharray: circumference,
            }
          ]} />
          <View style={styles.speedGaugeText}>
            <Text style={styles.speedGaugeValue}>{displaySpeed}</Text>
            <Text style={styles.speedGaugeUnit}>
              Potência: {Math.round((parseFloat(displaySpeed) / 10) * 100) || 0}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Definir cores dinâmicas conforme estado de bloqueio/freio
  const isBlocked = isLocked || brakeReleased;
  const headerColors = isBlocked ? ['#bdbdbd', '#f59e0b'] : ['#1976d2', '#2196f3'];
  const joystickBgColor = isBlocked ? '#f3f4f6' : '#fff';
  const joystickStickColor = isBlocked ? '#bdbdbd' : '#42a5f5';
  const mainContentBg = isBlocked ? '#fef3c7' : '#fff';

  // Feedback háptico ao travar/destravar scroll
  useEffect(() => {
    if (scrollLocked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [scrollLocked]);

  // Feedback ao destravar/travar freio
  useEffect(() => {
    if (brakeReleased) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [brakeReleased]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={headerColors}
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
          <Pressable
            style={styles.disconnectButton}
            onPress={handleDisconnect}
          >
            <Ionicons name="bluetooth-outline" size={24} color="#fff" />
          </Pressable>
        </View>
        {/* Aviso de modo simulado */}
        {mockMode && (
          <View style={{ backgroundColor: '#ff9800', padding: 8, borderRadius: 8, marginTop: 10, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Modo Simulado Ativo</Text>
          </View>
        )}
        <View style={styles.headerStatus}>
          <View style={styles.headerStatusItem}>
            <Ionicons
              name={batteryLevel > 20 ? 'battery-half-outline' : 'battery-dead-outline'}
              size={20}
              color={batteryLevel > 20 ? '#fff' : '#ff6b6b'}
            />
            <Text style={[
              styles.headerStatusText,
              batteryLevel <= 20 && styles.headerStatusTextWarning
            ]}>
              {batteryLevel}%
            </Text>
          </View>
          <View style={styles.headerStatusItem}>
            <Ionicons name="bluetooth-outline" size={20} color="#fff" />
            <Text style={styles.headerStatusText}>{connectionStrength}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollViewContent} scrollEnabled={!scrollLocked}>
        {!(isConnected || mockMode) ? (
          <View style={styles.disconnectedContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#f59e0b" />
            <Text style={styles.disconnectedText}>Cadeira de rodas não conectada</Text>
            <Pressable 
              style={styles.connectButton}
              onPress={() => navigation.navigate('ConnectionScreen')}
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
        ) :
          <View style={styles.mainContentArea}>
            {/* Fundo dinâmico para área principal */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: mainContentBg, zIndex: -1, borderRadius: 20 }} pointerEvents="none" />
            {/* Joystick Area */}
            <View style={[styles.joystickArea, { backgroundColor: joystickBgColor }]}>
              {/* Botão de Freio Eletromagnético */}
              <Pressable
                onPress={() => {
                  if (!brakeReleased) {
                    Alert.alert(
                      'Destravar Freios de Segurança',
                      'Os freios eletromagnéticos impedem que a cadeira se mova acidentalmente em rampas ou quando desligada. Tem certeza que deseja destravar os freios? A cadeira NÃO irá se mover enquanto os freios estiverem destravados.',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Destravar', style: 'destructive', onPress: () => setBrakeReleased(true) }
                      ]
                    );
                  } else {
                    setBrakeReleased(false);
                  }
                }}
                style={[
                  styles.emergencyButton,
                  brakeReleased && styles.emergencyButtonActive
                ]}
              >
                <Ionicons
                  name={brakeReleased ? "remove-circle" : "lock-closed"}
                  size={28}
                  color={brakeReleased ? "#fff" : "#1976d2"}
                />
              </Pressable>
              {brakeReleased && (
                <View style={{ marginTop: 8, backgroundColor: '#fff3cd', borderRadius: 8, padding: 8, alignItems: 'center' }}>
                  <Text style={{ color: '#b45309', fontWeight: 'bold', fontSize: 14 }}>
                    A cadeira não anda com os freios destravados.
                  </Text>
                </View>
              )}

              {/* Joystick */}
              <View style={styles.joystickContainer}>
                <View style={styles.joystickBase}>
                  <Pressable
                    onLongPress={handleLockToggle}
                    delayLongPress={500}
                    style={styles.pressableStickArea}
                    onPressIn={() => setIsPressingLock(true)}
                    onPressOut={() => setIsPressingLock(false)}
                  >
                    <PanGestureHandler 
                      onGestureEvent={handleGestureEvent}
                      enabled={!isLockedSharedState && (isConnected || mockMode) && !brakeReleased}
                    >
                      <Animated.View style={[styles.joystickStick, stickAnimatedStyle, { backgroundColor: joystickStickColor }]}>
                        {isPressingLock && (
                          <Text style={styles.lockStatusText}>
                            {isLocked ? '🔒' : '🔓'}
                          </Text>
                        )}
                      </Animated.View>
                    </PanGestureHandler>
                  </Pressable>
                </View>
                <Text style={styles.joystickInstruction}>
                  Mantenha pressionado para {isLocked ? 'destravar' : 'travar'}
                </Text>
              </View>

              {/* Speed Gauge */}
              {renderSpeedGauge()}
            </View>

            {/* Speed Modes */}
            <View style={styles.speedModesContainer}>
              <Text style={styles.sectionTitle}>Modos de Velocidade</Text>
              <View style={styles.speedModesGrid}>
                {[
                  { key: 'eco', label: 'Eco', icon: '🌱', desc: 'Máxima autonomia' },
                  { key: 'sport', label: 'Esporte', icon: '⚡', desc: 'Máxima performance' },
                  { key: 'manual', label: 'Manual', icon: '⚙️', desc: 'Controle total' }
                ].map(mode => (
                  <Pressable
                    key={mode.key}
                    onPress={() => handleSpeedModeChange(mode.key)}
                    disabled={!(isConnected || mockMode) || isLocked || brakeReleased}
                    style={[
                      styles.speedModeButton,
                      speedMode === mode.key && styles.speedModeButtonSelected,
                      (!(isConnected || mockMode) || isLocked || brakeReleased) && styles.speedModeButtonDisabled
                    ]}
                  >
                    <View style={styles.speedModeContent}>
                      <Text style={styles.speedModeIcon}>{mode.icon}</Text>
                      <View style={styles.speedModeTextContainer}>
                        <Text style={[
                          styles.speedModeLabel,
                          speedMode === mode.key && styles.speedModeLabelSelected
                        ]}>
                          {mode.label}
                        </Text>
                        <Text style={styles.speedModeDescription}>
                          {mode.desc}
                        </Text>
                      </View>
                    </View>
                    {speedMode === mode.key && (
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* System Status */}
            <View style={styles.systemStatusContainer}>
              <Text style={styles.sectionTitle}>Status do Sistema</Text>
              <View style={styles.statusCardModern}>
                <View style={styles.statusGridModern}>
                  <View style={styles.statusItemModern}>
                    <Ionicons name={isConnected ? 'bluetooth' : 'bluetooth-outline'} size={28} color={isConnected ? '#10b981' : '#ef4444'} style={styles.statusIconModern} />
                    <Text style={styles.statusLabelModern}>Conexão</Text>
                    <Text style={[
                      styles.statusValueModern,
                      (isConnected || mockMode) ? styles.statusValueActiveModern : styles.statusValueInactiveModern
                    ]}>
                      {isConnected ? 'Ativo' : 'Inativo'}
                    </Text>
                  </View>
                  <View style={styles.statusItemModern}>
                    <Ionicons name="speedometer-outline" size={28} color="#3b82f6" style={styles.statusIconModern} />
                    <Text style={styles.statusLabelModern}>Modo</Text>
                    <Text style={styles.statusValueModern}>
                      {speedMode.charAt(0).toUpperCase() + speedMode.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.statusItemModern}>
                    <Ionicons name={isLocked ? 'lock-closed' : 'lock-open'} size={28} color={isLocked ? '#f59e0b' : '#10b981'} style={styles.statusIconModern} />
                    <Text style={styles.statusLabelModern}>Segurança</Text>
                    <Text style={[
                      styles.statusValueModern,
                      isLocked ? styles.statusValueWarningModern : styles.statusValueActiveModern
                    ]}>
                      {isLocked ? 'Travado' : 'Liberado'}
                    </Text>
                  </View>
                  <View style={styles.statusItemModern}>
                    <Ionicons name={brakeReleased ? 'remove-circle' : 'lock-closed'} size={28} color={brakeReleased ? '#ef4444' : '#10b981'} style={styles.statusIconModern} />
                    <Text style={styles.statusLabelModern}>Freio</Text>
                    <Text style={[
                      styles.statusValueModern,
                      brakeReleased ? styles.statusValueWarningModern : styles.statusValueActiveModern
                    ]}>
                      {brakeReleased ? 'Destravado' : 'Travado'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        }
      </ScrollView>

      {/* Overlay animado indicando scroll travado */}
      <Animated.View pointerEvents="none" style={[styles.scrollLockOverlay, scrollLockOverlayStyle]}> 
        <View style={styles.scrollLockOverlayContent}>
          <Ionicons name="lock-closed" size={38} color="#1976d2" style={{ marginBottom: 8 }} />
          <Text style={styles.scrollLockOverlayText}>Scroll travado para evitar deslize acidental</Text>
        </View>
      </Animated.View>

      {/* Botão flutuante para travar/destravar o scroll */}
      <Pressable
        style={[styles.fabLockScroll, scrollLocked && styles.fabLockScrollActive]}
        onPress={() => setScrollLocked((prev) => !prev)}
        accessibilityLabel={scrollLocked ? 'Destravar scroll' : 'Travar scroll'}
      >
        <Ionicons
          name={scrollLocked ? 'lock-closed' : 'lock-open'}
          size={28}
          color={scrollLocked ? '#fff' : '#1976d2'}
        />
      </Pressable>
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
    paddingTop: 32,
    paddingBottom: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  disconnectButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerStatus: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  headerStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 5,
  },
  headerStatusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  headerStatusTextWarning: {
    color: '#ff6b6b',
  },
  mainContentArea: {
    gap: 16,
  },
  disconnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  disconnectedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    textAlign: 'center',
  },
  connectButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  connectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  joystickArea: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emergencyButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  emergencyButtonActive: {
    backgroundColor: '#ef4444',
  },
  joystickContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  joystickBase: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pressableStickArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joystickStick: {
    width: STICK_SIZE,
    height: STICK_SIZE,
    borderRadius: STICK_SIZE / 2,
    backgroundColor: '#42a5f5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  lockStatusText: {
    fontSize: 24,
  },
  joystickInstruction: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  speedGaugeContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  speedGauge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  speedGaugeBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#e5e7eb',
  },
  speedGaugeFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 8,
    transform: [{ rotate: '-90deg' }],
  },
  speedGaugeText: {
    alignItems: 'center',
  },
  speedGaugeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  speedGaugeUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  speedModesContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  speedModesGrid: {
    gap: 12,
  },
  speedModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  speedModeButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  speedModeButtonDisabled: {
    opacity: 0.5,
  },
  speedModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  speedModeIcon: {
    fontSize: 24,
  },
  speedModeTextContainer: {
    gap: 2,
  },
  speedModeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  speedModeLabelSelected: {
    color: '#3b82f6',
  },
  speedModeDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  systemStatusContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusCardModern: {
    backgroundColor: '#f9fafb',
    borderRadius: 18,
    padding: 18,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
  },
  statusGridModern: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  statusItemModern: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#e0e7ef',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    marginHorizontal: 4,
  },
  statusIconModern: {
    marginBottom: 6,
  },
  statusLabelModern: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  statusValueModern: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statusValueActiveModern: {
    color: '#10b981',
  },
  statusValueInactiveModern: {
    color: '#ef4444',
  },
  statusValueWarningModern: {
    color: '#f59e0b',
  },
  fabLockScroll: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#1976d2',
    zIndex: 10,
  },
  fabLockScrollActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  scrollLockOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 100,
    alignItems: 'center',
    zIndex: 20,
  },
  scrollLockOverlayContent: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollLockOverlayText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 220,
  },
}); 