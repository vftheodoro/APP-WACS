import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// Map accessibility feature names to icons and labels
const featureIconMap = {
  'restroom': {
    icon: <MaterialCommunityIcons name="toilet" size={22} color="#1c7f4c" />, label: 'Banheiro acessível',
  },
  'ramp': {
    icon: <MaterialCommunityIcons name="stairs-up" size={22} color="#1c7f4c" />, label: 'Rampa de acesso',
  },
  'Elevador': {
    icon: <MaterialCommunityIcons name="elevator" size={22} color="#1c7f4c" />, label: 'Elevador',
  },
  'parking': {
    icon: <MaterialCommunityIcons name="parking" size={22} color="#1c7f4c" />, label: 'Vaga PCD',
  },
  'blind': {
    icon: <MaterialCommunityIcons name="dots-horizontal" size={22} color="#1c7f4c" />, label: 'Piso tátil',
  },
  'atendimento-prioritario': {
    icon: <Ionicons name="accessibility" size={22} color="#1c7f4c" />, label: 'Atendimento prioritário',
  },
  'wheelchair': {
    icon: <MaterialCommunityIcons name="wheelchair-accessibility" size={22} color="#1c7f4c" />, label: 'Cadeirante',
  },
  'cao-guia': {
    icon: <FontAwesome5 name="dog" size={22} color="#1c7f4c" />, label: 'Cão-guia',
  },
  'braile': {
    icon: <MaterialCommunityIcons name="braille" size={22} color="#1c7f4c" />, label: 'Braile',
  },
  'audiodescricao': {
    icon: <MaterialCommunityIcons name="ear-hearing" size={22} color="#1c7f4c" />, label: 'Audiodescrição',
  },
  // Add more mappings as needed
};

export default function AccessibilityIcons({ features }) {
  if (!features || features.length === 0) return null;
  return (
    <View style={styles.row}>
      {features.map((feature) => (
        <View key={feature} style={styles.iconTag}>
          {featureIconMap[feature]?.icon || <Ionicons name="help-circle" size={22} color="#aaa" />}
          <Text style={styles.iconLabel}>{featureIconMap[feature]?.label || feature}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  iconTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7ef',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
  },
  iconLabel: {
    color: '#1c7f4c',
    fontSize: 13,
    marginLeft: 4,
  },
});
