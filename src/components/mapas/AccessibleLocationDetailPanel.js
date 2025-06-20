import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Modal, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#1976d2',
  accent: '#43e97b',
  textSecondary: '#666',
  error: '#F44336',
  surface: '#fff',
  background: '#f8fafc',
};

const filterOptions = [
  { key: 'wheelchair', label: 'Cadeirante', icon: 'walk', color: '#4CAF50' },
  { key: 'blind', label: 'Deficiência Visual', icon: 'eye-off', color: '#FF9800' },
  { key: 'deaf', label: 'Deficiência Auditiva', icon: 'ear', color: '#9C27B0' },
  { key: 'elevator', label: 'Elevador', icon: 'swap-vertical', color: '#2196F3' },
  { key: 'parking', label: 'Estacionamento', icon: 'car', color: '#795548' },
  { key: 'restroom', label: 'Banheiro Adaptado', icon: 'body', color: '#607D8B' },
  { key: 'ramp', label: 'Rampa', icon: 'enter', color: '#F44336' },
];

function renderStars(rating = 0, size = 16, color = COLORS.accent) {
  const stars = Array(5).fill(0);
  return (
    <View style={{ flexDirection: 'row' }}>
      {stars.map((_, i) => {
        const name = i < Math.floor(rating) ? 'star' : i < rating ? 'star-half' : 'star-outline';
        return <Ionicons key={i} name={name} size={size} color={color} />;
      })}
    </View>
  );
}

function getLocationEmoji(rating) {
  if (rating === undefined || rating === null || rating === 0) return { emoji: '🆕', text: 'Novo' };
  if (rating >= 4.5) return { emoji: '⭐', text: 'Excelente' };
  if (rating >= 3.5) return { emoji: '👍', text: 'Bom' };
  if (rating >= 2.0) return { emoji: '😐', text: 'Regular' };
  return { emoji: '👎', text: 'Ruim' };
}

function getAccessibilityBorderColor(rating) {
  if (typeof rating !== 'number' || isNaN(rating) || rating === 0) return '#b0b0b0'; // cinza
  if (rating >= 4) return '#43e97b'; // verde
  if (rating >= 2.5) return '#FFEB3B'; // amarelo
  return '#F44336'; // vermelho
}

