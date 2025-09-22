import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  RefreshControl,
  Dimensions,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useBluetooth } from '../contexts/BluetoothContext';
import { getUserGamificationData, getLevelNameAndReward } from '../services/gamification';
import { getSeenPosts, saveSeenPosts } from '../utils/storage';
import { fetchPostsPaginated } from '../services/firebase/posts';

const { width } = Dimensions.get('window');

export const MainSelectionScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const {
    isConnected,
    isConnecting,
    deviceInfo,
    batteryLevel,
    connectionStrength,
    connectToDevice,
    disconnectFromDevice,
  } = useBluetooth();
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-50));
  const [gamification, setGamification] = useState({ xp: 0, level: 1, badges: [] });
  const [hasNewPosts, setHasNewPosts] = useState(false);

  useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Atualiza gamification sempre que a tela ganha foco
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        getUserGamificationData(user.id).then(setGamification);
      }
    }, [user?.id])
  );

  // Função para verificar se há novos posts não vistos
  const checkNewPosts = async () => {
    if (!user?.id) return;
    try {
      const { posts } = await fetchPostsPaginated({ pageSize: 10 });
      const seen = await getSeenPosts(user.id);
      const unseen = posts.filter(p => !seen.includes(p.id));
      setHasNewPosts(unseen.length > 0);
    } catch (e) {
      setHasNewPosts(false);
    }
  };

  // Atualiza badge ao focar ou trocar usuário
  useFocusEffect(
    React.useCallback(() => {
      checkNewPosts();
    }, [user?.id])
  );

  // Ao entrar na tela de comunidade, marca todos os posts atuais como vistos
  const handleCommunityPress = async () => {
    navigation.navigate('SocialScreen');
    try {
      const { posts } = await fetchPostsPaginated({ pageSize: 10 });
      const ids = posts.map(p => p.id);
      await saveSeenPosts(user.id, ids);
      setHasNewPosts(false);
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Implementar lógica de refresh real (ex: re-escanear ou pedir status do dispositivo conectado)
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simula refresh
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirmar Logout',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Desconectar Bluetooth antes de deslogar, se conectado
              await logout();
            } catch (error) {
              console.error('Erro ao deslogar:', error);
              Alert.alert('Erro', 'Não foi possível fazer logout');
            }
          },
        },
      ]
    );
  };

  const handleQuickConnect = async () => {
    if (isConnected) {
      // Se já conectado, pergunta se quer desconectar (usando a função do contexto)
      Alert.alert(
        'Desconectar',
        `Deseja desconectar a cadeira de rodas${deviceInfo?.name ? ' (' + deviceInfo.name + ')' : ''}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desconectar',
            style: 'destructive',
            onPress: disconnectFromDevice, // Usa a função de desconectar do contexto
          },
        ]
      );
    } else if (isConnecting) {
      Alert.alert('Aguarde', 'Já está conectando à cadeira de rodas...');
    } else {
      // Se não conectado, navega para a tela de conexão
      navigation.navigate('ConnectionScreen');
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getConnectionIcon = () => {
    if (isConnecting) return 'bluetooth';
    if (!isConnected) return 'bluetooth-outline';
    return connectionStrength === 'strong' ? 'bluetooth' : 'bluetooth-outline';
  };

  const getConnectionColor = () => {
    if (isConnecting) return '#FF9800';
    if (!isConnected) return '#F44336';
    return connectionStrength === 'strong' ? '#4CAF50' : '#FF9800';
  };

  const getBatteryIcon = () => {
    if (batteryLevel > 80) return 'battery-full-outline';
    if (batteryLevel > 50) return 'battery-half-outline';
    if (batteryLevel > 20) return 'battery-dead-outline';
    return 'battery-dead-outline'; // Ícone para bateria baixa/desconectado
  };

  const getBatteryColor = () => {
    if (batteryLevel > 50) return '#4CAF50';
    if (batteryLevel > 20) return '#FF9800';
    return '#F44336';
  };

  const getLevelColor = (level) => {
    if (level >= 10) return '#8e24aa'; // Roxo
    if (level >= 7) return '#1976d2'; // Azul
    if (level >= 5) return '#FFD700'; // Ouro
    if (level >= 3) return '#B0BEC5'; // Prata
    return '#CD7F32'; // Bronze
  };

  const quickActions = [
    {
      id: 'control',
      title: 'Controle',
      icon: 'game-controller-outline',
      onPress: () => {
        if (isConnected) {
          navigation.navigate('ControlScreen', { deviceInfo: deviceInfo });
        } else {
          // Sempre permite abrir a tela de controle em modo simulado
          navigation.navigate('ControlScreen', { mockMode: true });
        }
      },
      disabled: false,
      gradient: ['#1976d2', '#2196f3'],
    },
    {
      id: 'map',
      title: 'Mapa',
      icon: 'map-outline',
      onPress: () => navigation.navigate('MapScreen'),
      gradient: ['#1976d2', '#2196f3'],
    },
    {
      id: 'community',
      title: 'Comunidade',
      icon: 'chatbubble-ellipses-outline',
      onPress: handleCommunityPress,
      gradient: ['#1976d2', '#2196f3'],
    },
    {
      id: 'locations',
      title: 'Locais',
      icon: 'location-outline',
      onPress: () => navigation.navigate('LocationsListScreen'),
      gradient: ['#1976d2', '#2196f3'],
    },
  ];

  const newsItems = [
    { 
      id: '1', 
      text: 'Nova atualização disponível - Melhorias de performance',
      type: 'update',
      time: '2h'
    },
    { 
      id: '2', 
      text: 'Dica: Mantenha a bateria sempre acima de 20%',
      type: 'tip',
      time: '5h'
    },
    { 
      id: '3', 
      text: 'Novo modo de condução eco disponível',
      type: 'feature',
      time: '1d'
    },
  ];

  const getNewsIcon = (type) => {
    switch (type) {
      case 'update': return 'download-outline';
      case 'tip': return 'bulb-outline';
      case 'feature': return 'star-outline';
      default: return 'information-circle-outline';
    }
  };

  const renderQuickAction = (action) => (
    <Pressable
      key={action.id}
      style={[
        styles.quickActionButton,
        action.disabled && styles.quickActionDisabled
      ]}
      onPress={() => {
        if (!action.disabled) {
          action.onPress();
        }
      }}
      onLongPress={
        action.id === 'control' && action.disabled
          ? () => {
              Alert.alert(
                'Modo Simulado',
                'Você está acessando o controle em modo simulado para testes.'
              );
              navigation.navigate('ControlScreen', { mockMode: true });
            }
          : undefined
      }
    >
      <LinearGradient
        colors={action.disabled ? ['#e0e0e0', '#bdbdbd'] : action.gradient}
        style={styles.quickActionGradient}
      >
        <Ionicons 
          name={action.icon} 
          size={28} 
          color={action.disabled ? '#9e9e9e' : '#fff'} 
        />
        <Text style={[
          styles.quickActionText,
          action.disabled && styles.quickActionTextDisabled
        ]}>
          {action.title}
        </Text>
        {/* Badge de novos posts */}
        {action.id === 'community' && hasNewPosts && (
          <View style={styles.newPostsBadge}>
            <Ionicons name="ellipse" size={14} color="#E53935" />
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header com gradiente */}
      <LinearGradient
        colors={['#1976d2', '#2196f3']}
        style={styles.headerGradient}
      >
        <Animated.View 
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.profileSection}>
            <Pressable
              onPress={() => navigation.navigate('UserProfileScreen')}
              style={styles.profileImageContainer}
            >
              <View>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Ionicons name="person" size={30} color="#1976d2" />
                  </View>
                )}
                {/* Badge de nível na foto */}
                <View style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: getLevelColor(gamification.level),
                  borderWidth: 2,
                  borderColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{gamification.level}</Text>
                </View>
              </View>
            </Pressable>
            <View style={styles.greetingContainer}>
              <Text style={styles.timeGreeting}>{getTimeGreeting()},</Text>
              <Text style={styles.userName}>{user?.name || 'Usuário'}!</Text>
              <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 15, marginTop: 2 }}>
                Nível {gamification.level} - {gamification.xp} XP
              </Text>
            </View>
            {/* Ícone de notificação à direita */}
            <Pressable
              onPress={() => {/* navegação futura para notificações */}}
              style={{ marginLeft: 'auto', padding: 8 }}
              accessibilityLabel="Notificações"
            >
              <Ionicons name="notifications-outline" size={28} color="#fff" />
            </Pressable>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Ações Rápidas - AGORA ACIMA DO CARD DA CADEIRA */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map(renderQuickAction)}
        </View>
      </View>

      {/* Status da Cadeira - Card Moderno (MENOR) */}
      <View style={[
        styles.statusCard,
        !isConnected && styles.statusCardDisconnected
      ]}>
        <View style={styles.statusHeader}>
          <View style={styles.statusTitleContainer}>
            <View style={[
              styles.connectionIndicator,
              { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
            ]} />
            <Text style={styles.statusTitle}>Cadeira de Rodas</Text>
          </View>
          {/* Botão Quick Connect (ícone bluetooth) - Agora também usado para desconectar */}
          <Pressable onPress={handleQuickConnect} style={styles.quickConnectButton}>
            <Ionicons 
              name={getConnectionIcon()} 
              size={16} 
              color={getConnectionColor()} 
            />
            {isConnecting && (
              <Text style={[styles.connectingText, { fontSize: 12 }]}>Conectando...</Text>
            )}
          </Pressable>
        </View>

        {isConnected ? (
          <View style={styles.connectedInfo}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Ionicons 
                  name={getBatteryIcon()} 
                  size={18} 
                  color={getBatteryColor()} 
                />
                <Text style={styles.infoLabel}>Bateria</Text>
                <Text style={[styles.infoValue, { color: getBatteryColor(), fontSize: 13 }]}>
                  {batteryLevel}%
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="speedometer-outline" size={18} color="#FF9800" />
                <Text style={styles.infoLabel}>Velocidade</Text>
                <Text style={[styles.infoValue, { fontSize: 13 }]}>Média</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={18} color="#2196F3" />
                <Text style={styles.infoLabel}>Uso Hoje</Text>
                <Text style={[styles.infoValue, { fontSize: 13 }]}>2h 15m</Text>
              </View>
            </View>
            <Pressable 
              style={styles.connectButton}
              onPress={() => navigation.navigate('ConnectionScreen')}
            >
              <LinearGradient
                colors={['#1976d2', '#2196f3']}
                style={styles.connectButtonGradient}
              >
                <Ionicons name="settings-outline" size={20} color="#fff" />
                <Text style={styles.connectButtonText}>Configurar Conexão</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View style={styles.disconnectedInfo}>
            {/* Mostrar ícone de buscando se estiver conectando */}
            {isConnecting ? (
              <Ionicons name="bluetooth" size={36} color="#FF9800" />
            ) : (
              <Ionicons name="bluetooth-outline" size={36} color="#9E9E9E" />
            )}
            <Text style={styles.disconnectedText}>
              {isConnecting ? 'Conectando...' : 'Cadeira não conectada'}
            </Text>
            <Text style={styles.disconnectedSubtext}>
              {isConnecting ? 'Aguarde a conexão ser estabelecida' : 'Toque no botão abaixo para conectar'}
            </Text>
            {/* Botão Conectar Cadeira aparece quando desconectado */}
            {!isConnecting && (
              <Pressable
                style={styles.connectButton}
                onPress={() => navigation.navigate('ConnectionScreen')}
              >
                <LinearGradient
                  colors={['#1976d2', '#2196f3']}
                  style={styles.connectButtonGradient}
                >
                  <Ionicons name="bluetooth-outline" size={16} color="#fff" />
                  <Text style={styles.connectButtonText}>Conectar Cadeira</Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Notícias e Dicas */}
      <View style={styles.newsContainer}>
        <View style={styles.newsTitleContainer}>
          <Ionicons name="newspaper-outline" size={20} color="#333" />
          <Text style={styles.sectionTitle}>Notícias & Dicas</Text>
        </View>
        
        {newsItems.map((item) => (
          <View key={item.id} style={styles.newsItem}>
            <Ionicons 
              name={getNewsIcon(item.type)} 
              size={20} 
              color="#1976d2" 
            />
            <View style={styles.newsContent}>
              <Text style={styles.newsText}>{item.text}</Text>
              <Text style={styles.newsTime}>{item.time}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Atividade Recente */}
      <View style={styles.activityContainer}>
        <View style={styles.activityHeader}>
          <Ionicons name="analytics-outline" size={20} color="#333" />
          <Text style={styles.sectionTitle}>Resumo de Hoje</Text>
        </View>
        
        <View style={styles.activityStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12.5 km</Text>
            <Text style={styles.statLabel}>Distância</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>2h 15m</Text>
            <Text style={styles.statLabel}>Tempo Ativo</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>8.2 km/h</Text>
            <Text style={styles.statLabel}>Vel. Média</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  headerGradient: {
    paddingTop: 28,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    marginRight: 15,
  },
  profileImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileImagePlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  greetingContainer: {
    flex: 1,
  },
  timeGreeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
  },
  logoutButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 0,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  statusCardDisconnected: {
    backgroundColor: '#fafafa',
    borderWidth: 2,
    borderColor: '#ffcdd2',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  quickConnectButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF9800',
  },
  connectedInfo: {
    alignItems: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  connectButton: {
    marginTop: 20,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  connectButtonGradient: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disconnectedInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  disconnectedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  disconnectedSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 20,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginLeft: 5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: (width - 60) / 2,
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionDisabled: {
    opacity: 0.6,
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  quickActionTextDisabled: {
    color: '#9e9e9e',
  },
  newsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  newsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  newsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  newsContent: {
    flex: 1,
    marginLeft: 12,
  },
  newsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  newsTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  activityContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  newPostsBadge: {
    position: 'absolute',
    top: 10,
    right: 18,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
});