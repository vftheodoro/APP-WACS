import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useBluetooth } from '../contexts/BluetoothContext';
import { Ionicons } from '@expo/vector-icons';

export const ConnectionSettingsScreen: React.FC = () => {
  const {
    connectionStatus,
    connectedDevice,
    disconnectDevice,
    connectToDevice,
    batteryLevel,
    sendCommand,
  } = useBluetooth();

  const [isTesting, setIsTesting] = useState(false);

  const handleReconnect = async () => {
    if (connectedDevice) {
      await disconnectDevice();
      await connectToDevice(connectedDevice.id);
    }
  };

  const handleTestConnection = async () => {
    if (connectionStatus === 'connected') {
      setIsTesting(true);
      try {
        await sendCommand('TEST');
        // Aguarda 2 segundos para simular o teste
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } finally {
        setIsTesting(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações de Conexão</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Status: {connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
        </Text>
        {connectedDevice && (
          <Text style={styles.infoText}>
            Dispositivo: {connectedDevice.name || 'Dispositivo sem nome'}
          </Text>
        )}
        {batteryLevel !== null && (
          <View style={styles.batteryContainer}>
            <Ionicons
              name={batteryLevel > 20 ? 'battery-full' : 'battery-dead'}
              size={24}
              color={batteryLevel > 20 ? '#34C759' : '#FF3B30'}
            />
            <Text style={styles.batteryText}>{batteryLevel}%</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            connectionStatus !== 'connected' && styles.disabledButton,
          ]}
          onPress={handleReconnect}
          disabled={connectionStatus !== 'connected'}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
          <Text style={styles.buttonText}>Reconectar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            connectionStatus !== 'connected' && styles.disabledButton,
          ]}
          onPress={handleTestConnection}
          disabled={connectionStatus !== 'connected' || isTesting}
        >
          {isTesting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.buttonText}>Testar Conexão</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.disconnectButton,
            connectionStatus !== 'connected' && styles.disabledButton,
          ]}
          onPress={disconnectDevice}
          disabled={connectionStatus !== 'connected'}
        >
          <Ionicons name="power" size={24} color="#fff" />
          <Text style={styles.buttonText}>Desconectar</Text>
        </TouchableOpacity>
      </View>
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
  infoContainer: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  batteryText: {
    fontSize: 16,
    marginLeft: 10,
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    opacity: 0.5,
  },
}); 