import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Slider,
} from 'react-native';
import { useBluetooth } from '../contexts/BluetoothContext';
import { Ionicons } from '@expo/vector-icons';

export const MovementControlScreen: React.FC = () => {
  const { sendCommand, connectionStatus } = useBluetooth();
  const [speed, setSpeed] = useState(50);
  const [currentMovement, setCurrentMovement] = useState<string | null>(null);

  const handleMovement = async (direction: string) => {
    if (connectionStatus !== 'connected') {
      return;
    }

    const command = `${direction}:${speed}`;
    setCurrentMovement(direction);
    await sendCommand(command);
  };

  const handleStop = async () => {
    if (connectionStatus !== 'connected') {
      return;
    }

    await sendCommand('STOP');
    setCurrentMovement(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Controle de Movimento</Text>

      <View style={styles.speedContainer}>
        <Text style={styles.speedText}>Velocidade: {Math.round(speed)}%</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          value={speed}
          onValueChange={setSpeed}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#000000"
        />
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              currentMovement === 'FORWARD' && styles.activeButton,
            ]}
            onPress={() => handleMovement('FORWARD')}
            disabled={connectionStatus !== 'connected'}
          >
            <Ionicons name="arrow-up" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              currentMovement === 'LEFT' && styles.activeButton,
            ]}
            onPress={() => handleMovement('LEFT')}
            disabled={connectionStatus !== 'connected'}
          >
            <Ionicons name="arrow-back" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stopButton]}
            onPress={handleStop}
            disabled={connectionStatus !== 'connected'}
          >
            <Ionicons name="stop" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              currentMovement === 'RIGHT' && styles.activeButton,
            ]}
            onPress={() => handleMovement('RIGHT')}
            disabled={connectionStatus !== 'connected'}
          >
            <Ionicons name="arrow-forward" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              currentMovement === 'BACKWARD' && styles.activeButton,
            ]}
            onPress={() => handleMovement('BACKWARD')}
            disabled={connectionStatus !== 'connected'}
          >
            <Ionicons name="arrow-down" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status:{' '}
          {connectionStatus !== 'connected'
            ? 'Desconectado'
            : currentMovement
            ? `Em movimento: ${currentMovement}`
            : 'Parado'}
        </Text>
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
  speedContainer: {
    marginBottom: 30,
  },
  speedText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  controlsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  controlButton: {
    width: 80,
    height: 80,
    backgroundColor: '#007AFF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  stopButton: {
    width: 80,
    height: 80,
    backgroundColor: '#FF3B30',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
  },
  activeButton: {
    backgroundColor: '#34C759',
  },
  statusContainer: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginTop: 20,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 