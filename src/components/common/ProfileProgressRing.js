import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function ProfileProgressRing({
  progress = 0.5, // valor entre 0 e 1
  size = 150,
  strokeWidth = 8,
  color = '#1976d2',
  backgroundColor = '#e3f2fd',
  children,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Fundo do arco */}
        <Circle
          stroke={backgroundColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Arco de progresso */}
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference},${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2},${size / 2}`}
        />
      </Svg>
      <View style={{ position: 'absolute', left: strokeWidth, top: strokeWidth, width: size - 2 * strokeWidth, height: size - 2 * strokeWidth, borderRadius: (size - 2 * strokeWidth) / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
} 