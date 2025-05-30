import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export const MainSelectionScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // TODO: Implement actual Bluetooth connection check here
    // For now, simulating being disconnected on mount
    setIsConnected(false); // Set to true when connected

    // Example: Replace with your Bluetooth library's check
    // const checkBluetoothConnection = async () => {
    //   const connected = await bluetoothApi.checkConnection();
    //   setIsConnected(connected);
    // };
    // checkBluetoothConnection();

  }, []);

  const handleGoToControlScreen = () => {
    navigation.navigate('ControlScreen');
  };

  const handleGoToMapScreen = () => {
    navigation.navigate('MapScreen');
  };

  const handleGoToChatScreen = () => {
    navigation.navigate('ChatScreen');
  };

  const handleGoToLocationsListScreen = () => {
    navigation.navigate('LocationsListScreen');
  };

  const handleGoToUserProfileScreen = () => {
    navigation.navigate('UserProfileScreen');
  };

  const handleGoToConnectionScreen = () => {
    navigation.navigate('ConnectionScreen');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao deslogar:', error);
    }
  };

  // Placeholder for news data
  const newsItems = [
    { id: '1', text: 'Bem-vindo à nova interface!' },
    { id: '2', text: 'Atualização de segurança aplicada com sucesso.' },
    { id: '3', text: 'Novos modos de controle disponíveis em breve.' },
    { id: '4', text: 'Verifique a qualidade da conexão Bluetooth.' },
    { id: '5', text: 'Personalize seu perfil na seção de usuário.' },
  ];

  // Placeholder for wheelchair info (only used if connected)
  const wheelchairInfo = {
    battery: '75%',
    connection: 'Conectado',
    speed: 'Médio',
  };

  // Placeholder for recent activity data
  const recentActivity = [
    { id: 'a1', text: 'Última viagem: 2.5 km em 15 min' },
    { id: 'a2', text: 'Total de uso hoje: 45 min' },
    { id: 'a3', text: 'Notificação: Manutenção agendada para 01/12.' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Area */}
      <View style={styles.headerContainer}>
        <View style={styles.profileSection}>
          <Pressable
            onPress={() => navigation.navigate('UserProfileScreen')}
            style={({ pressed }) => [
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person-circle-outline" size={55} color="#757575" />
              </View>
            )}
          </Pressable>
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greeting}>Olá, {user?.name || 'Usuário'}!</Text>
            <Text style={styles.welcomeText}>Bem-vindo de volta.</Text>
          </View>
        </View>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#d32f2f" />
        </Pressable>
      </View>

      {/* Wheelchair Info Section */}
      <View style={[
        styles.infoContainer, 
        !isConnected && styles.disconnectedCardStyle
      ]}>
        <View style={styles.sectionTitleContainer}>
          <Ionicons name="bluetooth-outline" size={20} color="#333" />
          <Text style={styles.sectionTitle}>Status da Cadeira de Rodas</Text>
        </View>
        {!isConnected ? (
          <View style={styles.disconnectedInfo}>
            <Text style={styles.disconnectedInfoText}>Cadeira de rodas não conectada.</Text>
            <Pressable style={styles.connectButton} onPress={handleGoToConnectionScreen}>
              <Text style={styles.connectButtonText}>Conectar via Bluetooth</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <View style={styles.infoRow}>
              <Ionicons name="battery-charging-outline" size={20} color="#4caf50" />
              <Text style={styles.infoText}>Bateria: {wheelchairInfo.battery}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="bluetooth-outline" size={20} color="#2196f3" />
              <Text style={styles.infoText}>Conexão: {wheelchairInfo.connection}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="speedometer-outline" size={20} color="#ff9800" />
              <Text style={styles.infoText}>Modo de Velocidade: {wheelchairInfo.speed}</Text>
            </View>
          </View>
        )}

        {/* Control Button - Placed inside status card */}
        <Pressable 
          style={[styles.navButton, !isConnected && styles.navButtonDisabled, { marginTop: 20 }]}
          onPress={handleGoToControlScreen} 
          disabled={!isConnected}
        >
          <Ionicons 
            name="game-controller-outline" 
            size={24} 
            color={!isConnected ? '#b0b0b0' : '#fff'}
          />
          <Text style={[styles.navButtonText, !isConnected && styles.navButtonTextDisabled]}>Controle</Text> 
        </Pressable>
      </View>

      {/* News Terminal Section - Renamed for clarity */}
      <View style={styles.cardContainer}>
         <View style={styles.sectionTitleContainer}> 
           <Ionicons name="newspaper-outline" size={20} color="#333" /> 
           <Text style={styles.sectionTitle}>Central de Notícias</Text>
         </View>

        <ScrollView style={styles.newsScrollArea}>
          {newsItems.map(item => (
            <Text key={item.id} style={styles.newsItemText}>• {item.text}</Text>
          ))}
        </ScrollView>
      </View>

      {/* Recent Activity Section - Moved below News Terminal */}
      <View style={styles.cardContainer}>
         <View style={styles.sectionTitleContainer}> 
           <Ionicons name="time-outline" size={20} color="#333" /> 
           <Text style={styles.sectionTitle}>Atividades Recentes</Text>
         </View>

        {/* Conteúdo em desenvolvimento */}
        <Text style={styles.placeholderText}>Em breve</Text>
      </View>

      {/* Navigation Buttons Section */}
      <View style={styles.navigationContainer}> 
        <Text style={styles.sectionTitle}>Navegação</Text>

        <Pressable style={styles.navButton} onPress={handleGoToMapScreen}>
          <Ionicons name="map-outline" size={24} color="#fff" />
          <Text style={styles.navButtonText}>Mapa</Text>
        </Pressable>

        <Pressable style={styles.navButton} onPress={handleGoToChatScreen}>
          <Ionicons name="chatbubble-outline" size={24} color="#fff" />
          <Text style={styles.navButtonText}>Chat</Text>
        </Pressable>

        <Pressable style={styles.navButton} onPress={handleGoToLocationsListScreen}>
          <Ionicons name="list-outline" size={24} color="#fff" />
          <Text style={styles.navButtonText}>Locais</Text>
        </Pressable>

        <Pressable style={styles.navButton} onPress={handleGoToUserProfileScreen}>
          <Ionicons name="person-outline" size={24} color="#fff" />
          <Text style={styles.navButtonText}>Meu Perfil</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#eef2f7',
    paddingTop: 20,
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#d0d0d0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  greetingTextContainer: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeText: {
    fontSize: 14,
    color: '#555',
  },
  logoutButton: {
    padding: 10,
    borderRadius: 25,
    backgroundColor: '#ffeded',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  infoContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  disconnectedInfo: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
  },
  disconnectedInfoText: {
    fontSize: 16,
    color: '#f57c00',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  connectButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    backgroundColor: '#1E88E5',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
  },
  newsScrollArea: {
    maxHeight: 120,
  },
  newsItemText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  navigationContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 20,
  },
  navButton: {
    flexDirection: 'row',
    backgroundColor: '#1e88e5',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    width: '95%',
  },
  navButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  navButtonTextDisabled: {
    color: '#a0a0a0',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  navButtonPlaceholder: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
    width: '95%',
  },
   navButtonTextPlaceholder: {
    color: '#a0a0a0',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  disconnectedCardStyle: {
    backgroundColor: '#ffeded',
  },
  placeholderText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
}); 