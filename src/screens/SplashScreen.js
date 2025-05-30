import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

const CustomSplashScreen = ({ onAnimationComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const hideSplash = async () => {
      // Keep the splash screen visible until the animation is complete
      await SplashScreen.preventAutoHideAsync();
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500, // Animation duration
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5, // Springiness
          tension: 40, // Speed
          useNativeDriver: true,
        }),
      ]).start(async ({ finished }) => {
        if (finished) {
          // Animation is complete, now hide the native splash screen
          await SplashScreen.hideAsync();
          onAnimationComplete(true);
        }
      });
    };

    hideSplash();
  }, [fadeAnim, scaleAnim, onAnimationComplete]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <Image
        source={require('../../assets/logos_wacs/logo_padrao_com_nome.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Dark background color
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.8, // Adjust size as needed
    height: height * 0.3, // Adjust size as needed
  },
});

export default CustomSplashScreen; 