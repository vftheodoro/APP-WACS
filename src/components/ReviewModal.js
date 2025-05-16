import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const accessibilityFeatures = [
  'Banheiro acessível',
  'Rampa de acesso',
  'Elevador',
  'Vaga PCD',
  'Piso tátil',
  'Atendimento prioritário',
  'Acessível para cadeirantes',
  'Cão-guia permitido',
  'Sinalização em braile',
  'Audiodescrição',
];

export default function ReviewModal({ visible, onClose, onSubmit, features = [], locationName = '', locationAddress = '' }) {
  const [comment, setComment] = useState('');
  const [featureRatings, setFeatureRatings] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setComment('');
      setFeatureRatings({});
    }
  }, [visible]);

  const handleFeatureRating = (feature, value) => {
    setFeatureRatings({ ...featureRatings, [feature]: value });
  };

  const handleSubmit = async () => {
    if (features.length > 0 && !Object.values(featureRatings).some(val => val > 0)) {
      Alert.alert('Avaliação obrigatória', 'Por favor, avalie pelo menos um recurso de acessibilidade.');
      return;
    }
    setSubmitting(true);
    await onSubmit({ comment, featureRatings });
    setSubmitting(false);
    setComment('');
    setFeatureRatings({});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Avaliar Local</Text>
          <Text style={styles.locName}>{locationName}</Text>
          <Text style={styles.locAddress}>{locationAddress}</Text>
          <Text style={styles.label}>Avalie os recursos de acessibilidade presentes:</Text>
          {features.length === 0 ? (
            <Text style={styles.noFeatures}>Nenhum recurso de acessibilidade informado para este local.</Text>
          ) : (
            features.map(feature => (
              <View key={feature} style={styles.featureRow}>
                <View style={styles.featureIconLabel}>
                  {/* Reutilize o mesmo mapeamento de ícones do AccessibilityIcons.js */}
                  {/* Você pode importar e usar o objeto featureIconMap se exportá-lo */}
                  <AccessibilityIcon feature={feature} />
                  <Text style={styles.featureLabel}>{feature}</Text>
                </View>
                <View style={styles.starsRow}>
                  {[1,2,3,4,5].map(i => (
                    <TouchableOpacity key={i} onPress={() => handleFeatureRating(feature, i)}>
                      <Ionicons name={i <= (featureRatings[feature] || 0) ? 'star' : 'star-outline'} size={24} color="#FFD700" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}
          <Text style={styles.label}>Comentário (opcional):</Text>
          <TextInput
            style={styles.input}
            placeholder="Conte sua experiência..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
          />
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Enviando...' : 'Enviar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Helper to render the icon/label for each feature, using the same mapping as AccessibilityIcons
import AccessibilityIcons from './AccessibilityIcons';
function AccessibilityIcon({ feature }) {
  // Reuse the icon mapping from AccessibilityIcons
  const featureIconMap = AccessibilityIcons.featureIconMap || {};
  const iconEntry = featureIconMap[feature];
  if (iconEntry && iconEntry.icon) return iconEntry.icon;
  return <Ionicons name="help-circle" size={22} color="#aaa" />;
}


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
  },
  label: {
    fontSize: 15,
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    minHeight: 40,
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  featureLabel: {
    fontSize: 13,
    color: '#222',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  cancelText: {
    color: '#333',
    fontWeight: 'bold',
  },
  submitBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: '#34C759',
    borderRadius: 8,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
