import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BluetoothProvider } from './src/contexts/BluetoothContext';
import { SearchHistoryProvider } from './src/contexts/SearchHistoryContext';
import { ChatProvider } from './src/contexts/ChatContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <SearchHistoryProvider>
              <BluetoothProvider>
                <ChatProvider>
                  <NavigationContainer>
                    <StatusBar style="auto" />
                    <AppNavigator />
                  </NavigationContainer>
                </ChatProvider>
              </BluetoothProvider>
            </SearchHistoryProvider>
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}