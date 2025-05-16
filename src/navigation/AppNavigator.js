import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { LoginScreen } from '../screens/LoginScreen';
import { ControlScreen } from '../screens/ControlScreen';
import { MapScreen } from '../screens/MapScreen';
// Removido import duplicado de tela de perfil
import ChatScreen from '../screens/ChatScreen';

import LocationsListScreen from '../screens/LocationsListScreen';
import LocationDetailScreen from '../screens/LocationDetailScreen';
import SelectLocationMapScreen from '../screens/SelectLocationMapScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import { BluetoothConnectionScreen } from '../screens/BluetoothConnectionScreen';
import { useAuth } from '../contexts/AuthContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Controle':
              iconName = focused ? 'game-controller' : 'game-controller-outline';
              break;
            case 'Mapa':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Chat':
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              break;
            case 'Adicionar Local':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Locais':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Perfil do Usuário':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
            case 'Perfil':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-circle';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Controle" component={ControlScreen} />
      <Tab.Screen name="Mapa" component={MapScreen} options={{ headerShown: false, tabBarLabel: 'Mapa' }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: 'Chat' }} />
      
      <Tab.Screen name="Locais" component={LocationsListScreen} options={{ tabBarLabel: 'Locais' }} />
      <Tab.Screen name="Perfil do Usuário" component={UserProfileScreen} options={{ tabBarLabel: 'Meu Perfil' }} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator>
      {!user ? (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: 'Chat' }}
          />
          
          <Stack.Screen
            name="LocationsList"
            component={LocationsListScreen}
            options={{ title: 'Locais Adicionados' }}
          />
          <Stack.Screen
            name="LocationDetail"
            component={LocationDetailScreen}
            options={{ title: 'Detalhes do Local' }}
          />
          <Stack.Screen
            name="SelectLocationMap"
            component={SelectLocationMapScreen}
            options={{ title: 'Selecionar Local' }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{ title: 'Perfil do Usuário' }}
          />
          <Stack.Screen
            name="BluetoothConnection"
            component={BluetoothConnectionScreen}
            options={{ title: 'Conexão Bluetooth' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}; 