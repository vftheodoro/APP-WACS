import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors, Typography, Spacing, Borders, Shadows } from '../../theme';

// Import new tab screens
import { PostsFeedScreen } from './PostsFeedScreen';
import { ConversationsScreen } from './ConversationsScreen';
import { ProfileTabScreen } from './ProfileTabScreen';

const Tab = createBottomTabNavigator();

export const SocialScreen = () => {
  const navigation = useNavigation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary.dark,
        tabBarInactiveTintColor: Colors.text.darkSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background.card,
          borderTopWidth: Borders.width.sm,
          borderTopColor: Colors.border.light,
          paddingBottom: Spacing.xs,
          height: 60,
          ...Shadows.header,
        },
        tabBarLabelStyle: {
          fontSize: Typography.fontSizes.xs,
          fontWeight: Typography.fontWeights.semibold,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'PostsFeed') {
            iconName = focused ? 'copy' : 'copy-outline';
          } else if (route.name === 'Conversas') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'PerfilSocial') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="PostsFeed" 
        component={PostsFeedScreen} 
        options={{ title: 'Posts' }} 
      />
      <Tab.Screen 
        name="Conversas" 
        component={ConversationsScreen} 
        options={{ title: 'Conversas' }} 
      />
      <Tab.Screen 
        name="PerfilSocial" 
        component={ProfileTabScreen} 
        options={{ title: 'Perfil' }} 
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.screen,
  },
}); 