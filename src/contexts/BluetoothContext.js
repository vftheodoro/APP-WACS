import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';

// Simulação de dispositivos Bluetooth
const MOCK_DEVICES = [
  { id: '1', name: 'Wheelchair-001', rssi: -45, paired: true },
  { id: '2', name: 'Wheelchair-002', rssi: -65, paired: false },
  { id: '3', name: 'Wheelchair-003', rssi: -75, paired: false },
];

const BluetoothContext = createContext(null);

export const BluetoothProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [connectionStrength, setConnectionStrength] = useState('none');
  const [estimatedAutonomy, setEstimatedAutonomy] = useState('--');

  // TODO: Implementar lógica real de conexão Bluetooth aqui usando expo-bluetooth ou similar

  const connectToDevice = async (device) => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setDeviceInfo(device);

    // Simulação de conexão
    console.log(`Simulando conexão com ${device.name}...`);
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
      // Simular informações do dispositivo conectado
      setBatteryLevel(75);
      setConnectionStrength('strong');
      setEstimatedAutonomy('2h 30m');
      Alert.alert('Sucesso', `Conectado a ${device.name}!`);
    }, 2000);
  };

  const disconnectFromDevice = async () => {
    if (!isConnected) return;

    setIsConnecting(false); // Pode ser útil para mostrar um estado de desconectando
    console.log(`Simulando desconexão de ${deviceInfo?.name}...`);

    // Simulação de desconexão
    setTimeout(() => {
      setIsConnected(false);
      setDeviceInfo(null);
      setBatteryLevel(0);
      setConnectionStrength('none');
      setEstimatedAutonomy('--');
      Alert.alert('Desconectado', 'A cadeira de rodas foi desconectada.');
    }, 1000);
  };

  // Função simulada para buscar dispositivos (usada na tela de conexão)
  const scanForDevices = async () => {
      // Em uma implementação real, usaria Bluetooth.startScanningAsync
      console.log('Simulando busca por dispositivos...');
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(MOCK_DEVICES);
        }, 1500);
      });
  };

  // TODO: Adicionar listeners para status de conexão, bateria, etc. reais do Bluetooth
  // useEffect para limpar a conexão ao desmontar o Provider (opcional, mas boa prática)

  return (
    <BluetoothContext.Provider
      value={{
        isConnected,
        isConnecting,
        deviceInfo,
        batteryLevel,
        connectionStrength,
        estimatedAutonomy,
        connectToDevice,
        disconnectFromDevice,
        scanForDevices,
      }}
    >
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = () => {
  const context = useContext(BluetoothContext);
  if (context === undefined) {
    throw new Error('useBluetooth must be used within a BluetoothProvider');
  }
  return context;
}; 