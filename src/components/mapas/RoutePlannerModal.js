import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, Dimensions, Clipboard, Alert, Linking } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

// Mock de elevação (em metros) e acessibilidade por passo
function getElevationMock(steps) {
  if (!steps || steps.length === 0) return { total: 0, warnings: [], points: [] };
  let total = 0;
  let warnings = [];
  let points = [];
  let current = 10;
  steps.forEach((step, i) => {
    if (i === 2) {
      current += 2;
      total += 2;
      warnings.push({ type: 'stairs', index: i });
    } else if (i === 4) {
      current += 1;
      total += 1;
      warnings.push({ type: 'ramp', index: i });
    } else {
      current += 0.2;
      total += 0.2;
    }
    points.push(current);
  });
  return { total, warnings, points };
}

function getStepIcon(step, warning) {
  if (warning?.type === 'stairs') return <MaterialCommunityIcons name="stairs" size={22} color="#F44336" style={{ marginRight: 8 }} />;
  if (warning?.type === 'ramp') return <MaterialIcons name="accessible" size={24} color="#43e97b" style={{ marginRight: 8 }} />;
  switch (step.maneuver) {
    case 'turn-right': return <MaterialIcons name="turn-right" size={24} color="#1976d2" style={{ marginRight: 8 }} />;
    case 'turn-left': return <MaterialIcons name="turn-left" size={24} color="#1976d2" style={{ marginRight: 8 }} />;
    case 'straight': return <MaterialIcons name="arrow-upward" size={24} color="#1976d2" style={{ marginRight: 8 }} />;
    default: return <MaterialIcons name="directions" size={22} color="#1976d2" style={{ marginRight: 8 }} />;
  }
}

function getAccessibilityBadge(warnings) {
  if (!warnings.length) return (
    <View style={styles.badgeAccessible}>
      <MaterialIcons name="accessible" size={18} color="#fff" />
      <Text style={styles.badgeText}>Acessível</Text>
    </View>
  );
  if (warnings.some(w => w.type === 'stairs')) return (
    <View style={styles.badgeWarning}>
      <MaterialCommunityIcons name="stairs" size={18} color="#fff" />
      <Text style={styles.badgeText}>Atenção: Escadas</Text>
    </View>
  );
  if (warnings.some(w => w.type === 'ramp')) return (
    <View style={styles.badgePartial}>
      <MaterialIcons name="accessible" size={18} color="#fff" />
      <Text style={styles.badgeText}>Parcialmente acessível</Text>
    </View>
  );
  return null;
}

function ElevationChart({ points }) {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const chartHeight = 36;
  return (
    <View style={styles.elevationChart}>
      {points.map((p, i) => (
        <View
          key={i}
          style={{
            width: 8,
            height: ((p - min) / (max - min + 0.1)) * chartHeight + 4,
            backgroundColor: '#1976d2',
            marginRight: 2,
            borderRadius: 2,
          }}
        />
      ))}
    </View>
  );
}

// IA aprimorada: não sugere trocar de rota, só informa qualidade
function analyzeRouteIA(steps, elevation) {
  if (!steps || steps.length === 0) return { opinion: 'Não foi possível analisar a rota.', color: '#888', icon: 'help-circle' };
  const stairs = elevation.warnings.filter(w => w.type === 'stairs').length;
  const ramps = elevation.warnings.filter(w => w.type === 'ramp').length;
  const maxElev = Math.max(...elevation.points, 0);
  const minElev = Math.min(...elevation.points, 0);
  const elevDiff = maxElev - minElev;
  if (stairs > 0) {
    return {
      opinion: 'Esta rota possui escadas e subidas íngremes. Pode ser difícil para cadeirantes ou pessoas com mobilidade reduzida.',
      color: '#F44336',
      icon: 'stairs',
    };
  }
  if (ramps > 0 || elevDiff > 3) {
    return {
      opinion: 'Esta rota possui rampas ou subidas. Exige atenção, mas pode ser possível para cadeirantes.',
      color: '#FFC107',
      icon: 'accessible',
    };
  }
  return {
    opinion: 'Esta rota é plana e muito acessível!',
    color: '#43e97b',
    icon: 'accessible',
  };
}

