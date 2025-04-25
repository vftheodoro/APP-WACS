import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useBluetooth } from '../contexts/BluetoothContext';

export const BluetoothConnectionScreen: React.FC = () => {
  const {
    devices,
    isScanning,
    scanDevices,
    connectToDevice,
    disconnectDevice,
    connectionStatus,
    connectedDevice,
  } = useBluetooth();

  const renderDevice = ({ item: device }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(device.id)}
      disabled={connectionStatus === 'connecting'}
    >
      <Text style={styles.deviceName}>
        {device.name || 'Dispositivo sem nome'}
      </Text>
      <Text style={styles.deviceId}>{device.id}</Text>
    </TouchableOpacity>
  );

  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, styles.connectedText]}>
              Conectado a: {connectedDevice?.name || 'Dispositivo sem nome'}
            </Text>
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={disconnectDevice}
            >
              <Text style={styles.buttonText}>Desconectar</Text>
            </TouchableOpacity>
          </View>
        );
      case 'connecting':
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>Conectando...</Text>
            <ActivityIndicator size="small" color="#0000ff" />
          </View>
        );
      default:
        return (
          <TouchableOpacity
            style={styles.scanButton}
            onPress={scanDevices}
            disabled={isScanning}
          >
            <Text style={styles.buttonText}>
              {isScanning ? 'Procurando...' : 'Procurar Dispositivos'}
            </Text>
          </TouchableOpacity>
        );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conexão Bluetooth</Text>
      {renderConnectionStatus()}
      
      {isScanning && (
        <ActivityIndicator style={styles.spinner} size="large" color="#0000ff" />
      )}

      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(device) => device.id}
        style={styles.deviceList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {isScanning
              ? 'Procurando dispositivos...'
              : 'Nenhum dispositivo encontrado'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceList: {
    flex: 1,
  },
  deviceItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
  },
  statusContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 5,
  },
  connectedText: {
    color: '#34C759',
    fontWeight: 'bold',
  },
  spinner: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
}); 