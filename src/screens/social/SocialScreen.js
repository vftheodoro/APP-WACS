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
    <View style={styles.screenContainer}>
      <LinearGradient
        colors={['#1976d2', '#2196f3']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Comunidade WACS</Text>
          <View style={styles.headerRightPlaceholder} /> 
        </View>
      </LinearGradient>

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
              } else if (route.name === 'Conversas') {
                iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              } else if (route.name === 'Perfil') {
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
            name="Perfil" 
            component={ProfileTabScreen} 
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