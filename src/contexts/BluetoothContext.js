import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert, Platform, PermissionsAndroid, Linking } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const BluetoothContext = createContext(null);
let bleManager = new BleManager();

export const BluetoothProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [connectionStrength, setConnectionStrength] = useState('none');
  const [estimatedAutonomy, setEstimatedAutonomy] = useState('--');
  const [bleDevices, setBleDevices] = useState([]);
  const [bleSubscription, setBleSubscription] = useState(null);
  const [bleConnectedDevice, setBleConnectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothState, setBluetoothState] = useState('Unknown');
  const [locationPermission, setLocationPermission] = useState('unknown');

  // Monitorar estado do Bluetooth
  useEffect(() => {
    bleManager.state().then(setBluetoothState);
    const subscription = bleManager.onStateChange((state) => {
      setBluetoothState(state);
    }, true);
    return () => subscription.remove();
  }, []);

  // Checar permissão de localização
  const checkLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      setLocationPermission(granted ? 'granted' : 'denied');
      return granted;
    }
    setLocationPermission('granted');
    return true;
  };

  useEffect(() => {
    checkLocationPermission();
  }, []);

  // Função para abrir configurações do sistema
  const openBluetoothSettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    }
  };
  const openAppSettings = () => {
    Linking.openSettings();
  };

  // --- FUNÇÕES REAIS (BLE) --- //
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      const allGranted = Object.values(granted).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
      setLocationPermission(granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied');
      if (!allGranted) {
        Alert.alert(
          'Permissão Necessária',
          'O app precisa de permissão para acessar o Bluetooth e a localização. Vá em Configurações e permita o acesso.',
          [
            { text: 'Abrir Configurações', onPress: openAppSettings },
            { text: 'Cancelar', style: 'cancel' },
          ]
        );
        throw new Error('Permissões negadas');
      }
    }
  };

  const scanForDevices = async () => {
    await requestPermissions();
    if (bluetoothState !== 'PoweredOn') {
      Alert.alert(
        'Bluetooth Desligado',
        'Por favor, ative o Bluetooth do seu dispositivo para buscar dispositivos.',
        [
          { text: 'Abrir Configurações', onPress: openBluetoothSettings },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return [];
    }
    if (locationPermission !== 'granted') {
      Alert.alert(
        'Permissão de Localização',
        'O app precisa de permissão de localização para buscar dispositivos Bluetooth. Vá em Configurações e permita o acesso.',
        [
          { text: 'Abrir Configurações', onPress: openAppSettings },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return [];
    }
    setIsScanning(true);
    setBleDevices([]);
    return new Promise((resolve, reject) => {
      const found = {};
      const subscription = bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          setIsScanning(false);
          bleManager.stopDeviceScan();
          reject(error);
          return;
        }
        // Adiciona qualquer dispositivo, mesmo sem nome
        if (device) {
          found[device.id] = {
            id: device.id,
            name: device.name || device.localName || device.id || 'Dispositivo Bluetooth',
            rssi: device.rssi || -60,
            paired: false,
          };
        }
      });
      setTimeout(() => {
        bleManager.stopDeviceScan();
        setIsScanning(false);
        setBleDevices(Object.values(found));
        resolve(Object.values(found));
      }, 5000);
      setBleSubscription(subscription);
    });
  };

  const connectToDevice = async (device) => {
    setIsConnecting(true);
    try {
      const connectedDevice = await bleManager.connectToDevice(device.id);
      await connectedDevice.discoverAllServicesAndCharacteristics();
      setIsConnected(true);
      setDeviceInfo(device);
      setBleConnectedDevice(connectedDevice);
      setBatteryLevel(75); // Opcional: ler característica real se disponível
      setConnectionStrength('strong');
      setEstimatedAutonomy('2h 30m');
      Alert.alert('Sucesso', `Conectado a ${device.name || device.id}!`);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível conectar ao dispositivo.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromDevice = async () => {
    if (bleConnectedDevice) {
      try {
        await bleConnectedDevice.cancelConnection();
      } catch {}
    }
    setIsConnected(false);
    setDeviceInfo(null);
    setBleConnectedDevice(null);
    setBatteryLevel(0);
    setConnectionStrength('none');
    setEstimatedAutonomy('--');
    Alert.alert('Desconectado', 'O dispositivo foi desconectado.');
  };

  // Limpeza ao desmontar
  useEffect(() => {
    return () => {
      if (bleSubscription) bleSubscription.remove();
      if (bleManager) bleManager.destroy();
    };
  }, []);

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
        isScanning,
        devices: bleDevices,
        bluetoothState,
        locationPermission,
        openBluetoothSettings,
        openAppSettings,
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