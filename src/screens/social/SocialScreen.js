import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors, Typography, Spacing, Borders, Shadows } from '../../theme';

// Import new tab screens
import { PostsFeedScreen } from './PostsFeedScreen';
import { ConversationsScreen } from './ConversationsScreen';
import UserProfileScreen from '../UserProfileScreen';

const Tab = createBottomTabNavigator();

export const SocialScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('PostsFeed');

  return (
    <View style={styles.screenContainer}>
      {/* Header só aparece se não estiver na aba Perfil */}
      {activeTab !== 'Perfil' && (
        <LinearGradient
          colors={['#1976d2', '#2196f3']}
          style={{ paddingTop: 40, paddingBottom: 24, paddingHorizontal: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 6, shadowColor: '#1976d2', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8 }}
        >
          <View style={{ width: 40, alignItems: 'flex-start' }}>
            <Pressable onPress={() => navigation.goBack()} accessibilityLabel="Voltar" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </Pressable>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, letterSpacing: 0.5, textAlign: 'center' }}>
              {activeTab === 'PostsFeed' ? 'Posts' : activeTab === 'Chats' ? 'Chats' : 'Comunidade WACS'}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
      )}
      <View style={styles.tabNavigatorContainer}>
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
              } else if (route.name === 'Chats') {
                iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              } else if (route.name === 'Perfil') {
                iconName = focused ? 'person' : 'person-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
          screenListeners={{
            state: (e) => {
              const tabName = e.data.state.routeNames[e.data.state.index];
              setActiveTab(tabName);
            },
          }}
        >
          <Tab.Screen 
            name="PostsFeed" 
            component={PostsFeedScreen} 
            options={{ title: 'Posts' }} 
          />
          <Tab.Screen 
            name="Chats" 
            component={ConversationsScreen} 
            options={{ title: 'Chats' }} 
          />
          <Tab.Screen 
            name="Perfil" 
            component={UserProfileScreen} 
            options={{ title: 'Perfil' }} 
          />
        </Tab.Navigator>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background.screen,
  },
  tabNavigatorContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 }, 
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRightPlaceholder: {
    width: 44,
  },
}); 