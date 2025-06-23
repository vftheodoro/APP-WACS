import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const COLORS = {
  primary: '#1976d2',
  text: '#333',
};

export default function RouteConfirmationPanel({ visible, onCancel, onConfirm }) {
  if (!visible) return null;
  return (
    <View style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 24,
      backgroundColor: '#fff',
      borderRadius: 16,
      marginHorizontal: 18,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      elevation: 8,
      shadowColor: '#000',
      shadowOpacity: 0.13,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      zIndex: 999,
    }}>
      <Text style={{ fontSize: 16, color: COLORS.text, flex: 1 }}>
        Deseja ver os detalhes da rota para este destino?
      </Text>
      <TouchableOpacity
        onPress={onCancel}
        style={{ marginLeft: 12, padding: 8, borderRadius: 8, backgroundColor: '#eee' }}
        accessibilityLabel="Cancelar"
      >
        <Text style={{ color: '#666', fontWeight: 'bold' }}>Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onConfirm}
        style={{ marginLeft: 8, padding: 8, borderRadius: 8, backgroundColor: COLORS.primary }}
        accessibilityLabel="Ver detalhes"
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Ver detalhes</Text>
      </TouchableOpacity>
    </View>
  );
} 