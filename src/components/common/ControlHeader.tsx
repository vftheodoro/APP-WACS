import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ControlHeaderProps {
  batteryPercentage: number;
  estimatedAutonomy: string; // Ex: "2 horas", "30 min"
  connectionQuality: 'Excelente' | 'Boa' | 'Média' | 'Ruim' | 'Desconectado';
}

const ControlHeader: React.FC<ControlHeaderProps> = ({
  batteryPercentage,
  estimatedAutonomy,
  connectionQuality,
}) => {
  return (
    <View style={styles.headerContainer}>
      {/* Informações de Bateria e Autonomia */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>Bateria: {batteryPercentage}%</Text>
        <Text style={styles.infoText}>Autonomia: {estimatedAutonomy}</Text>
      </View>

      {/* Qualidade da Conexão */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>Conexão: {connectionQuality}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
  },
});

export default ControlHeader; 