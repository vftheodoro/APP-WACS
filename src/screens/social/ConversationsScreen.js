import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Borders, Shadows } from '../../theme';

export const ConversationsScreen = () => {
  const navigation = useNavigation();

  // Updated private chats with cities from Vale do Ribeira
  const privateChats = [
    { id: '1', name: 'Registro', lastMessage: 'Como está a acessibilidade aí?', unreadCount: 3, profilePic: 'https://via.placeholder.com/40/3366FF/FFFFFF?text=RG' },
    { id: '2', name: 'Jacupiranga', lastMessage: 'Temos novidades!', unreadCount: 0, profilePic: 'https://via.placeholder.com/40/FF33CC/FFFFFF?text=JC' },
    { id: '3', name: 'Cananéia', lastMessage: 'Vou visitar em breve.', unreadCount: 1, profilePic: 'https://via.placeholder.com/40/33FF57/FFFFFF?text=CN' },
    { id: '4', name: 'Iguape', lastMessage: 'Preciso de dicas de roteiro.', unreadCount: 0, profilePic: 'https://via.placeholder.com/40/FFFF33/000000?text=IG' },
    { id: '5', name: 'Miracatu', lastMessage: 'Evento este fim de semana!', unreadCount: 5, profilePic: 'https://via.placeholder.com/40/FF5733/FFFFFF?text=MR' },
  ];

  const renderChatItem = ({ item }) => (
    <Pressable style={styles.chatItem} onPress={() => navigation.navigate('ChatScreen', { chatName: item.name })}>
      <View style={styles.chatItemContent}>
        <Image source={{ uri: item.profilePic }} style={styles.chatProfilePic} />
        <View style={styles.chatTextContent}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatLastMessage}>{item.lastMessage}</Text>
        </View>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.chatUnreadBubble}>
          <Text style={styles.chatUnreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Chat Geral */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Chat Geral</Text>
          <Pressable
            style={styles.socialActionButton}
            onPress={() => navigation.navigate('ChatScreen', { chatName: 'Chat Geral da Comunidade' })}
          >
            <LinearGradient
              colors={[Colors.primary.dark, Colors.primary.light]}
              style={styles.socialActionGradient}
            >
              <Ionicons name="chatbubbles-outline" size={Typography.fontSizes.xl} color={Colors.text.lightOnPrimary} />
              <Text style={styles.socialActionText}>Entrar no Chat Geral</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Chats Privados */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Chats Privados (Vale do Ribeira)</Text>
          <FlatList
            data={privateChats}
            keyExtractor={item => item.id}
            renderItem={renderChatItem}
            scrollEnabled={false}
          />
          {/* Botão "Ver Todos os Chats" removido conforme solicitado */}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.screen,
  },
  scrollViewContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xl * 2,
  },
  sectionContainer: {
    backgroundColor: Colors.background.card,
    borderRadius: Borders.radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadows.default,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text.darkPrimary,
    marginBottom: Spacing.lg,
  },
  // Chats Privados Section
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: Borders.width.sm,
    borderBottomColor: Colors.border.light,
  },
  chatItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatProfilePic: {
    width: 50,
    height: 50,
    borderRadius: Borders.radius.circular,
    marginRight: Spacing.sm,
    borderWidth: Borders.width.sm,
    borderColor: Colors.border.medium,
  },
  chatTextContent: {
    flex: 1,
  },
  chatName: {
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.text.darkPrimary,
  },
  chatLastMessage: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.text.darkSecondary,
    marginTop: Spacing.xxs,
  },
  chatUnreadBubble: {
    backgroundColor: Colors.danger.primary,
    borderRadius: Borders.radius.circular,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxs,
  },
  chatUnreadText: {
    color: Colors.text.lightOnPrimary,
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
  },
  socialActionButton: {
    marginTop: Spacing.lg,
    borderRadius: Borders.radius.sm,
    overflow: 'hidden',
  },
  socialActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Borders.radius.sm,
  },
  socialActionText: {
    color: Colors.text.lightOnPrimary,
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semibold,
    marginLeft: Spacing.sm,
  },
}); 