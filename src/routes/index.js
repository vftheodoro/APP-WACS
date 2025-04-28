import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { LoginScreen } from '../screens/LoginScreen';
import { MapScreen } from '../screens/MapScreen';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Componente temporário para a tela de perfil
const ProfileScreen = () => {
  return null;
};

const AuthStack = () => {
  const { isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? '#121212' : '#fff' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();

  if (loading) {
    return null; // TODO: Adicionar componente de loading
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : (
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: isDark ? '#1E1E1E' : '#fff',
              borderTopColor: isDark ? '#333' : '#ddd',
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: isDark ? '#666' : '#999',
          }}
        >
          <Tab.Screen
            name="Mapa"
            component={MapScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="map" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Perfil"
            component={ProfileScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppRoutes; 