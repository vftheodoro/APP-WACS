import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useBluetooth } from '../contexts/BluetoothContext';

export const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { connectedDevice, batteryLevel, disconnectDevice } = useBluetooth();

  const handleLogout = async () => {
    if (connectedDevice) {
      await disconnectDevice();
    }
    logout();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={100} color="#007AFF" />
        <Text style={styles.name}>{user?.name || 'Usuário'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dispositivo Conectado</Text>
        {connectedDevice ? (
          <>
            <Text style={styles.deviceName}>
              {connectedDevice.name || 'Dispositivo sem nome'}
            </Text>
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
            <TouchableOpacity
              style={[styles.button, styles.disconnectButton]}
              onPress={disconnectDevice}
            >
              <Ionicons name="bluetooth" size={24} color="#fff" />
              <Text style={styles.buttonText}>Desconectar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.noDevice}>Nenhum dispositivo conectado</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out" size={24} color="#fff" />
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  deviceName: {
    fontSize: 16,
    marginBottom: 10,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  batteryText: {
    fontSize: 16,
    marginLeft: 10,
  },
  noDevice: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
}); 