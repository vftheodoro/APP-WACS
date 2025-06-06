import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Simulação de dispositivos Bluetooth
const MOCK_DEVICES = [
  { id: '1', name: 'Wheelchair-001', rssi: -45, paired: true },
  { id: '2', name: 'Wheelchair-002', rssi: -65, paired: false },
  { id: '3', name: 'Wheelchair-003', rssi: -75, paired: false },
];

export const ConnectionScreen = () => {
  const navigation = useNavigation();
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    startScan();
    return () => {
      // Limpar qualquer listener ou estado quando sair da tela
      setIsScanning(false);
      setDevices([]);
    };
  }, []);

  const startScan = async () => {
    setIsScanning(true);
    setDevices([]);
    
    // Simulação de busca de dispositivos
    setTimeout(() => {
      setDevices(MOCK_DEVICES);
      setIsScanning(false);
    }, 2000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await startScan();
    setRefreshing(false);
  };

  const handleConnect = async (device) => {
    if (isConnecting) return;

    setIsConnecting(true);
    setSelectedDevice(device);

    // Simulação de conexão
    setTimeout(() => {
      setIsConnecting(false);
      Alert.alert(
        'Conexão Estabelecida',
        `Conectado com sucesso à ${device.name}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }, 2000);
  };

  const getSignalStrength = (rssi) => {
    if (rssi > -50) return { level: 'strong', color: '#4CAF50' };
    if (rssi > -70) return { level: 'medium', color: '#FF9800' };
    return { level: 'weak', color: '#F44336' };
  };

  const renderDevice = (device) => {
    const signal = getSignalStrength(device.rssi);
    const isSelected = selectedDevice?.id === device.id;

    return (
      <Pressable
        key={device.id}
        style={[
          styles.deviceCard,
          isSelected && styles.deviceCardSelected,
          isConnecting && styles.deviceCardDisabled
        ]}
        onPress={() => !isConnecting && handleConnect(device)}
        disabled={isConnecting}
      >
        <View style={styles.deviceInfo}>
          <View style={styles.deviceHeader}>
            <Ionicons 
              name="bluetooth" 
              size={24} 
              color={signal.color} 
            />
            <Text style={styles.deviceName}>{device.name}</Text>
            {device.paired && (
              <View style={styles.pairedBadge}>
                <Text style={styles.pairedText}>Pareado</Text>
              </View>
            )}
          </View>
          
          <View style={styles.deviceDetails}>
            <View style={styles.signalInfo}>
              <Ionicons 
                name={signal.level === 'strong' ? 'wifi' : 'wifi-outline'} 
                size={16} 
                color={signal.color} 
              />
              <Text style={[styles.signalText, { color: signal.color }]}>
                Sinal {signal.level}
              </Text>
            </View>
            
            {isSelected && isConnecting ? (
              <ActivityIndicator color="#1976d2" />
            ) : (
              <Pressable
                style={[
                  styles.connectButton,
                  isSelected && styles.connectButtonConnected
                ]}
                onPress={() => handleConnect(device)}
                disabled={isConnecting}
              >
                <LinearGradient
                  colors={isSelected ? ['#4CAF50', '#45a049'] : ['#1976d2', '#2196f3']}
                  style={styles.connectButtonGradient}
                >
                  <Ionicons 
                    name={isSelected ? 'checkmark' : 'bluetooth-outline'} 
                    size={16} 
                    color="#fff" 
                  />
                  <Text style={styles.connectButtonText}>
                    {isSelected ? 'Conectado' : 'Conectar'}
                  </Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={['#1976d2', '#2196f3']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Conectar Cadeira</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={isScanning ? 'bluetooth-searching' : 'bluetooth'} 
              size={24} 
              color={isScanning ? '#FF9800' : '#1976d2'} 
            />
            <Text style={styles.statusText}>
              {isScanning ? 'Buscando dispositivos...' : 'Dispositivos encontrados'}
            </Text>
          </View>
          
          {isScanning ? (
            <View style={styles.scanningContainer}>
              <ActivityIndicator size="large" color="#1976d2" />
              <Text style={styles.scanningText}>
                Procurando cadeiras de rodas próximas...
              </Text>
            </View>
          ) : (
            <View style={styles.devicesList}>
              {devices.length > 0 ? (
                devices.map(renderDevice)
              ) : (
                <View style={styles.noDevicesContainer}>
                  <Ionicons name="bluetooth-off" size={48} color="#9E9E9E" />
                  <Text style={styles.noDevicesText}>
                    Nenhum dispositivo encontrado
                  </Text>
                  <Text style={styles.noDevicesSubtext}>
                    Certifique-se de que sua cadeira está ligada e próxima
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <Pressable
          style={styles.scanButton}
          onPress={startScan}
          disabled={isScanning}
        >
          <LinearGradient
            colors={['#1976d2', '#2196f3']}
            style={styles.scanButtonGradient}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color="#fff" 
              style={isScanning && styles.scanningIcon} 
            />
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Buscando...' : 'Buscar Novamente'}
            </Text>
          </LinearGradient>
        </Pressable>
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
    flexGrow: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  scanningContainer: {
    alignItems: 'center',
    padding: 20,
  },
  scanningText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  devicesList: {
    gap: 12,
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  deviceCardSelected: {
    borderColor: '#1976d2',
    backgroundColor: '#f5f9ff',
  },
  deviceCardDisabled: {
    opacity: 0.7,
  },
  deviceInfo: {
    gap: 12,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  pairedBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pairedText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  deviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signalText: {
    fontSize: 14,
  },
  connectButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  connectButtonConnected: {
    opacity: 0.9,
  },
  connectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noDevicesContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noDevicesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
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
}); 