export default function AccessibleLocationDetailPanel({
  location,
  onClose,
  onViewDetails,
  userLocation,
  onStartRoute,
  loadingRoute,
  routeInfo,
  isFavorite,
  onToggleFavorite,
}) {
  const [showRouteModal, setShowRouteModal] = useState(false);

  if (!location) return null;
  const { emoji, text: emojiText } = getLocationEmoji(location.rating);
  const distance = userLocation && location.latitude && location.longitude
    ? (Math.round(
        Math.sqrt(
          Math.pow(userLocation.latitude - location.latitude, 2) +
          Math.pow(userLocation.longitude - location.longitude, 2)
        ) * 111.32 * 1000
      ) / 1000).toFixed(2) : null;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onClose}
      style={styles.overlay}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={styles.panel}
        onPress={e => e.stopPropagation && e.stopPropagation()}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>{location.name}</Text>
          <TouchableOpacity onPress={onClose} style={{ marginLeft: 8 }} accessibilityLabel="Fechar">
            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        {/* Imagem */}
        {location.imageUrl && (
          <Image source={{ uri: location.imageUrl }} style={styles.image} />
        )}
        {/* Endereço e distância */}
        <Text style={styles.address}>{location.address}</Text>
        {distance && (
          <View style={styles.distanceRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.primary} />
            <Text style={styles.distanceText}>{distance} km de distância</Text>
          </View>
        )}
        {/* Autor */}
        {location.author && (
          <View style={styles.authorRow}>
            {location.author.photoURL ? (
              <Image source={{ uri: location.author.photoURL }} style={styles.authorPhoto} />
            ) : (
              <View style={styles.authorPhotoPlaceholder}>
                <Ionicons name="person-outline" size={18} color="#666" />
              </View>
            )}
            <Text style={styles.authorText}>Adicionado por <Text style={{ fontWeight: 'bold' }}>{location.author.name || 'um usuário'}</Text></Text>
          </View>
        )}
        {/* Avaliação geral */}
        <View style={styles.ratingRow}>
          <Text style={styles.ratingScore}>{location.rating?.toFixed(1) || '-'}</Text>
          {renderStars(location.rating, 20)}
          <View style={styles.emojiTag}>
            <Text style={styles.emojiText}>{emoji}</Text>
            <Text style={styles.emojiTagText}>{emojiText}</Text>
          </View>
          <TouchableOpacity onPress={onToggleFavorite} style={{ marginLeft: 10 }}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? COLORS.error : COLORS.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.reviewCount}>{location.reviewCount ? `${location.reviewCount} avaliações` : 'Sem avaliações'}</Text>
        {/* Recursos de acessibilidade - grade destacada */}
        {location.accessibilityFeatures && location.accessibilityFeatures.length > 0 && (
          <View style={styles.accessibilityGrid}>
            {location.accessibilityFeatures.map((feature, idx) => {
              const featureData = filterOptions.find(f => f.key === feature);
              const featureRating = location.featureRatings?.[feature] || 0;
              const borderColor = getAccessibilityBorderColor(featureRating);
              return (
                <View key={idx} style={[styles.accessibilityItem, { borderColor }] }>
                  <View style={[styles.accessibilityIconCircle, { backgroundColor: (featureData?.color || COLORS.primary) + '22' }] }>
                    <Ionicons name={featureData?.icon || 'help-circle'} size={32} color={featureData?.color || COLORS.primary} />
                  </View>
                  <Text style={[styles.accessibilityLabel, { color: featureData?.color || COLORS.primary }]}>{featureData?.label || feature}</Text>
                  <View style={{ marginTop: 2 }}>
                    {featureRating > 0
                      ? renderStars(featureRating, 14, borderColor)
                      : <Ionicons name="star-outline" size={14} color="#b0b0b0" />}
                  </View>
                </View>
              );
            })}
          </View>
        )}
        {/* Botões de ação */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={onViewDetails}>
            <Ionicons name="information-circle-outline" size={22} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Ver detalhes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.routeButton} onPress={() => setShowRouteModal(true)}>
            <MaterialIcons name="directions-walk" size={22} color="#fff" />
            <Text style={styles.routeButtonText}>Traçar rota</Text>
          </TouchableOpacity>
        </View>
        {/* Modal de confirmação de rota */}
        <Modal visible={showRouteModal} animationType="slide" transparent onRequestClose={() => setShowRouteModal(false)}>
          <TouchableOpacity style={styles.routeModalOverlay} activeOpacity={1} onPress={() => setShowRouteModal(false)}>
            <View style={styles.routeModalContent}>
              <Text style={styles.sectionTitle}>Resumo da viagem</Text>
              {loadingRoute ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
              ) : routeInfo && routeInfo.distance ? (
                <>
                  <Text style={styles.routeInfoText}>Distância: <Text style={{ fontWeight: 'bold' }}>{routeInfo.distance}</Text></Text>
                  <Text style={styles.routeInfoText}>Tempo estimado: <Text style={{ fontWeight: 'bold' }}>{routeInfo.duration}</Text></Text>
                  <Text style={styles.routeInfoText}>Instrução inicial: <Text style={{ fontWeight: 'bold' }}>{routeInfo.instruction}</Text></Text>
                  <TouchableOpacity style={styles.confirmRouteButton} onPress={() => { setShowRouteModal(false); onStartRoute && onStartRoute(); }}>
                    <MaterialIcons name="play-arrow" size={22} color="#fff" />
                    <Text style={styles.confirmRouteButtonText}>Iniciar trajeto</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={{ color: COLORS.error }}>Não foi possível obter a rota.</Text>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: 200,
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 16,
    minHeight: 220,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    flex: 1,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#f1f1f1',
  },
  address: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 6,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  distanceText: {
    color: COLORS.primary,
    fontSize: 13,
    marginLeft: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorPhoto: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  authorPhotoPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  authorText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  ratingScore: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 10,
  },
  emojiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '22',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  emojiText: {
    fontSize: 16,
    marginRight: 4,
  },
  emojiTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  reviewCount: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  accessibilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  accessibilityItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    elevation: 1,
    borderWidth: 2,
    borderColor: '#b0b0b0',
  },
  accessibilityIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    backgroundColor: '#e3f2fd',
  },
  accessibilityLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 2,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    marginHorizontal: 4,
    paddingVertical: 10,
  },
  actionButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
  routeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    marginHorizontal: 4,
    paddingVertical: 12,
    elevation: 2,
  },
  routeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  routeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeModalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    elevation: 8,
  },
  routeInfoText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  confirmRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 16,
  },
  confirmRouteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
  },
}); 