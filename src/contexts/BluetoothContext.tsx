import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

interface BluetoothDevice {
  id: string;
  name: string | null;
}

interface BluetoothContextData {
  devices: BluetoothDevice[];
  connectedDevice: BluetoothDevice | null;
  isScanning: boolean;
  batteryLevel: number | null;
  scanDevices: () => void;
  connectToDevice: (deviceId: string) => Promise<void>;
  disconnectDevice: () => Promise<void>;
  sendCommand: (command: string) => Promise<void>;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

const BluetoothContext = createContext<BluetoothContextData>({} as BluetoothContextData);

export const BluetoothProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // Função simulada para escanear dispositivos
  const scanDevices = async () => {
    if (!isScanning) {
      setIsScanning(true);
      setDevices([]);

      // Simula a descoberta de dispositivos
      setTimeout(() => {
        const mockDevices: BluetoothDevice[] = [
          { id: '1', name: 'Arduino Uno' },
          { id: '2', name: 'HC-05' },
          { id: '3', name: 'BT Module' },
        ];
        setDevices(mockDevices);
        setIsScanning(false);
      }, 2000);
    }
  };

  // Função simulada para conectar ao dispositivo
  const connectToDevice = async (deviceId: string) => {
    try {
      setConnectionStatus('connecting');
      
      // Simula o processo de conexão
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const device = devices.find(d => d.id === deviceId);
      if (device) {
        setConnectedDevice(device);
        setConnectionStatus('connected');
        setBatteryLevel(85); // Simula nível de bateria
      } else {
        throw new Error('Dispositivo não encontrado');
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      setConnectionStatus('disconnected');
    }
  };

  // Função simulada para desconectar
  const disconnectDevice = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setConnectedDevice(null);
      setConnectionStatus('disconnected');
      setBatteryLevel(null);
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  // Função simulada para enviar comandos
  const sendCommand = async (command: string) => {
    try {
      if (connectionStatus === 'connected' && connectedDevice) {
        console.log('Comando enviado:', command);
        // Aqui você implementaria a lógica real de envio de comando
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        throw new Error('Dispositivo não conectado');
      }
    } catch (error) {
      console.error('Erro ao enviar comando:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Verifica se o dispositivo suporta Bluetooth
    const checkBluetoothSupport = async () => {
      if (Platform.OS !== 'web') {
        const deviceType = await Device.getDeviceTypeAsync();
        console.log('Tipo de dispositivo:', deviceType);
      }
    };

    checkBluetoothSupport();
  }, []);

  return (
    <BluetoothContext.Provider
      value={{
        devices,
        connectedDevice,
        isScanning,
        batteryLevel,
        scanDevices,
        connectToDevice,
        disconnectDevice,
        sendCommand,
        connectionStatus,
      }}
    >
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = () => {
  const context = useContext(BluetoothContext);
  if (!context) {
    throw new Error('useBluetooth must be used within a BluetoothProvider');
  }
  return context;
}; 