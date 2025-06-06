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
import { useBluetooth } from '../contexts/BluetoothContext';

export const ConnectionScreen = () => {
  const navigation = useNavigation();
  const { 
    isConnected,
    isConnecting,
    deviceInfo,
    connectToDevice,
    disconnectFromDevice,
    scanForDevices,
  } = useBluetooth();

  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]); 
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Iniciar a busca apenas se NÃO estiver conectado ao montar a tela
    if (!isConnected) {
      handleScan();
    }
    
    // TODO: Adicionar cleanup para parar o scan Bluetooth real ao sair da tela (se isScanning for true)
    return () => {
      setIsScanning(false);
      setDevices([]);
      setSelectedDevice(null);
      // TODO: Chamar função de parar scan do contexto se existir
    };
  }, [isConnected]); 

  const handleScan = async () => {
    if (isConnected || isScanning) return;

    setIsScanning(true);
    setDevices([]); 
    setSelectedDevice(null);
    
    try {
      const foundDevices = await scanForDevices(); 
      setDevices(foundDevices);
    } catch (error) {
      console.error('Erro ao buscar dispositivos:', error);
      Alert.alert('Erro na Busca', 'Não foi possível buscar dispositivos Bluetooth.');
    } finally {
      setIsScanning(false);
      setRefreshing(false); 
    }
  };

  const handleConnectPress = async (device) => {
    if (isConnecting || isConnected) return;

    setSelectedDevice(device); 
    connectToDevice(device); 
  };
  
  const onRefresh = async () => {
    setRefreshing(true); 
    if (isConnected) { 
        setRefreshing(false); 
    } else { 
        await handleScan(); 
    }
  };

  const getSignalStrength = (rssi) => {
    if (rssi > -50) return { level: 'strong', color: '#4CAF50' };
    if (rssi > -70) return { level: 'medium', color: '#FF9800' };
    return { level: 'weak', color: '#F44336' };
  };

  const handleDisconnectPress = () => {
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
          onPress: disconnectFromDevice
        }
      ]
    );
  };

  const renderDevice = (device) => {
    const signal = getSignalStrength(device.rssi);
    const isCurrentlyConnectedDevice = isConnected && deviceInfo?.id === device.id;
    const isSelected = selectedDevice?.id === device.id;

    return (
      <Pressable
        key={device.id}
        style={[
          styles.deviceCard,
          isSelected && styles.deviceCardSelected,
          isConnecting && styles.deviceCardDisabled,
          isCurrentlyConnectedDevice && styles.deviceCardConnected
        ]}
        onPress={() => !isConnected && !isConnecting && handleConnectPress(device)}
        disabled={isConnected || isConnecting}
      >
        <View style={styles.deviceInfo}>
          <View style={styles.deviceHeader}>
            <Ionicons 
              name="bluetooth" 
              size={24} 
              color={signal.color} 
            />
            <Text style={styles.deviceName}>{device.name}</Text>
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
              isCurrentlyConnectedDevice ? (
                 <Pressable
                    style={styles.connectButton}
                    onPress={handleDisconnectPress}
                 >
                   <LinearGradient
                     colors={['#f44336', '#d32f2f']}
                     style={styles.connectButtonGradient}
                   >
                     <Ionicons name="close-circle-outline" size={16} color="#fff" />
                     <Text style={styles.connectButtonText}>Desconectar</Text>
                   </LinearGradient>
                 </Pressable>
              ) : (
                 <Pressable
                   style={styles.connectButton}
                   onPress={() => handleConnectPress(device)}
                   disabled={isConnecting}
                 >
                   <LinearGradient
                     colors={['#1976d2', '#2196f3']}
                     style={styles.connectButtonGradient}
                   >
                     <Ionicons name="bluetooth-outline" size={16} color="#fff" />
                     <Text style={styles.connectButtonText}>Conectar</Text>
                   </LinearGradient>
                 </Pressable>
              )
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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Conectar Cadeira</Text>
          <View style={styles.headerRightPlaceholder} /> 
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {isConnected && deviceInfo ? (
            <View style={styles.devicesList}> 
                {renderDevice(deviceInfo)}
            </View>
        ) : (
            <View style={styles.statusCard}> 
              <View style={styles.statusHeader}>
                <Ionicons 
                  name={isScanning ? 'bluetooth-searching' : 'bluetooth'} 
                  size={24} 
                  color={isScanning ? '#FF9800' : '#1976d2'} 
                />
                <Text style={styles.statusText}>
                  {isScanning ? 'Buscando dispositivos...' : (devices.length > 0 ? 'Dispositivos encontrados' : 'Nenhum dispositivo encontrado')}
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
        )}

        {/* Botão Buscar Novamente - Apenas quando não conectado */}
        {!isConnected && (
            <Pressable
              style={styles.scanButton}
              onPress={handleScan} 
              disabled={isScanning || isConnecting}
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
        )}
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
  headerRightPlaceholder: {
    width: 44,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
   deviceCardSelected: {
    borderColor: '#1976d2',
    backgroundColor: '#f5f9ff',
  },
   deviceCardDisabled: {
     opacity: 0.7,
   },
   deviceCardConnected: {
     borderColor: '#4CAF50',
     backgroundColor: '#e8f5e9',
   },
  deviceInfo: {
    flex: 1,
    gap: 8,
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
  deviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
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
  connectButtonGradient:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
});