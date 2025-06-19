import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/auth/LoginScreen';
import { ControlScreen } from '../screens/ControlScreen';
import { MapScreen } from '../screens/MapScreen';
// Removido import duplicado de tela de perfil
import ChatScreen from '../screens/social/ChatScreen';
import { SocialScreen } from '../screens/social/SocialScreen';
import { ConnectionScreen } from '../screens/ConnectionScreen';
import { MainSelectionScreen } from '../screens/MainSelectionScreen';

import LocationsListScreen from '../screens/LocationsListScreen';
import LocationDetailScreen from '../screens/LocationDetailScreen';
import SelectLocationMapScreen from '../screens/SelectLocationMapScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import { useAuth } from '../contexts/AuthContext';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* Remove MainTabs component definition */
/*
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
*/

export const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator>
      {!user ? (
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RegisterScreen"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          {/* After login, navigate to MainSelectionScreen */}
          <Stack.Screen
            name="MainSelection"
            component={MainSelectionScreen}
            options={{ headerShown: false }} // Hide header for this screen
          />
          {/* Add individual screens from former MainTabs */}
          <Stack.Screen
            name="ControlScreen"
            component={ControlScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MapScreen"
            component={MapScreen}
            options={{ title: 'Mapa' }}
          />
          <Stack.Screen
            name="SocialScreen"
            component={SocialScreen}
            options={{ headerShown: false }} // SocialScreen tem seu próprio cabeçalho
          />
          <Stack.Screen
            name="ChatScreen"
            component={ChatScreen}
            options={{ title: 'Chat' }} // O título pode ser definido na SocialScreen, se preferir
          />
          <Stack.Screen
            name="LocationsListScreen"
            component={LocationsListScreen}
            options={{ headerShown: false }}
          />
           <Stack.Screen
            name="UserProfileScreen"
            component={UserProfileScreen}
            options={{ title: 'Perfil do Usuário' }}
          />

          {/* Keep other existing stack screens */}
          <Stack.Screen
            name="ConnectionScreen"
            component={ConnectionScreen}
            options={{ headerShown: false }}
          />
          
          {/* Removed redundant Chat screen definition */}
          {/* Removed redundant LocationsList screen definition */}
          {/* Removed redundant UserProfile screen definition */}

          <Stack.Screen
            name="LocationDetail"
            component={LocationDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SelectLocationMap"
            component={SelectLocationMapScreen}
            options={{ title: 'Selecionar Local' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}; 