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
  SafeAreaView,
  useWindowDimensions,
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
// Removido Bluetooth; usaremos apenas serial via HTTP
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { sendToArduino } from '../services/arduinoHttp';

const JOYSTICK_SIZE = 280;
const STICK_SIZE = 100;
const MAX_DISTANCE = (JOYSTICK_SIZE - STICK_SIZE) / 2;

export const ControlScreen = () => {
  // Estados principais - Usados para a UI do React, sincronizados com shared values quando necessário
  const [speedMode, setSpeedMode] = useState('manual');
  const [isLocked, setIsLocked] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const currentSpeed = useSharedValue(0);
  const [isPressingLock, setIsPressingLock] = useState(false);
  const { width } = useWindowDimensions();
  const joystickScale = Math.max(0.8, Math.min(1.1, width / 420));

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

  // Estados simulados/locais para indicadores (serial-only)
  const isConnected = true;
  const isConnecting = false;
  const deviceInfo = { name: 'Serial COM5' };
  const [batteryLevel] = useState(84);
  const [connectionStrength] = useState('strong');
  const [estimatedAutonomy] = useState('—');
  const [systemTemperature, setSystemTemperature] = useState(36.8);

  useEffect(() => {
    // Pequena variação mock de temperatura para efeito visual
    const t = setInterval(() => setSystemTemperature(prev => Math.round((prev + (Math.random()*0.4 - 0.2))*10)/10), 5000);
    return () => clearInterval(t);
  }, []);

  const navigation = useNavigation();
  const route = useRoute();
  const mockMode = route.params?.mockMode === true;
  const mockDeviceName = 'WACS Falcon-1';

  // Nenhuma conexão extra necessária para o envio simples via HTTP

  // Configuração para redirecionar para a tela inicial ao tentar voltar
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Previne a ação padrão de voltar apenas se não for uma navegação programática
      if (e.data.action.type !== 'NAVIGATE') {
        e.preventDefault();
        
        // Navega para a tela inicial em vez da tela anterior
        navigation.navigate('MainSelection');
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Sincroniza shared values com estados regulares do React
  useEffect(() => {
    isLockedShared.value = isLocked;
  }, [isLocked]);

  useEffect(() => {
    speedModeShared.value = speedMode;
    const speedLimits = {
      'eco': 6, // Indoor: limite reduzido
      'sport': 12, // Outdoor: limite maior
      'manual': 20 // Manual: velocidade máxima
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

  // --- JOYSTICK: ENVIO DE COMANDOS --- //
  // Armazena último comando enviado para evitar repetição
  const lastJoystickCommand = useRef('S');
  const lastSentPower = useRef(0);

  const handleGestureEvent = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      if (!(isConnected || mockMode) || isLockedSharedState || isEmergency) {
        return;
      }
      ctx.offsetX = translateX.value;
      ctx.offsetY = translateY.value;
      // Travar scroll automaticamente ao iniciar joystick
      if (!scrollLocked) runOnJS(setScrollLocked)(true);
      // Não enviar comandos no início do joystick
    },
    onActive: (event, ctx) => {
      if (!(isConnected || mockMode) || isLockedSharedState || isEmergency) {
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
      // Não enviar comandos de direção ou potência por enquanto
      // Mantemos apenas a atualização visual do joystick/velocidade local
    },
    onEnd: () => {
      if (!(isConnected || mockMode) || isLockedSharedState || isEmergency) {
        return;
      }
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      // Destrava o scroll ao soltar o joystick
      runOnJS(setScrollLocked)(false);
      currentSpeed.value = 0;
      // Não enviar comandos de parada/direção pela finalização do joystick
      lastJoystickCommand.current = 'S';
      lastSentPower.current = 0;
      // Não enviar comandos ao finalizar o joystick
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
      opacity: 1,
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
    if (!(isConnected || mockMode) || isLocked || isEmergency) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSpeedMode(mode);
    // maxSpeedShared.value é atualizado no useEffect quando speedMode muda
  };

  const handleLockToggle = () => {
    // Usar estados regulares do React para lógica UI/vibração
    if (!(isConnected || mockMode) || isEmergency) {
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
      'Desconectar Cadeira',
      'Tem certeza que deseja desconectar a cadeira?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desconectar', style: 'destructive', onPress: () => { 
          navigation.navigate('MainSelection'); 
        } }
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
            <Text style={styles.speedGaugeUnit}>km/h</Text>
          </View>
        </View>
      </View>
    );
  };

  // Definir cores dinâmicas conforme estado de bloqueio/freio
  const isBlocked = isLocked || isEmergency;
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

  // Feedback ao entrar/sair do modo de emergência
  useEffect(() => {
    if (isEmergency) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      // Trava a cadeira automaticamente
      setIsLocked(true);
    }
  }, [isEmergency]);

  // --- VELOCIDADE: ENVIO DE COMANDO --- //
  useEffect(() => {
    // Sempre que displayMaxSpeed mudar, envia comando de velocidade
    if (!isLocked && !isEmergency) {
      const v = Math.round((displayMaxSpeed / 10) * 255); // 0-10 para 0-255
      sendToArduino(`V${v}`);
    }
  }, [displayMaxSpeed, isLocked, isEmergency]);

  // --- INTEGRAÇÃO BLUETOOTH: ENVIO DE COMANDOS --- //
  // (Removido) estado de freio manual – substituído por modo de emergência

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
            accessibilityLabel="Voltar"
            accessibilityHint="Retorna para a tela anterior"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          
          <View style={styles.headerTitleContainer}>
            <Text 
              style={styles.headerTitle}
              accessibilityLabel={`Controle ${deviceInfo?.name || mockMode ? mockDeviceName : 'da Cadeira'}`}
              accessibilityRole="header"
            >
              {deviceInfo?.name ? `Cadeira ${deviceInfo.name}` : (mockMode ? mockDeviceName : 'Controle da Cadeira')}
            </Text>
            <Text style={styles.headerSubtitle} accessibilityLabel={`Modo ${speedMode === 'eco' ? 'Indoor' : speedMode === 'sport' ? 'Outdoor' : 'Manual'} com velocidade máxima de ${displayMaxSpeed} quilômetros por hora`}>
              {(speedMode === 'eco' ? 'Indoor' : speedMode === 'sport' ? 'Outdoor' : 'Manual')} • {displayMaxSpeed} km/h
            </Text>
            {/* Linha de status compacta */}
            <View style={styles.headerChipsRow}>
              <View style={styles.headerChip} accessibilityLabel={isLocked ? 'Cadeira travada' : 'Cadeira destravada'}>
                <Ionicons name={isLocked ? 'lock-closed' : 'lock-open'} size={12} color="#fff" />
                <Text style={styles.headerChipText}>{isLocked ? 'Travada' : 'Destravada'}</Text>
              </View>
              <View style={[styles.headerChip, isEmergency && styles.headerChipWarn]} accessibilityLabel={isEmergency ? 'Emergência ativa' : 'Sem emergência'}>
                <Ionicons name="alert-circle" size={12} color="#fff" />
                <Text style={styles.headerChipText}>{isEmergency ? 'Emergência' : 'Seguro'}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollViewContent} scrollEnabled={!scrollLocked}>
          <View style={styles.mainContentArea}>
            {/* Removed Arduino server controls (WebSocket UI) - reverted to original behavior */}
            {/* Fundo dinâmico para área principal */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: mainContentBg, zIndex: -1, borderRadius: 20 }} pointerEvents="none" />
            {/* Joystick Area */}
            <View style={[styles.joystickArea, { backgroundColor: joystickBgColor }]}>
              {/* Botão de Emergência */}
              <Pressable
                onPress={() => {
                  if (!isEmergency) {
                    Alert.alert(
                      'Ativar Emergência',
                      'Isso irá travar a cadeira imediatamente e iniciar o contato com o seu contato de emergência. Deseja continuar?',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Ativar', style: 'destructive', onPress: () => setIsEmergency(true) }
                      ]
                    );
                  }
                }}
                style={[
                  styles.emergencyButton,
                  isEmergency && styles.emergencyButtonActive
                ]}
                accessibilityLabel={isEmergency ? 'Emergência ativa' : 'Ativar emergência'}
                accessibilityHint={isEmergency ? 'Contato de emergência em andamento' : 'Trava a cadeira e inicia contato com seu contato de emergência'}
              >
                <Ionicons
                  name={isEmergency ? 'alert' : 'alert-circle'}
                  size={28}
                  color={isEmergency ? '#fff' : '#b91c1c'}
                />
              </Pressable>
              {isEmergency && (
                <View style={{ marginTop: 8, backgroundColor: '#fee2e2', borderRadius: 8, padding: 8, alignItems: 'center' }}>
                  <Text style={{ color: '#991b1b', fontWeight: 'bold', fontSize: 14 }}>
                    Modo de emergência ativado
                  </Text>
                </View>
              )}

              {/* Joystick */}
              <View style={[styles.joystickContainer, { transform: [{ scale: joystickScale }] }]}>
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
                      enabled={!isLockedSharedState && !isEmergency}
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
                  { key: 'eco', label: 'Indoor', icon: '🏠', desc: 'Locais fechados • resposta precisa' },
                  { key: 'sport', label: 'Outdoor', icon: '🌤️', desc: 'Locais abertos • resposta livre' },
                  { key: 'manual', label: 'Manual', icon: '🎚️', desc: 'Ajuste de velocidade manual' }
                ].map(mode => (
                  <Pressable
                    key={mode.key}
                    onPress={() => handleSpeedModeChange(mode.key)}
                    disabled={isLocked || isEmergency}
                    style={[
                      styles.speedModeButton,
                      speedMode === mode.key && styles.speedModeButtonSelected,
                      (isLocked || isEmergency) && styles.speedModeButtonDisabled
                    ]}
                  >
                    <View style={styles.speedModeContent}>
                      <Text style={styles.speedModeIcon}>{mode.icon}</Text>
                      <View style={styles.speedModeTextContainer}>
                        <Text style={[
                          styles.speedModeLabel,
                          speedMode === mode.key && styles.speedModeLabelSelected
                        ]} numberOfLines={1} ellipsizeMode="tail">
                          {mode.label}
                        </Text>
                        <Text style={styles.speedModeDescription} numberOfLines={1} ellipsizeMode="tail">
                          {mode.desc}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.speedModeCheckContainer}>
                      <Ionicons name="checkmark-circle" size={20} color={speedMode === mode.key ? '#10b981' : 'transparent'} />
                    </View>
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
                    <Ionicons name={'hardware-chip-outline'} size={28} color="#1976d2" style={styles.statusIconModern} />
                    <Text style={styles.statusLabelModern}>Conexão</Text>
                    <Text style={[ 
                      styles.statusValueModern,
                      styles.statusValueActiveModern
                    ]}>
                      Serial
                    </Text>
                  </View>
                  
                  
                  <View style={styles.statusItemModern}>
                    <Ionicons name={isEmergency ? 'call' : 'call-outline'} size={28} color="#1976d2" style={styles.statusIconModern} />
                    <Text style={styles.statusLabelModern}>Contato</Text>
                    <Text style={[styles.statusValueModern, isEmergency ? styles.statusValueWarningModern : styles.statusValueActiveModern]}>
                      {isEmergency ? 'Acionando…' : 'Pronto'}
                    </Text>
                  </View>
                <View style={styles.statusItemModern}>
                  <Ionicons name={systemTemperature > 45 ? 'thermometer' : 'thermometer-outline'} size={28} color="#1976d2" style={styles.statusIconModern} />
                  <Text style={styles.statusLabelModern}>Temperatura do Sistema</Text>
                  <Text style={[
                    styles.statusValueModern,
                    systemTemperature > 45 ? styles.statusValueWarningModern : styles.statusValueActiveModern
                  ]}>
                    {`${systemTemperature?.toFixed ? systemTemperature.toFixed(1) : systemTemperature} °C`}
                  </Text>
                </View>
                  <View style={styles.statusItemModern}>
                    <Ionicons name={'shield-checkmark-outline'} size={28} color="#1976d2" style={styles.statusIconModern} />
                    <Text style={styles.statusLabelModern}>Segurança</Text>
                    <Text style={[
                      styles.statusValueModern,
                      styles.statusValueActiveModern
                    ]}>
                      OK
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
      </ScrollView>

      {/* Overlay animado indicando scroll travado */}
      <Animated.View pointerEvents="none" style={[styles.scrollLockOverlay, scrollLockOverlayStyle]}> 
        <View style={styles.scrollLockOverlayContent}>
          <Ionicons name="lock-closed" size={38} color="#1976d2" style={{ marginBottom: 8 }} />
          <Text style={styles.scrollLockOverlayText}>Scroll travado</Text>
        </View>
      </Animated.View>

      {/* Overlay de Emergência */}
      {isEmergency && (
        <View style={styles.emergencyOverlay} accessibilityViewIsModal={true}>
          <View style={styles.emergencyOverlayContent}>
            <Ionicons name="alert" size={42} color="#ef4444" style={{ marginBottom: 8 }} />
            <Text style={styles.emergencyTitle}>Modo de Emergência</Text>
            <Text style={styles.emergencyMessage}>Contactando seu contato de emergência...</Text>
            <ActivityIndicator size="small" color="#ef4444" style={{ marginVertical: 12 }} />
            <Pressable
              style={styles.emergencyCancelButton}
              onPress={() => setIsEmergency(false)}
              accessibilityLabel="Cancelar emergência"
              accessibilityHint="Cancela o modo de emergência e destrava a interface"
            >
              <Text style={styles.emergencyCancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Botão flutuante para travar/destravar o scroll */}
      <Pressable
        style={[styles.fabLockScroll, scrollLocked && styles.fabLockScrollActive]}
        onPress={() => setScrollLocked((prev) => !prev)}
        accessibilityLabel={scrollLocked ? 'Destravar scroll' : 'Travar scroll'}
        disabled={isEmergency}
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
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1976d2',
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 5,
    zIndex: 1,
    elevation: 4, // Sombra no Android
    shadowColor: '#000', // Sombra no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  backButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    includeFontPadding: false,
    letterSpacing: 0.2,
    textTransform: 'none',
  },
  headerSubtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
    includeFontPadding: false,
  },
  speedModeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 26,
  },
  speedModeBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    includeFontPadding: false,
    textAlign: 'center',
    lineHeight: 16,
  },
  // Espaçador para alinhar o conteúdo centralizado
  headerSpacer: {
    width: 44,
    height: 44,
  },
  headerChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    justifyContent: 'center',
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  headerChipWarn: {
    backgroundColor: 'rgba(239,68,68,0.28)',
    borderColor: 'rgba(239,68,68,0.42)',
  },
  headerChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    includeFontPadding: false,
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
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  emergencyButtonActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  emergencyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 20,
  },
  emergencyOverlayContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 420,
    alignItems: 'center',
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 4,
    textAlign: 'center',
  },
  emergencyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  emergencyCancelButton: {
    marginTop: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  emergencyCancelText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 14,
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
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    minHeight: 68,
    width: '100%',
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
    width: 28,
    lineHeight: 24,
    textAlign: 'center',
  },
  speedModeTextContainer: {
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  speedModeCheckContainer: {
    width: 24,
    alignItems: 'flex-end',
  },
  speedModeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 20,
    includeFontPadding: false,
  },
  speedModeLabelSelected: {
    color: '#3b82f6',
    lineHeight: 20,
    includeFontPadding: false,
  },
  speedModeDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
    includeFontPadding: false,
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
    left: 16,
    bottom: 20,
    alignItems: 'flex-start',
    zIndex: 10,
  },
  scrollLockOverlayContent: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 6,
  },
  scrollLockOverlayText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 180,
  },
});