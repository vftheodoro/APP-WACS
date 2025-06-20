import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const COLORS = {
  primary: '#1976d2',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#666666',
  border: '#e0e0e0',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800',
};

const MAX_COMMENT_LENGTH = 500;

// Função para obter ícone e nome amigável para cada recurso
const getFeatureData = (featureKey) => {
  const featureMap = {
    'wheelchair': { icon: 'walk-outline', name: 'Cadeirante' },
    'blind': { icon: 'eye-off-outline', name: 'Def. Visual' },
    'deaf': { icon: 'ear-outline', name: 'Def. Auditiva' },
    'elevator': { icon: 'swap-vertical-outline', name: 'Elevador' },
    'parking': { icon: 'car-outline', name: 'Estacionamento' },
    'restroom': { icon: 'body-outline', name: 'Banheiro Adapt.' },
    'ramp': { icon: 'enter-outline', name: 'Rampa' },
    // Mapeamento para retrocompatibilidade
    'Acessível para cadeirantes': { icon: 'walk-outline', name: 'Cadeirante' },
    'Piso tátil': { icon: 'analytics-outline', name: 'Piso Tátil' },
    'Rampa de acesso': { icon: 'enter-outline', name: 'Rampa' },
    'Banheiro acessível': { icon: 'body-outline', name: 'Banheiro' },
    'Vaga PCD': { icon: 'car-outline', name: 'Vaga PCD' },
    'Atendimento prioritário': { icon: 'people-outline', name: 'Atendimento' },
    'Cão-guia permitido': { icon: 'paw-outline', name: 'Cão-Guia' },
    'Sinalização em braile': { icon: 'bookmarks-outline', name: 'Braile' },
  };
  return featureMap[featureKey] || { icon: 'help-circle-outline', name: featureKey };
};

const getLocationEmoji = (rating) => {
  if (!rating || rating === 0) return { emoji: '🤔', text: 'Avalie' };
  if (rating >= 4.5) return { emoji: '⭐', text: 'Excelente' };
  if (rating >= 3.5) return { emoji: '👍', text: 'Bom' };
  if (rating >= 2.0) return { emoji: '😐', text: 'Regular' };
  return { emoji: '👎', text: 'Ruim' };
};

const getRatingColor = (rating) => {
  if (!rating || rating === 0) return COLORS.textSecondary;
  if (rating >= 4.5) return COLORS.success;
  if (rating >= 3.5) return COLORS.warning;
  if (rating >= 2.0) return '#FFC107'; // Amarelo
  return COLORS.error;
};

export default function ReviewModal({ visible, onClose, onSubmit, features = [], locationName = '', locationAddress = '' }) {
  const [comment, setComment] = useState('');
  const [featureRatings, setFeatureRatings] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Calcula a média das avaliações em tempo real
  const calculatedRating = useMemo(() => {
    const ratings = Object.values(featureRatings);
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, curr) => acc + curr, 0);
    return sum / ratings.length;
  }, [featureRatings]);

  useEffect(() => {
    if (!visible) {
      setComment('');
      setFeatureRatings({});
    }
  }, [visible]);

  const handleRatingPress = (featureKey, value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeatureRatings(prev => ({...prev, [featureKey]: value}));
  };

  const handleSubmit = async () => {
    if (Object.keys(featureRatings).length < features.length || Object.keys(featureRatings).length === 0) {
      Alert.alert('Avaliação Incompleta', 'Por favor, avalie todos os recursos de acessibilidade listados.');
      return;
    }
    
    setSubmitting(true);
    try {
      await onSubmit({ rating: calculatedRating, comment, featureRatings });
      onClose();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar sua avaliação. Tente novamente.');
    } finally {
    setSubmitting(false);
    }
  };

  const renderStars = (currentRating, onRate, size = 28) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => onRate(i)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={i <= currentRating ? 'star' : 'star-outline'} size={size} color={getRatingColor(i <= currentRating ? i : 0)} />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onClose(); }}>
      <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <Text style={styles.title} numberOfLines={1}>Avaliar {locationName}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close-circle" size={30} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {features.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Avalie cada recurso do local</Text>
                    {features.map(featureKey => {
                      const featureData = getFeatureData(featureKey);
                      return (
                        <View key={featureKey} style={styles.featureRow}>
                          <View style={styles.featureInfo}>
                            <Ionicons name={featureData.icon} size={24} color={COLORS.primary} />
                            <Text style={styles.featureLabel}>{featureData.name}</Text>
                          </View>
                          {renderStars(featureRatings[featureKey] || 0, (value) => handleRatingPress(featureKey, value))}
                        </View>
                      );
                    })}
            </View>
                ) : (
                    <Text style={styles.noFeaturesText}>Este local não possui recursos de acessibilidade cadastrados para avaliar.</Text>
                )}

                {/* Resultado da Avaliação */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resultado da sua avaliação</Text>
                    <View style={[styles.summaryContainer, {borderColor: getRatingColor(calculatedRating)}]}>
                        <Text style={[styles.summaryRatingValue, {color: getRatingColor(calculatedRating)}]}>
                            {calculatedRating > 0 ? calculatedRating.toFixed(1) : '-'}
            </Text>
                        <View style={styles.summaryDetails}>
                            {renderStars(calculatedRating, () => {}, 24)}
                            <View style={styles.summaryEmojiContainer}>
                                <Text style={styles.summaryEmoji}>{getLocationEmoji(calculatedRating).emoji}</Text>
                                <Text style={styles.summaryText}>{getLocationEmoji(calculatedRating).text}</Text>
                            </View>
          </View>
                </View>
                </View>

                {/* Comentário */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Comentário (opcional)</Text>
                  <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
                      placeholder="Compartilhe sua experiência no local..."
            value={comment}
            onChangeText={setComment}
            multiline
                      maxLength={MAX_COMMENT_LENGTH}
                    />
                    {comment.length > 0 && (
                      <TouchableOpacity onPress={() => setComment('')} style={styles.clearInputButton}>
                        <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.charCounter}>{comment.length} / {MAX_COMMENT_LENGTH}</Text>
                </View>
              </ScrollView>

              {/* Botões de Ação */}
          <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={submitting}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Enviar Avaliação</Text>
                  )}
            </TouchableOpacity>
          </View>
        </View>
          </TouchableWithoutFeedback>
      </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  featureRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  featureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 16 : 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    paddingRight: 40,
  },
  clearInputButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 5,
  },
  charCounter: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryRatingValue: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  summaryDetails: {
    alignItems: 'flex-start',
  },
  summaryEmojiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  summaryEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  noFeaturesText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 15,
    padding: 20,
    lineHeight: 22,
  },
});
