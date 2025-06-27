import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MapLocationPopup = ({ visible, location, onClose, onShare, onRoute, onDetails }) => {
  if (!visible || !location) return null;
  const isAccessible = !!location.isAccessible;

  return (
    <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel="Fechar popup de local">
      <View style={styles.container} pointerEvents="box-none">
        <View style={styles.pinContainer}>
          <Ionicons name="location" size={28} color="#d32f2f" />
        </View>
        <View style={styles.popup}>
          <Text style={styles.title} numberOfLines={2}>{location.title || location.name || 'Local selecionado'}</Text>
          <Text style={styles.address} numberOfLines={2}>{location.address || location.formatted_address || 'Endereço não disponível'}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={onShare}
              activeOpacity={0.7}
              accessibilityLabel="Compartilhar local"
            >
              <Text style={styles.shareText}>Compartilhar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.routeBtn}
              onPress={isAccessible ? onDetails : onRoute}
              activeOpacity={0.7}
              accessibilityLabel={isAccessible ? 'Ver detalhes do local acessível' : 'Ver detalhes do local'}
            >
              <Text style={styles.routeText}>Detalhes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.08)',
    zIndex: 998,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    zIndex: 999,
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: -18,
    zIndex: 2,
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 260,
    maxWidth: 320,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    textAlign: 'center',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  shareBtn: {
    backgroundColor: '#f1f1f1',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  shareText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 16,
  },
  routeBtn: {
    backgroundColor: '#1976d2',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  routeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MapLocationPopup; 