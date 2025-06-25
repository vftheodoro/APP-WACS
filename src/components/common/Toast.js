import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Borders, Typography } from '../../theme';

const icons = {
  success: { name: 'checkmark-circle', color: Colors.success.primary },
  error: { name: 'close-circle', color: Colors.danger.primary },
  info: { name: 'information-circle', color: Colors.primary.dark },
};

export default function Toast({ visible, type = 'info', message, onHide, duration = 2500 }) {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      const timer = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onHide && onHide());
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]}> 
      <Ionicons name={icons[type].name} size={22} color={icons[type].color} style={{ marginRight: 8 }} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Borders.radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  message: {
    color: Colors.text.darkPrimary,
    fontSize: Typography.fontSizes.md,
    fontWeight: 'bold',
  },
}); 