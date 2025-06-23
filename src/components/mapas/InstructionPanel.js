import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * InstructionPanel - Painel superior de instrução Waze-like (tema claro)
 * Props:
 *  - distance: string (ex: '140 m')
 *  - maneuver: 'turn-left' | 'turn-right' | 'straight' | 'uturn' | ...
 *  - street: string (nome da rua)
 *  - nextInstruction: string (próxima instrução, opcional)
 *  - steps: array of objects (mock initial steps)
 */
const maneuverIcons = {
  'turn-left': 'arrow-back',
  'turn-right': 'arrow-forward',
  'straight': 'arrow-up',
  'uturn': 'return-up-back',
  'roundabout': 'sync',
  'depart': 'navigate',
  'arrive': 'flag',
};

const maneuverLabels = {
  'turn-left': { main: 'Vire à Esquerda', color: '#FF9800' },
  'turn-right': { main: 'Vire à Direita', color: '#FF9800' },
  'straight': { main: 'Siga em Frente', color: '#1976d2' },
  'uturn': { main: 'Faça o Retorno', color: '#FF9800' },
  'roundabout': { main: 'Entre na Rotatória', color: '#1976d2' },
  'depart': { main: 'Início do Trajeto', color: '#1976d2' },
  'arrive': { main: 'Chegue ao Destino', color: '#43e97b' },
};

function parseInstruction(instruction = '') {
  // Tenta separar ação e rua/destino
  // Ex: "Vire à direita na R. Itajay Leal" => ["Vire à direita", "R. Itajay Leal"]
  // Ex: "Continue em frente por 200 metros" => ["Continue em frente por 200 metros", null]
  // Ex: "Vire à esquerda" => ["Vire à esquerda", null]
  const match = instruction.match(/^(.*?)(?: na | no | em | para | até | por | sobre )([\w\s\d\-.]+)$/i);
  if (match) {
    return [match[1].trim(), match[2].trim()];
  }
  return [instruction, null];
}

export default function InstructionPanel({ distance, maneuver, street, nextInstruction, steps = [] }) {
  const [modalVisible, setModalVisible] = useState(false);
  // Parse ação e rua
  const [action, road] = parseInstruction(street);
  const label = maneuverLabels[maneuver] || { main: action, color: '#1976d2' };
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setModalVisible(true)}
        style={styles.container}
        accessibilityRole="header"
        accessibilityLabel={`Em ${distance}, ${label.main} ${road ? 'na ' + road : ''}`}
      >
        <View style={[styles.iconBoxOuter, { backgroundColor: label.color + '22' }]}>
          <View style={[styles.iconBox, { backgroundColor: label.color }] }>
            <Ionicons name={maneuverIcons[maneuver] || 'navigate'} size={40} color="#fff" />
          </View>
        </View>
        <View style={styles.infoBox}>
          <View style={styles.row}>
            <Ionicons name="location" size={18} color="#1976d2" style={{ marginRight: 4 }} />
            <Text style={styles.distance}>{distance}</Text>
          </View>
          <Text style={[styles.main, { color: label.color }]}>{label.main}</Text>
          {road && <Text style={styles.road}>{road}</Text>}
          {nextInstruction ? (
            <Text style={styles.next}>{'e então ' + nextInstruction}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
      {/* Modal de próximos passos */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Próximos passos da rota</Text>
            <Text style={styles.modalTip}>Siga as instruções abaixo para chegar ao destino.</Text>
            <ScrollView style={{ maxHeight: 340 }}>
              {steps && steps.length > 0 ? (
                <>
                  {steps.slice(0, 8).map((step, idx) => {
                    const [action, road] = parseInstruction(step.instruction);
                    const label = maneuverLabels[step.maneuver] || { main: action, color: '#1976d2' };
                    return (
                      <View key={idx} style={styles.stepCard}>
                        <View style={[styles.stepIconBox, { backgroundColor: label.color + '22' }] }>
                          <Ionicons name={maneuverIcons[step.maneuver] || 'navigate'} size={30} color={label.color} />
                        </View>
                        <View style={styles.stepInfoBox}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[styles.stepNum, { color: label.color }]}>{idx + 1}.</Text>
                            <Text style={styles.stepDistance}>{step.distance}</Text>
                          </View>
                          <Text style={[styles.stepMain, { color: label.color }]}>{label.main}</Text>
                          {road && <Text style={styles.stepRoad}>{road}</Text>}
                        </View>
                      </View>
                    );
                  })}
                  {/* Passo final: Chegue ao Destino */}
                  <View style={styles.stepCard}>
                    <View style={[styles.stepIconBox, { backgroundColor: '#43e97b22' }] }>
                      <Ionicons name={maneuverIcons['arrive']} size={30} color={'#43e97b'} />
                    </View>
                    <View style={styles.stepInfoBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.stepNum, { color: '#43e97b' }]}>{steps.slice(0, 8).length + 1}.</Text>
                        <Text style={styles.stepDistance}></Text>
                      </View>
                      <Text style={[styles.stepMain, { color: '#43e97b' }]}>Chegue ao Destino</Text>
                    </View>
                  </View>
                </>
              ) : <Text style={{ color: '#666' }}>Sem dados de rota.</Text>}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#1976d2" />
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginTop: 8,
    marginHorizontal: 4,
    paddingVertical: 13,
    paddingHorizontal: 16,
    elevation: 6,
    shadowColor: '#1976d2',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    borderWidth: 1.2,
    borderColor: '#e3eaf2',
    minHeight: 64,
    maxHeight: 90,
  },
  iconBoxOuter: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#e3eaf2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flex: 1,
    minWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  distance: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1976d2',
    marginRight: 10,
    letterSpacing: 0.2,
    minWidth: 48,
  },
  main: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
    letterSpacing: 0.1,
    maxWidth: '100%',
  },
  support: {
    fontSize: 13,
    color: '#1976d2',
    fontWeight: '500',
    marginTop: -2,
    marginBottom: 2,
  },
  road: {
    fontSize: 15,
    color: '#1976d2',
    fontWeight: '500',
    maxWidth: '100%',
  },
  next: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginTop: 2,
    flexShrink: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    width: '90%',
    maxWidth: 420,
    elevation: 8,
    shadowColor: '#1976d2',
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7faff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#1976d2',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e3eaf2',
  },
  stepIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3eaf2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepInfoBox: {
    flex: 1,
    minWidth: 0,
  },
  stepNum: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  stepMain: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1976d2',
    letterSpacing: 0.1,
    maxWidth: '70%',
  },
  stepSupport: {
    fontSize: 13,
    color: '#1976d2',
    fontWeight: '500',
    marginTop: -2,
    marginBottom: 2,
  },
  stepRoad: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
    marginTop: 1,
    maxWidth: '100%',
  },
  stepDistance: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#e3eaf2',
  },
  closeBtnText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  modalTip: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
}); 