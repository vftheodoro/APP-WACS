import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Vibration,
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
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBluetooth } from '../contexts/BluetoothContext';

const JOYSTICK_SIZE = 280;
const STICK_SIZE = 100;
const MAX_DISTANCE = (JOYSTICK_SIZE - STICK_SIZE) / 2;
const VIBRATION_DURATION = 50;

export const ControlScreen = () => {
  // Estados principais - Usados para a UI do React, sincronizados com shared values quando necessário
  const [speedMode, setSpeedMode] = useState('manual');
  const [isLocked, setIsLocked] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const currentSpeed = useSharedValue(0);
  const [isPressingLock, setIsPressingLock] = useState(false);

  // Estados de telemetria - Usados para a UI do React
  const [telemetry, setTelemetry] = useState({
    totalDistance: '0 km',
    sessionTime: '00:00:00',
    avgSpeed: '0 km/h',
    temperature: '--°C'
  });

  // Refs - Usados para valores persistentes que não causam re-renderização
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const joystickRef = useRef(null);
  const longPressTimer = useRef(null);
  const speedUpdateTimer = useRef(null);
  const sessionStartTime = useRef(Date.now()); // Adicionado ref para o tempo de início da sessão

  // Shared values - Sincronizados com os estados regulares quando sua mudança precisa ser lida no worklet
  const isLockedShared = useSharedValue(false);
  const emergencyModeShared = useSharedValue(false);
  const speedModeShared = useSharedValue('manual');
  const maxSpeedShared = useSharedValue(8);

  // Estado de exibição para maxSpeed, sincronizado para mostrar na UI regular
  const [displayMaxSpeed, setDisplayMaxSpeed] = useState(8);

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

  // Redireciona se não estiver conectado
  useEffect(() => {
    if (!isConnected && !isConnecting && !deviceInfo) {
      navigation.goBack();
    }
  }, [isConnected, isConnecting, deviceInfo, navigation]); // Adicionado navigation como dependência

  // Sincroniza shared values com estados regulares do React
  useEffect(() => {
    isLockedShared.value = isLocked;
  }, [isLocked]);

  useEffect(() => {
    emergencyModeShared.value = emergencyMode;
  }, [emergencyMode]);

  useEffect(() => {
    speedModeShared.value = speedMode;
    const speedLimits = {
      'eco': 3,
      'comfort': 5,
      'sport': 8,
      'manual': 8
    };
    maxSpeedShared.value = speedLimits[speedMode];
    runOnJS(setDisplayMaxSpeed)(speedLimits[speedMode]); // Sincroniza estado regular para exibição
  }, [speedMode, speedModeShared, maxSpeedShared]); // Adicionado shared values como dependência

  // Simulação de dados em tempo real
  useEffect(() => {
    if (isConnected) {
      sessionStartTime.current = Date.now(); // Reinicia o tempo ao conectar
      const interval = setInterval(() => {
        // Atualizar telemetria simulada
        setTelemetry(prev => ({
          ...prev,
          sessionTime: formatTime(Date.now() - sessionStartTime.current), // Usar .current do ref
          avgSpeed: `${(Math.random() * 2 + 3).toFixed(1)} km/h`,
          temperature: `${Math.floor(Math.random() * 5 + 20)}°C`
        }));

        // Atualizar velocidade baseada no joystick - A velocidade é atualizada no useDerivedValue
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isConnected, formatTime]); // Adicionado formatTime como dependência

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

  const handleGestureEvent = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      // A lógica de habilitação/desabilitação agora depende dos shared values
      if (!isConnected || isLockedShared.value || emergencyModeShared.value) {
        // O retorno antecipado aqui impede o início do gesto se desabilitado
        return;
      }
      ctx.offsetX = translateX.value;
      ctx.offsetY = translateY.value;
    },
    onActive: (event, ctx) => {
      // A lógica de habilitação/desabilitação agora depende dos shared values
      if (!isConnected || isLockedShared.value || emergencyModeShared.value) {
        // O retorno antecipado aqui impede o movimento do joystick se desabilitado
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
      // Em um cenário real, você enviaria o comando Bluetooth aqui
    },
    onEnd: () => {
      // A lógica de habilitação/desabilitação agora depende dos shared values
      if (!isConnected || isLockedShared.value || emergencyModeShared.value) {
        // O retorno antecipado aqui impede o reset do joystick se desabilitado
        return;
      }
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);

      currentSpeed.value = 0; // Reseta o shared value da velocidade

      const stopCommand = {
        type: 'stop',
        mode: speedModeShared.value,
      };
      // Em um cenário real, você enviaria o comando Bluetooth de parada aqui
    },
  });

  const stickAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      backgroundColor: isLockedShared.value 
        ? '#ef5350' 
        : emergencyModeShared.value 
          ? '#ffa726' 
          : '#42a5f5',
      opacity: isConnected ? 1 : 0.5,
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
    if (!isConnected || isLocked || emergencyMode) {
      Vibration.vibrate(VIBRATION_DURATION);
      return;
    }
    setSpeedMode(mode);
    // maxSpeedShared.value é atualizado no useEffect quando speedMode muda
  };

  const handleLockToggle = () => {
    // Usar estados regulares do React para lógica UI/vibração
    if (!isConnected || emergencyMode) {
      Vibration.vibrate(VIBRATION_DURATION);
      return;
    }
    const newState = !isLocked;
    setIsLocked(newState); // Atualiza o estado regular do React, que sincroniza o shared value via useEffect
    Vibration.vibrate(VIBRATION_DURATION);

    if (newState) {
      // Resetar joystick e velocidade no worklet
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      currentSpeed.value = 0; // Reseta o shared value
    }
  };

  const toggleEmergencyMode = () => {
    if (!isConnected) {
      Vibration.vibrate(VIBRATION_DURATION);
      return;
    }

    Alert.alert(
      "Modo de Emergência",
      emergencyMode 
        ? "Deseja desativar o modo de emergência?" 
        : "ATENÇÃO: O modo de emergência irá limitar a velocidade e desativar o travamento. Deseja continuar?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: emergencyMode ? "Desativar" : "Ativar",
          style: "destructive",
          onPress: () => {
            const newState = !emergencyMode;
            setEmergencyMode(newState); // Atualiza o estado regular
            if (!newState) { // Se estiver desativando
              setIsLocked(false); // Destrava
              setSpeedMode('manual');
              maxSpeedShared.value = 8;
              // Resetar joystick e velocidade no worklet
              translateX.value = withSpring(0);
              translateY.value = withSpring(0);
              currentSpeed.value = 0;
            }
          }
        }
      ]
    );
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
            <Animated.Text style={styles.speedGaugeValue}>{currentSpeed.value.toFixed(1)}</Animated.Text>
            <Text style={styles.speedGaugeUnit}>km/h</Text>
          </View>
        </View>
      </View>
    );
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
          <Pressable
            style={styles.disconnectButton}
            onPress={handleDisconnect}
          >
            <Ionicons name="bluetooth-outline" size={24} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.headerStatus}>
          <View style={styles.headerStatusItem}>
            <Ionicons 
              name={batteryLevel > 20 ? "battery-half-outline" : "battery-alert-outline"} 
              size={20} 
              color={batteryLevel > 20 ? "#fff" : "#ff6b6b"} 
            />
            <Text style={[
              styles.headerStatusText,
              batteryLevel <= 20 && styles.headerStatusTextWarning
            ]}>
              {batteryLevel}%
            </Text>
          </View>
          <View style={styles.headerStatusItem}>
            <Ionicons name="time-outline" size={20} color="#fff" />
            <Text style={styles.headerStatusText}>{estimatedAutonomy}</Text>
          </View>
          <View style={styles.headerStatusItem}>
            <Ionicons name="bluetooth-outline" size={20} color="#fff" />
            <Text style={styles.headerStatusText}>{connectionStrength}</Text>
          </View>
          <View style={styles.headerStatusItem}>
            <Ionicons name="speedometer-outline" size={20} color="#fff" />
            <Text style={styles.headerStatusText}>{displayMaxSpeed} km/h</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {!isConnected ? (
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
        ) : (
          <View style={styles.mainContentArea}>
            {/* Status Cards */}
            <View style={styles.statusCardsContainer}>
              <View style={[styles.statusCard, styles.statusCardPurple]}>
                <View style={styles.statusCardContent}>
                  <View>
                    <Text style={styles.statusCardLabel}>Tempo Sessão</Text>
                    <Text style={styles.statusCardValue}>{telemetry.sessionTime}</Text>
                  </View>
                  <Ionicons name="time-outline" size={32} color="#fff" style={styles.statusCardIcon} />
                </View>
              </View>
              
              <View style={[styles.statusCard, styles.statusCardOrange]}>
                <View style={styles.statusCardContent}>
                  <View>
                    <Text style={styles.statusCardLabel}>Velocidade Média</Text>
                    <Text style={styles.statusCardValue}>{telemetry.avgSpeed}</Text>
                  </View>
                  <Ionicons name="speedometer-outline" size={32} color="#fff" style={styles.statusCardIcon} />
                </View>
              </View>
            </View>

            {/* Joystick Area */}
            <View style={styles.joystickArea}>
              {/* Emergency Button */}
              <Pressable
                onPress={toggleEmergencyMode}
                style={[
                  styles.emergencyButton,
                  emergencyMode && styles.emergencyButtonActive
                ]}
              >
                <Ionicons 
                  name="power" 
                  size={24} 
                  color={emergencyMode ? "#fff" : "#ef4444"}
                />
              </Pressable>

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
                      enabled={!isLockedShared.value && isConnected && !emergencyModeShared.value}
                    >
                      <Animated.View style={[styles.joystickStick, stickAnimatedStyle]}>
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
                  { key: 'comfort', label: 'Conforto', icon: '🛋️', desc: 'Equilíbrio ideal' },
                  { key: 'sport', label: 'Esporte', icon: '⚡', desc: 'Máxima performance' },
                  { key: 'manual', label: 'Manual', icon: '⚙️', desc: 'Controle total' }
                ].map(mode => (
                  <Pressable
                    key={mode.key}
                    onPress={() => handleSpeedModeChange(mode.key)}
                    disabled={!isConnected || isLocked || emergencyMode}
                    style={[
                      styles.speedModeButton,
                      speedMode === mode.key && styles.speedModeButtonSelected,
                      (!isConnected || isLocked || emergencyMode) && styles.speedModeButtonDisabled
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

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.sectionTitle}>Ações Rápidas</Text>
              <View style={styles.quickActionsGrid}>
                <Pressable
                  onPress={handleLockToggle}
                  disabled={!isConnected || emergencyMode}
                  style={[
                    styles.quickActionButton,
                    isLocked && styles.quickActionButtonActive,
                    (!isConnected || emergencyMode) && styles.quickActionButtonDisabled
                  ]}
                >
                  <Ionicons 
                    name={isLocked ? "lock-closed" : "lock-open"} 
                    size={24} 
                    color={isLocked ? "#ef4444" : "#6b7280"}
                  />
                  <Text style={styles.quickActionLabel}>
                    {isLocked ? 'Destrav.' : 'Travar'}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={!isConnected || emergencyMode}
                  style={[
                    styles.quickActionButton,
                    (!isConnected || emergencyMode) && styles.quickActionButtonDisabled
                  ]}
                >
                  <Ionicons name="settings-outline" size={24} color="#6b7280" />
                  <Text style={styles.quickActionLabel}>Config.</Text>
                </Pressable>

                <Pressable
                  onPress={toggleEmergencyMode}
                  disabled={!isConnected}
                  style={[
                    styles.quickActionButton,
                    emergencyMode && styles.quickActionButtonEmergency,
                    !isConnected && styles.quickActionButtonDisabled
                  ]}
                >
                  <Ionicons 
                    name="flash" 
                    size={24} 
                    color={emergencyMode ? "#fff" : "#f97316"}
                  />
                  <Text style={[
                    styles.quickActionLabel,
                    emergencyMode && styles.quickActionLabelEmergency
                  ]}>
                    Emerg.
                  </Text>
                </Pressable>

                <Pressable
                  disabled={!isConnected || emergencyMode}
                  style={[
                    styles.quickActionButton,
                    (!isConnected || emergencyMode) && styles.quickActionButtonDisabled
                  ]}
                >
                  <Ionicons name="stats-chart-outline" size={24} color="#6b7280" />
                  <Text style={styles.quickActionLabel}>Status</Text>
                </Pressable>
              </View>
            </View>

            {/* System Status */}
            <View style={styles.systemStatusContainer}>
              <Text style={styles.sectionTitle}>Status do Sistema</Text>
              <View style={styles.systemStatusGrid}>
                <View style={styles.systemStatusItem}>
                  <Text style={styles.systemStatusLabel}>Conexão</Text>
                  <Text style={[
                    styles.systemStatusValue,
                    isConnected ? styles.systemStatusValueActive : styles.systemStatusValueInactive
                  ]}>
                    {isConnected ? 'Ativo' : 'Inativo'}
                  </Text>
                </View>
                <View style={styles.systemStatusItem}>
                  <Text style={styles.systemStatusLabel}>Modo Atual</Text>
                  <Text style={styles.systemStatusValue}>
                    {speedMode.charAt(0).toUpperCase() + speedMode.slice(1)}
                  </Text>
                </View>
                <View style={styles.systemStatusItem}>
                  <Text style={styles.systemStatusLabel}>Temperatura</Text>
                  <Text style={styles.systemStatusValue}>
                    {telemetry.temperature}
                  </Text>
                </View>
                <View style={styles.systemStatusItem}>
                  <Text style={styles.systemStatusLabel}>Segurança</Text>
                  <Text style={[
                    styles.systemStatusValue,
                    isLocked ? styles.systemStatusValueWarning : styles.systemStatusValueActive
                  ]}>
                    {isLocked ? 'Travado' : 'Liberado'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
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
    paddingBottom: 20,
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
  statusCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusCardPurple: {
    backgroundColor: '#8b5cf6',
  },
  statusCardOrange: {
    backgroundColor: '#f97316',
  },
  statusCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusCardLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  statusCardValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statusCardIcon: {
    opacity: 0.8,
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
  quickActionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    aspectRatio: 1,
    backgroundColor: '#e0f2f7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionButtonActive: {
    backgroundColor: '#ffcdd2',
  },
  quickActionButtonEmergency: {
    backgroundColor: '#ffab91',
  },
  quickActionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#e0e0e0',
  },
  quickActionLabel: {
    fontSize: 14,
    color: '#0277bd',
  },
  quickActionLabelEmergency: {
    color: '#d84315',
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
  systemStatusGrid: {
    gap: 12,
  },
  systemStatusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  systemStatusLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  systemStatusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  systemStatusValueActive: {
    color: '#10b981',
  },
  systemStatusValueInactive: {
    color: '#ef4444',
  },
  systemStatusValueWarning: {
    color: '#f97316',
  },
}); 