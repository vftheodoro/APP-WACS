import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SearchHistoryProvider } from './src/contexts/SearchHistoryContext';
import { ChatProvider } from './src/contexts/ChatContext';
import { BluetoothProvider } from './src/contexts/BluetoothContext';
import * as SplashScreen from 'expo-splash-screen';
import CustomSplashScreen from './src/screens/SplashScreen'; // Import your custom splash screen

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashAnimationComplete, setSplashAnimationComplete] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        // await Font.loadAsync(Entypo.font);
        // Artificially delay for two seconds to simulate a slow loading
        // experience. Please remove this if you copy and paste the code!
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Set appIsReady to true once all necessary resources are loaded
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onSplashAnimationComplete = useCallback(() => {
    setSplashAnimationComplete(true);
  }, []);

  // Only hide the native splash screen when the custom animation is complete AND app is ready
  useEffect(() => {
    if (appIsReady && splashAnimationComplete) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady, splashAnimationComplete]);

  if (!appIsReady || !splashAnimationComplete) {
    // While the app is not ready or the splash animation is not complete,
    // show the custom splash screen.
    return <CustomSplashScreen onAnimationComplete={onSplashAnimationComplete} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <SearchHistoryProvider>
              <ChatProvider>
                <BluetoothProvider>
                  <NavigationContainer>
                    <StatusBar style="auto" />
                    <AppNavigator />
                  </NavigationContainer>
                </BluetoothProvider>
              </ChatProvider>
            </SearchHistoryProvider>
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}