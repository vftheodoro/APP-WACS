import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert, Modal, Pressable, Vibration, Dimensions, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Ícone de envio profissional
import * as ImagePicker from 'expo-image-picker';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Borders, Shadows } from '../../theme';

const { width } = Dimensions.get('window');

function formatTime(timestamp) {
  if (!timestamp) return '';
  let dateObj;
  if (timestamp.seconds) {
    dateObj = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    dateObj = timestamp;
  } else {
    return '';
  }
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen() {
  const { messages, loading, sendMessage, sendImageMessage } = useChat();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(40); // Altura inicial do input
  const flatListRef = useRef();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [initialScrollDone, setInitialScrollDone] = useState(false); // Estado para controlar a rolagem inicial
  const [messageModalVisible, setMessageModalVisible] = useState(false); // Estado para controlar a visibilidade do modal de mensagem
  const [selectedMessage, setSelectedMessage] = useState(null); // Estado para armazenar a mensagem selecionada

  const insets = useSafeAreaInsets();

  // Scroll para a última mensagem ao receber novas mensagens
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      // Apenas rola automaticamente para o final se a rolagem inicial já foi feita
      // ou se é a primeira vez que mensagens são carregadas e não está carregando mais
      if (initialScrollDone || !loading) {
         flatListRef.current.scrollToEnd({ animated: true });
         setInitialScrollDone(true); // Marca que a rolagem inicial foi feita
      }
    }
  }, [messages, loading]); // Depende de messages e loading

  // Detecta se o usuário está longe do final
  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - Spacing.xl * 2; // Ajuste para a margem inferior
    setShowScrollButton(!isAtBottom);
  };

  const scrollToEnd = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSend = async () => {
    if (text.trim().length === 0) return;
    await sendMessage(text);
    setText('');
  };

  // Função para selecionar imagem
  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      await sendImageMessage(uri);
    }
  };

  const handleProfilePress = (item) => {
    setSelectedUser({
      userName: item.userName,
      userEmail: item.userEmail,
      photoURL: item.photoURL,
      userId: item.userId,
    });
    setProfileModalVisible(true);
  };

  const handleMessagePress = (message) => {
    setSelectedMessage(message);
    setMessageModalVisible(true);
  };

  const closeMessageModal = () => {
    setMessageModalVisible(false);
    setSelectedMessage(null);
  };

  const renderAvatar = (item, isMe) => {
    if (item.photoURL) {
      return (
        <Pressable onPress={() => handleProfilePress(item)}>
          <Image
            source={{ uri: item.photoURL }}
            style={styles.avatar}
          />
        </Pressable>
      );
    } else {
      // Avatar padrão: círculo com inicial do nome
      const initial = (item.userName || 'U').charAt(0).toUpperCase();
      return (
        <Pressable onPress={() => handleProfilePress(item)}>
          <View style={[styles.avatar, styles.avatarDefault]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        </Pressable>
      );
    }
  };

  const { deleteMessage } = useChat();

  const handleDelete = (item) => {
    Alert.alert(
      'Apagar mensagem',
      'Deseja apagar esta mensagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apagar', style: 'destructive', onPress: () => deleteMessage(item.id) }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isMe = item.userId === user?.id;
    if (item.deleted) {
      return (
        <View style={[
          styles.messageContainer,
          isMe ? styles.myMessage : styles.otherMessage,
          { alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', position: 'relative' }
        ]}>
          {renderAvatar(item, isMe)}
          <View style={{ flex: 1 }}>
            <Pressable onPress={() => handleProfilePress(item)}>
              <Text style={styles.userName}>{item.userName || 'Usuário'}</Text>
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.deletedIcon}>🚫</Text>
              <Text style={styles.deletedText}> Esta mensagem foi apagada</Text>
              <Text style={styles.timeText}>  {formatTime(item.timestamp)}</Text>
            </View>
          </View>
        </View>
      );
    }

    // Renderizar mensagem de imagem
    if (item.type === 'image' && item.imageUrl) {
      return (
        <Pressable
          onLongPress={isMe ? () => { Vibration.vibrate(50); handleDelete(item.id); } : undefined}
          onPress={() => handleMessagePress(item)}
          style={({ pressed }) => [
            styles.messageContainer,
            isMe ? styles.myMessage : styles.otherMessage,
            { alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', position: 'relative', paddingRight: isMe ? Spacing.sm * 1.25 : undefined, paddingLeft: !isMe ? Spacing.sm * 1.25 : undefined }, // Adjusted padding
            pressed && { opacity: 0.8 }
          ]}
        >
          {renderAvatar(item, isMe)}
          <View>{/* Conteúdo da mensagem */}
            {!isMe && (
              <Text style={styles.userName}>{item.userName || 'Usuário'}</Text>
            )}
            <View style={{ flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: 200, height: 200, borderRadius: Borders.radius.xs, marginBottom: Spacing.xs, backgroundColor: Colors.border.light }}
                resizeMode="cover"
              />
              <Text style={[styles.timeText, isMe && { color: Colors.text.lightOnPrimary }]}>{formatTime(item.timestamp)}</Text>
            </View>
          </View>
        </Pressable>
      );
    }
    // Renderizar mensagem de texto (default)
    return (
      <Pressable
        onLongPress={isMe ? () => { Vibration.vibrate(50); handleDelete(item.id); } : undefined}
        onPress={() => handleMessagePress(item)}
        style={({ pressed }) => [
          styles.messageContainer,
          isMe ? styles.myMessage : styles.otherMessage,
          { alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', position: 'relative', paddingRight: isMe ? Spacing.sm * 1.25 : undefined, paddingLeft: !isMe ? Spacing.sm * 1.25 : undefined }, // Adjusted padding
          pressed && { opacity: 0.8 }
        ]}
      >
        {/* Cauda do balão */}
        {isMe ? (
          <View style={styles.myMessageTail}>
            <View style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 0,
              height: 0,
              borderLeftWidth: Spacing.md,
              borderLeftColor: 'transparent',
              borderTopWidth: Spacing.md * 1.5,
              borderTopColor: 'transparent',
              borderBottomWidth: 0,
              borderBottomColor: 'transparent',
              borderRightWidth: 0,
              borderRightColor: 'transparent',
              borderTopRightRadius: Borders.radius.xs,
              borderStyle: 'solid',
              borderBottomRightRadius: 0,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderRightWidth: 0,
              borderRightColor: 'transparent',
              borderTopColor: isMe ? Colors.text.chatMine : Colors.text.chatOther,
            }} />
          </View>
        ) : (
          <View style={styles.otherMessageTail}>
            <View style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: 0,
              height: 0,
              borderRightWidth: Spacing.md,
              borderRightColor: 'transparent',
              borderTopWidth: Spacing.md * 1.5,
              borderTopColor: 'transparent',
              borderBottomWidth: 0,
              borderBottomColor: 'transparent',
              borderLeftWidth: 0,
              borderLeftColor: 'transparent',
              borderTopLeftRadius: Borders.radius.xs,
              borderStyle: 'solid',
              borderBottomLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderLeftWidth: 0,
              borderLeftColor: 'transparent',
              borderTopColor: isMe ? Colors.text.chatMine : Colors.text.chatOther,
            }} />
          </View>
        )}
        {renderAvatar(item, isMe)}
        <View>{/* Conteúdo da mensagem */}
          {!isMe && (
            <Text style={styles.userName}>{item.userName || 'Usuário'}</Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>{/* Ajustado alignItems */}
            <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.text}</Text>
            <Text style={[styles.timeText, isMe && { color: Colors.text.lightOnPrimary }, !isMe && { color: Colors.text.chatTimestamp }]}>  {formatTime(item.timestamp)}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.dark} />
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setProfileModalVisible(false)}>
          <View style={styles.profileModalBox}>
            {selectedUser?.photoURL ? (
              <Image source={{ uri: selectedUser.photoURL }} style={styles.profileModalAvatar} />
            ) : (
              <View style={[styles.profileModalAvatar, styles.avatarDefault]}>
                <Text style={styles.avatarInitial}>{selectedUser?.userName?.[0]?.toUpperCase() || 'U'}</Text>
              </View>
            )}
            <Text style={styles.profileModalName}>{selectedUser?.userName || 'Usuário'}</Text>
            <Text style={styles.profileModalEmail}>{selectedUser?.userEmail || ''}</Text>
            <Text style={styles.profileModalId}>ID: {selectedUser?.userId || ''}</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setProfileModalVisible(false)}>
              <LinearGradient
                colors={[Colors.primary.dark, Colors.primary.light]}
                style={styles.modalCloseButtonGradient}
              >
                <Text style={styles.modalCloseButtonText}>Fechar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={messageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMessageModal}
      >
        <Pressable style={styles.fullScreenModalOverlay} onPress={closeMessageModal}>
          <View style={styles.fullScreenMessageContainer}>
            {selectedMessage?.type === 'image' && selectedMessage?.imageUrl ? (
              <Image
                source={{ uri: selectedMessage.imageUrl }}
                style={styles.fullScreenModalImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={[styles.fullScreenModalText, selectedMessage?.userId === user?.id && { color: Colors.text.lightOnPrimary }]}>
                {selectedMessage?.text}
              </Text>
            )}
          </View>
        </Pressable>
      </Modal>

      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background.screen }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.container}>
            {loading ? (
              <ActivityIndicator size="large" color={Colors.primary.dark} style={{ marginTop: Spacing.xl }} />
            ) : (
              <>
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  keyExtractor={item => item.id}
                  renderItem={renderItem}
                  contentContainerStyle={{ ...styles.messagesList, paddingBottom: 100 + insets.bottom }}
                  showsVerticalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                />
                {showScrollButton && (
                  <TouchableOpacity style={{ ...styles.scrollToEndButton, bottom: 110 + insets.bottom }} onPress={scrollToEnd} activeOpacity={0.8}>
                    <Ionicons name="chevron-down" size={Typography.fontSizes.xl} color={Colors.text.lightOnPrimary} />
                  </TouchableOpacity>
                )}
              </>
            )}
            <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.attachButton} onPress={handlePickImage} activeOpacity={0.7} accessibilityLabel="Enviar imagem">
                <Ionicons name="image-outline" size={Typography.fontSizes.xxl + 2} color={Colors.primary.dark} />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { height: Math.max(40, Math.min(inputHeight, 120)) }]} // Keep min/max height for now
                value={text}
                onChangeText={setText}
                placeholder="Digite sua mensagem..."
                placeholderTextColor={Colors.text.darkTertiary}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                multiline
                onContentSizeChange={e => setInputHeight(e.nativeEvent.contentSize.height)}
                blurOnSubmit={false}
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.7} accessibilityLabel="Enviar mensagem">
                <LinearGradient
                  colors={[Colors.primary.dark, Colors.primary.light]}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="send" size={Typography.fontSizes.xxl} color={Colors.text.lightOnPrimary} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModalBox: {
    backgroundColor: Colors.background.card,
    borderRadius: Borders.radius.lg,
    padding: Spacing.xl + Spacing.xs, // 24
    alignItems: 'center',
    minWidth: 280,
    ...Shadows.lg,
  },
  profileModalAvatar: {
    width: 80,
    height: 80,
    borderRadius: Borders.radius.circular, // 40
    marginBottom: Spacing.lg,
    backgroundColor: Colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: Borders.width.lg,
    borderColor: Colors.primary.dark,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: 'hidden',
  },
  profileModalName: {
    fontSize: Typography.fontSizes.xxl, // 22, close enough to 24
    fontWeight: Typography.fontWeights.bold,
    marginBottom: Spacing.xs,
    color: Colors.text.darkPrimary,
  },
  profileModalEmail: {
    fontSize: Typography.fontSizes.md - 1, // 15
    color: Colors.text.darkSecondary,
    marginBottom: Spacing.sm,
  },
  profileModalId: {
    fontSize: Typography.fontSizes.xs + 1, // 13
    color: Colors.text.darkTertiary,
    marginBottom: Spacing.xl,
  },
  modalCloseButton: {
    marginTop: Spacing.lg - 1, // 15
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Borders.radius.sm,
    overflow: 'hidden',
    ...Shadows.default,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: Colors.text.lightOnPrimary,
    fontWeight: Typography.fontWeights.semibold,
    fontSize: Typography.fontSizes.md,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background.screen,
    padding: 0,
  },
  title: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.bold,
    textAlign: 'center',
    marginVertical: Spacing.sm * 1.25, // 10
    color: Colors.primary.dark,
  },
  messagesList: {
    flexGrow: 1,
    paddingVertical: Spacing.sm * 1.25, // 10
    paddingHorizontal: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Borders.radius.circular, // 18
    marginHorizontal: Spacing.xs,
    backgroundColor: Colors.border.light,
    borderWidth: Borders.width.md,
    borderColor: Colors.primary.dark,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: 'hidden',
  },
  avatarDefault: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.border.medium,
    borderColor: Colors.primary.dark,
    borderWidth: Borders.width.md,
  },
  avatarInitial: {
    color: Colors.text.lightOnPrimary,
    fontWeight: Typography.fontWeights.bold,
    fontSize: Typography.fontSizes.md + 1, // 17
    fontFamily: Typography.fontFamily.system,
  },
  deleteButton: {
    position: 'absolute',
    top: Spacing.xs + Spacing.xxs, // 6
    right: Spacing.xs + Spacing.xxs, // 6
    zIndex: 10,
    padding: Spacing.xs,
  },
  deleteIcon: {
    fontSize: Typography.fontSizes.md,
    color: Colors.text.lightOnPrimary,
    opacity: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  messageContainer: {
    marginVertical: Spacing.xxs,
    borderRadius: Borders.radius.lg - 7, // 18
    paddingHorizontal: Spacing.sm * 1.25, // 10
    paddingVertical: Spacing.sm - 1, // 7
    ...Shadows.sm,
    alignSelf: 'flex-start',
    maxWidth: '85%',
    minWidth: 50,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.xs,
    opacity: 1,
  },
  myMessage: {
    backgroundColor: Colors.text.chatMine,
    marginLeft: 55,
    alignSelf: 'flex-end',
    borderRadius: Borders.radius.lg - 7, // 18
    borderTopRightRadius: Borders.radius.xxs,
    ...Shadows.default,
    borderWidth: 0,
    minHeight: 30,
    paddingVertical: Spacing.xs * 1.5, // 6
    paddingHorizontal: Spacing.sm * 1.25, // 10
    paddingRight: Spacing.lg - Spacing.sm, // 18
    flexShrink: 1,
  },
  myMessageTail: {
    position: 'absolute',
    right: -5,
    bottom: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: Spacing.md,
    borderRightWidth: 0,
    borderBottomWidth: Spacing.md,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.text.chatMine,
    transform: [{ rotate: '90deg' }],
    zIndex: -1,
  },
  otherMessage: {
    backgroundColor: Colors.text.chatOther,
    marginRight: 55,
    alignSelf: 'flex-start',
    borderRadius: Borders.radius.lg - 7, // 18
    borderTopLeftRadius: Borders.radius.xxs,
    ...Shadows.default,
    borderWidth: 0,
    minHeight: 30,
    paddingVertical: Spacing.xs * 1.5, // 6
    paddingHorizontal: Spacing.sm * 1.25, // 10
    paddingLeft: Spacing.lg - Spacing.sm, // 18
    flexShrink: 1,
  },
  otherMessageTail: {
    position: 'absolute',
    left: -5,
    bottom: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 0,
    borderRightWidth: Spacing.md,
    borderBottomWidth: Spacing.md,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.text.chatOther,
    transform: [{ rotate: '-90deg' }],
    zIndex: -1,
  },
  messageText: {
    fontSize: Typography.fontSizes.md - 1,
    color: Colors.text.darkPrimary,
    flexShrink: 1,
    paddingHorizontal: 0,
    lineHeight: Typography.lineHeights.default,
  },
  myMessageText: {
    color: Colors.text.lightOnPrimary,
    fontWeight: Typography.fontWeights.regular,
  },
  timeText: {
    fontSize: Typography.fontSizes.xxs,
    color: Colors.text.lightOnPrimary,
    marginTop: 0,
    marginLeft: Spacing.sm,
    alignSelf: 'flex-end',
    paddingLeft: Spacing.xs,
  },
  deletedText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.text.chatDeleted,
    fontStyle: 'italic',
    marginLeft: Spacing.xs,
  },
  deletedIcon: {
    fontSize: Typography.fontSizes.md,
    color: Colors.text.chatDeleted,
  },
  userName: {
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.primary.dark,
    marginBottom: Spacing.xxs,
    marginLeft: 0,
    letterSpacing: 0,
    fontFamily: Typography.fontFamily.system,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: Spacing.xs * 1.5, // 6
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background.card,
    borderTopWidth: Borders.width.sm,
    borderColor: Colors.border.light,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.xs * 1.5, // 20 : 6
    ...Shadows.header,
  },
  attachButton: {
    padding: Spacing.sm,
    marginRight: Spacing.xs * 1.5, // 6
    marginBottom: Platform.OS === 'ios' ? 0 : Spacing.xs * 1.5, // 6
    borderRadius: Borders.radius.sm,
    backgroundColor: Colors.background.disabled,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderRadius: Borders.radius.lg,
    paddingHorizontal: Spacing.lg - 1, // 15
    paddingTop: Spacing.sm * 1.25, // 10
    paddingBottom: Spacing.sm * 1.25, // 10
    fontSize: Typography.fontSizes.md,
    maxHeight: 120,
    marginRight: Spacing.xs * 1.5, // 6
    borderColor: Colors.border.light,
    borderWidth: Borders.width.sm,
    minHeight: 40,
    textAlignVertical: 'top',
    ...Shadows.input,
  },
  sendButton: {
    borderRadius: Borders.radius.circular, // 20
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs * 1.5, // 6
    marginBottom: Platform.OS === 'ios' ? 0 : Spacing.xs * 1.5, // 6
    ...Shadows.default,
    overflow: 'hidden',
  },
  scrollToEndButton: {
    position: 'absolute',
    right: Spacing.xl,
    width: 40,
    height: 40,
    borderRadius: Borders.radius.circular, // 20
    backgroundColor: `rgba(${parseInt(Colors.primary.dark.slice(1, 3), 16)}, ${parseInt(Colors.primary.dark.slice(3, 5), 16)}, ${parseInt(Colors.primary.dark.slice(5, 7), 16)}, 0.8)`,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    ...Shadows.scrollToEnd,
  },
  scrollToEndIcon: {
    color: Colors.text.lightOnPrimary,
    fontSize: Typography.fontSizes.xl,
  },
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenMessageContainer: {
    maxWidth: '90%',
    maxHeight: '90%',
    borderRadius: Borders.radius.sm,
  },
  fullScreenModalText: {
    fontSize: Typography.fontSizes.lg,
    color: Colors.text.lightOnPrimary,
    textAlign: 'center',
  },
  fullScreenModalImage: {
    width: '100%',
    height: '100%',
    borderRadius: Borders.radius.sm,
  },
  modalCloseButtonGradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Borders.radius.sm,
    overflow: 'hidden',
    ...Shadows.default,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: Borders.radius.circular, // 20
    justifyContent: 'center',
    alignItems: 'center',
  },
});