// Função para explicar elevação de forma leiga
function getElevationDescription(elevation) {
  if (!elevation || !elevation.points || elevation.points.length < 2) return 'Sem dados de elevação.';
  const maxElev = Math.max(...elevation.points, 0);
  const minElev = Math.min(...elevation.points, 0);
  const elevDiff = maxElev - minElev;
  if (elevation.warnings.some(w => w.type === 'stairs')) {
    return 'Trajeto com subidas íngremes ou escadas.';
  }
  if (elevation.warnings.some(w => w.type === 'ramp') || elevDiff > 3) {
    return 'Trajeto com algumas subidas leves.';
  }
  if (elevDiff < 1) {
    return 'Trajeto praticamente plano.';
  }
  return 'Trajeto com pequenas variações de elevação.';
}

export default function RoutePlannerModal({
  visible,
  onClose,
  onStart,
  onShare,
  info,
  steps,
  loading,
  error,
  routeCoords,
  origin,
  destination,
}) {
  const [showInstructions, setShowInstructions] = useState(false);
  const elevation = getElevationMock(steps);
  const ia = analyzeRouteIA(steps, elevation);

  // Função utilitária para formatar coordenadas
  function formatCoords(obj) {
    if (!obj || typeof obj.latitude !== 'number' || typeof obj.longitude !== 'number') return '';
    return `Lat: ${obj.latitude.toFixed(5)}, Lng: ${obj.longitude.toFixed(5)}`;
  }

  // Endereço do destino (ordem de prioridade)
  let destLabel = info?.end_address;
  if (!destLabel && destination && destination.address) destLabel = destination.address;
  if (!destLabel && destination && destination.name) destLabel = destination.name;
  if (!destLabel && destination && typeof destination.latitude === 'number' && typeof destination.longitude === 'number') destLabel = formatCoords(destination);
  if (!destLabel || destLabel.trim() === '') destLabel = 'Destino não identificado';

  // Endereço da origem (ordem de prioridade)
  let originLabel = info?.start_address;
  if (!originLabel && origin && origin.address) originLabel = origin.address;
  if (!originLabel && origin && typeof origin.latitude === 'number' && typeof origin.longitude === 'number') originLabel = 'Sua localização atual';
  if (!originLabel) originLabel = 'Sua localização atual';

  const handleCopy = (text) => {
    Clipboard.setString(text);
    Alert.alert('Copiado!', 'Endereço copiado para a área de transferência.');
  };

  // Função para gerar segmentos coloridos da rota conforme elevação
  function getColoredSegments(coords, elevationPoints) {
    if (!coords || coords.length < 2 || !elevationPoints || elevationPoints.length < 2) return [];
    const segments = [];
    for (let i = 0; i < coords.length - 1; i++) {
      let color = '#43e97b'; // verde padrão
      const elevDiff = elevationPoints[i + 1] - elevationPoints[i];
      if (elevDiff > 1.2) color = '#F44336'; // vermelho: subida forte/escada
      else if (elevDiff > 0.5) color = '#FFC107'; // amarelo: subida leve
      segments.push({
        coords: [coords[i], coords[i + 1]],
        color,
      });
    }
    return segments;
  }
  const coloredSegments = getColoredSegments(routeCoords, elevation.points);

  // Miniatura: centralizar e ajustar zoom para rotas curtas
  function getMiniMapRegion(coords) {
    if (!coords || coords.length === 0) return undefined;
    let minLat = coords[0].latitude, maxLat = coords[0].latitude;
    let minLng = coords[0].longitude, maxLng = coords[0].longitude;
    coords.forEach(p => {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    });
    // Padding mínimo para rotas curtas
    const minDelta = 0.005;
    const latDelta = Math.max(minDelta, (maxLat - minLat) * 1.7);
    const lngDelta = Math.max(minDelta, (maxLng - minLng) * 1.7);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }
  const miniMapRegion = getMiniMapRegion(routeCoords);

  // Cores do tema
  const COLORS = {
    primary: '#1976d2',
    accent: '#43e97b',
    warning: '#FFC107',
    danger: '#F44336',
    background: '#f8fafc',
    surface: '#fff',
    text: '#222',
    textSecondary: '#666',
    border: '#e0e0e0',
    info: '#2196f3',
    shadow: '#000',
  };

  // Estilo do alerta IA
  const iaBg = ia.color === COLORS.danger ? '#fdeaea' : ia.color === COLORS.warning ? '#fff8e1' : '#e7fbe9';
  const iaText = ia.color;

  // Verificação de coordenadas válidas
  const hasValidOrigin = origin && typeof origin.latitude === 'number' && typeof origin.longitude === 'number';
  const hasValidDest = destination && typeof destination.latitude === 'number' && typeof destination.longitude === 'number';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Título */}
          <View style={styles.header}>
            <Text style={styles.title}>Detalhes da Rota</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Fechar">
              <Ionicons name="close" size={28} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          {/* Miniatura do mapa */}
          <View style={styles.mapContainer}>
            {hasValidOrigin && hasValidDest ? (
              <MapView
                style={styles.miniMap}
                initialRegion={miniMapRegion}
                pointerEvents="none"
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                <Marker coordinate={origin} pinColor={COLORS.info} />
                <Marker coordinate={destination} pinColor={COLORS.primary} />
                {coloredSegments.map((seg, idx) => (
                  <Polyline
                    key={idx}
                    coordinates={seg.coords}
                    strokeWidth={4}
                    strokeColor={seg.color}
                  />
                ))}
              </MapView>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                <Text style={{ color: COLORS.textSecondary, fontSize: 15, textAlign: 'center' }}>Destino não definido ou inválido.</Text>
              </View>
            )}
          </View>
          {/* Origem */}
          <View style={styles.destRow}>
            <MaterialIcons name="my-location" size={20} color={COLORS.info} style={{ marginRight: 4 }} />
            <Text style={styles.destLabel}>Origem:</Text>
            <Text style={styles.destValue}>{originLabel}</Text>
          </View>
          {/* Destino */}
          <View style={styles.destRow}>
            <MaterialIcons name="location-on" size={22} color={COLORS.accent} style={{ marginRight: 4 }} />
            <Text style={styles.destLabel}>Destino:</Text>
            <Text style={styles.destValue}>{destLabel}</Text>
            <TouchableOpacity onPress={() => handleCopy(destLabel)} style={styles.copyButton} accessibilityLabel="Copiar endereço">
              <Ionicons name="copy" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          {/* Alerta IA */}
          <View style={[styles.iaBox, { backgroundColor: iaBg }]}> 
            <MaterialCommunityIcons name={ia.icon} size={22} color={iaText} style={{ marginRight: 10 }} />
            <Text style={{ color: iaText, fontWeight: 'bold', fontSize: 15, flex: 1 }}>{ia.opinion}</Text>
          </View>
          {/* Resumo da rota */}
          {loading ? (
            <View style={{ alignItems: 'center', marginVertical: 18 }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={{ marginTop: 10, color: COLORS.primary }}>Calculando rota...</Text>
            </View>
          ) : error ? (
            <View style={{ alignItems: 'center', marginVertical: 18 }}>
              <Ionicons name="alert-circle" size={36} color={COLORS.danger} />
              <Text style={{ color: COLORS.danger, marginTop: 8, fontWeight: 'bold', fontSize: 16 }}>{error}</Text>
            </View>
          ) : (
            <>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <MaterialIcons name="directions-walk" size={20} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.infoLabel}>Distância:</Text>
                  <Text style={styles.infoValue}>{info.distance}</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialIcons name="schedule" size={20} color={COLORS.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.infoLabel}>Tempo:</Text>
                  <Text style={styles.infoValue}>{info.duration}</Text>
                </View>
              </View>
              <View style={styles.elevationRow}>
                <MaterialIcons name="terrain" size={20} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.elevationLabel}>Elevação:</Text>
                <Text style={styles.elevationValue}>{elevation.total.toFixed(1)}m</Text>
                <Text style={styles.elevationDesc}> — {getElevationDescription(elevation)}</Text>
              </View>
              {/* Botão para expandir instruções */}
              <TouchableOpacity
                style={[styles.expandButton, showInstructions && styles.expandButtonActive]}
                onPress={() => setShowInstructions(v => !v)}
                activeOpacity={0.85}
                accessibilityLabel={showInstructions ? 'Ocultar instruções' : 'Ver instruções detalhadas'}
              >
                <Ionicons
                  name={showInstructions ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.primary}
                  style={{ transform: [{ rotate: showInstructions ? '180deg' : '0deg' }] }}
                />
                <Text style={styles.expandButtonText}>{showInstructions ? 'Ocultar instruções' : 'Ver instruções detalhadas'}</Text>
              </TouchableOpacity>
              {showInstructions && (
                <>
                  <Text style={styles.sectionTitle}>Instruções</Text>
                  <FlatList
                    data={steps}
                    keyExtractor={(_, i) => i.toString()}
                    renderItem={({ item, index }) => {
                      const warning = elevation.warnings.find(w => w.index === index);
                      return (
                        <View style={styles.stepItem}>
                          {getStepIcon(item, warning)}
                          <Text style={styles.stepIndex}>{index + 1}.</Text>
                          <Text style={styles.stepInstruction}>{item.instruction}</Text>
                          <Text style={styles.stepDistance}>{item.distance}</Text>
                        </View>
                      );
                    }}
                    style={{ maxHeight: 180, marginBottom: 10 }}
                  />
                </>
              )}
            </>
          )}
          {/* Botões */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onStart}
              disabled={loading || !!error}
              activeOpacity={0.85}
              accessibilityLabel="Iniciar navegação"
            >
              <MaterialIcons name="play-arrow" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Iniciar navegação</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onShare}
              activeOpacity={0.85}
              accessibilityLabel="Compartilhar rota"
            >
              <Ionicons name="share-social" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '94%',
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 22,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#1976d2',
    letterSpacing: 0.2,
  },
  closeButton: {
    padding: 4,
    borderRadius: 16,
  },
  mapContainer: {
    width: '100%',
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  miniMap: {
    flex: 1,
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 2,
  },
  destLabel: {
    fontWeight: 'bold',
    color: '#1976d2',
    marginLeft: 2,
    fontSize: 15,
  },
  destValue: {
    color: '#222',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
    flexShrink: 1,
  },
  copyButton: {
    marginLeft: 6,
    padding: 4,
    borderRadius: 8,
  },
  iaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    marginTop: 2,
    minHeight: 48,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  infoLabel: {
    color: '#666',
    fontSize: 14,
    marginLeft: 2,
  },
  infoValue: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 4,
  },
  elevationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 2,
    flexWrap: 'wrap',
  },
  elevationLabel: {
    color: '#666',
    fontSize: 14,
    marginLeft: 2,
  },
  elevationValue: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 4,
  },
  elevationDesc: {
    color: '#888',
    fontSize: 13,
    marginLeft: 6,
    fontStyle: 'italic',
    flexShrink: 1,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 2,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#e3f2fd',
    gap: 4,
    elevation: 1,
  },
  expandButtonActive: {
    backgroundColor: '#bbdefb',
  },
  expandButtonText: {
    color: '#1976d2',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#1976d2',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 2,
  },
  stepIndex: {
    fontWeight: 'bold',
    color: '#1976d2',
    marginRight: 6,
    fontSize: 15,
  },
  stepInstruction: {
    flex: 1,
    color: '#333',
    fontSize: 15,
  },
  stepDistance: {
    color: '#888',
    fontSize: 13,
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 22,
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
    elevation: 2,
    shadowColor: '#1976d2',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
    letterSpacing: 0.2,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
}); 