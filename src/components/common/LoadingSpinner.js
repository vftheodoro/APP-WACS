import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

const LoadingSpinner = () => {
  const spinValue = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.loader, { transform: [{ rotate: spin }] }]}>
        <View style={styles.innerLoader} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loader: {
    width: 44.8,
    height: 44.8,
    position: 'relative',
  },
  innerLoader: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 22.4,
    borderWidth: 2,
    borderColor: '#ff4747',
    borderStyle: 'solid',
  },
});

export default LoadingSpinner; 