import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { connectToArduino } from '../services/arduinoService';

export const ConnectionScreen = () => {
  const navigation = useNavigation();
  const [isSearching, setIsSearching] = useState(false);
  const [devices, setDevices] = useState([]);

  const handleScan = () => {
    if (isSearching) return;
    
    setIsSearching(true);
    setDevices([]);
    
    // Simula busca por 1 segundo
    setTimeout(() => {
      // Mostra um único dispositivo simulado
      setDevices([{
        id: 'wacs-kit-001',
        name: 'Kit de Automação - WACS (COM3)',
        port: 'COM3',
        rssi: -60,
        isConnectable: true
      }]);
      
      setIsSearching(false);
    }, 1000);
  };

  const handleConnect = async (device) => {
    try {
      // Mostra feedback visual de carregamento
      Alert.alert('Conectando', `Conectando ao ${device.name}...`, [], { cancelable: false });
      
      // Tenta conectar ao Arduino via servidor serial
      const result = await connectToArduino(device.port || 'COM3');
      
      // Fecha o alerta de carregamento
      Alert.alert('Sucesso', `Conectado com sucesso ao ${device.name}!`);
      
      if (result && result.success) {
        // Navega para a tela de controle após um pequeno atraso
        setTimeout(() => {
          navigation.navigate('ControlScreen', { 
            deviceInfo: { 
              ...device, 
              isConnected: true 
            } 
          });
        }, 500);
      } else {
        const errorMessage = result?.error || 'Não foi possível conectar ao dispositivo';
        Alert.alert('Erro', errorMessage);
      }
    } catch (error) {
      console.error('Erro na conexão:', error);
      Alert.alert(
        'Erro de Conexão', 
        'Não foi possível conectar ao servidor do Arduino. Verifique se o servidor está rodando e tente novamente.',
        [
          { text: 'Tentar Novamente', onPress: () => handleConnect(device) },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    }
  };

  const renderDevice = (device) => {
    return (
      <View key={device.id} style={styles.deviceCard}>
        <View style={styles.deviceInfo}>
          <View style={styles.deviceHeader}>
            <Ionicons name="hardware-chip" size={24} color="#4CAF50" />
            <View>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.deviceId}>{device.port}</Text>
            </View>
          </View>
          
          <View style={styles.deviceDetails}>
            <View style={styles.signalInfo}>
              <Ionicons name="wifi" size={16} color="#4CAF50" />
              <Text style={[styles.signalText, { color: '#4CAF50' }]}>Sinal forte</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.connectButton,
                pressed && styles.connectButtonPressed
              ]}
              onPress={() => handleConnect(device)}
            >
              <Text style={styles.connectButtonText}>Conectar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#757575" />
          <Text style={styles.loadingText}>Procurando dispositivos...</Text>
        </View>
      );
    } else if (devices.length > 0) {
      return (
        <View style={styles.devicesList}>
          {devices.map(renderDevice)}
        </View>
      );
    } else {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="bluetooth-outline" size={48} color="#9E9E9E" />
          <Text style={styles.emptyText}>Nenhum dispositivo encontrado</Text>
          <Text style={styles.emptySubtext}>Certifique-se de que sua cadeira está ligada e próxima</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed
          ]}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.headerTitle}>Conectar Dispositivo</Text>
        <Pressable 
          onPress={handleScan}
          style={({ pressed }) => [
            styles.scanButton,
            isSearching && styles.scanButtonDisabled,
            pressed && styles.scanButtonPressed
          ]}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.scanButtonText}>Buscar</Text>
          )}
        </Pressable>
      </View>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1E88E5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 16,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  scanButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  scanButtonPressed: {
    opacity: 0.8,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#757575',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  devicesList: {
    marginTop: 8,
  },
  deviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 12,
  },
  deviceId: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 12,
    marginTop: 2,
  },
  deviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  signalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  connectButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  connectButtonPressed: {
    opacity: 0.8,
  },
  connectButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  noDevicesSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  scanButton: { 
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 20,
  },
  scanButtonGradient: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanningIcon: {
    transform: [{ rotate: '45deg' }],
  },
  bluetoothWarning: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  bluetoothWarningText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  openSettingsButton: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    padding: 12,
  },
  openSettingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceId: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999',
    marginLeft: 12,
  },
  connectedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 12,
  },
});