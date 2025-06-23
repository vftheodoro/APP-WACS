import React from 'react';
import { TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#1976d2',
  accent: '#43e97b',
  gradientEnd: '#2196f3',
};

export default function FloatingButtons({ onCenter, onAdd }) {
  return (
    <>
      <TouchableOpacity style={{
        position: 'absolute',
        bottom: 30,
        right: 24,
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        zIndex: 10,
      }} onPress={onCenter} activeOpacity={0.8}>
        <LinearGradient colors={[COLORS.primary, COLORS.gradientEnd]} style={{ width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
          <Ionicons name="locate" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          position: 'absolute',
          right: 24,
          bottom: 110,
          width: 72,
          height: 72,
          borderRadius: 36,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.accent,
          borderWidth: 3,
          borderColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 16,
          zIndex: 99,
          overflow: 'visible',
        }}
        onPress={onAdd}
        activeOpacity={0.8}
      >
        <LinearGradient colors={[COLORS.accent, COLORS.gradientEnd]} style={{ width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accent }}>
          <Ionicons name="add" size={36} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </>
  );
} 