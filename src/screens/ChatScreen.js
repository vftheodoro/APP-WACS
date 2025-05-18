import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Ícone de envio profissional
import * as ImagePicker from 'expo-image-picker';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';

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

  // Scroll para a última mensagem ao receber novas mensagens
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Detecta se o usuário está longe do final
  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
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
        <View style={[
          styles.messageContainer,
          isMe ? styles.myMessage : styles.otherMessage,
          { alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', position: 'relative' }
        ]}>
          {renderAvatar(item, isMe)}
          <View style={{ flex: 1 }}>
            {!isMe && (
              <Text style={styles.userName}>{item.userName || 'Usuário'}</Text>
            )}
            <View style={{ flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: 200, height: 200, borderRadius: 10, marginBottom: 4, backgroundColor: '#eee' }}
                resizeMode="cover"
              />
              <Text style={[styles.timeText, isMe && { color: '#fff' }]}>{formatTime(item.timestamp)}</Text>
            </View>
          </View>
          {isMe && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    // Renderizar mensagem de texto (default)
    return (
      <View style={[
        styles.messageContainer,
        isMe ? styles.myMessage : styles.otherMessage,
        { alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', position: 'relative' }
      ]}>
        {/* Cauda do balão */}
        {isMe ? (
          <View style={styles.myMessageTail}>
            <View style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 0,
              height: 0,
              borderLeftWidth: 12,
              borderLeftColor: 'transparent',
              borderTopWidth: 18,
              borderTopColor: 'transparent',
              borderBottomWidth: 0,
              borderBottomColor: 'transparent',
              borderRightWidth: 0,
              borderRightColor: 'transparent',
              borderTopRightRadius: 8,
              borderStyle: 'solid',
              borderBottomRightRadius: 0,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderRightWidth: 0,
              borderRightColor: 'transparent',
              borderTopColor: '#4A90E2',
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
              borderRightWidth: 12,
              borderRightColor: 'transparent',
              borderTopWidth: 18,
              borderTopColor: 'transparent',
              borderBottomWidth: 0,
              borderBottomColor: 'transparent',
              borderLeftWidth: 0,
              borderLeftColor: 'transparent',
              borderTopLeftRadius: 8,
              borderStyle: 'solid',
              borderBottomLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              borderLeftWidth: 0,
              borderLeftColor: 'transparent',
              borderTopColor: '#fff',
            }} />
          </View>
        )}
        {renderAvatar(item, isMe)}
        <View style={{ flex: 1 }}>
          {!isMe && (
            <Text style={styles.userName}>{item.userName || 'Usuário'}</Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.text}</Text>
            <Text style={[styles.timeText, isMe && { color: '#fff' }]}>  {formatTime(item.timestamp)}</Text>
          </View>
        </View>
        {isMe && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };



  return (
    <>
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
            {/* Adicione aqui opções como "Ver perfil completo", "Bloquear", etc. */}
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setProfileModalVisible(false)}>
              <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
          ) : (
            <>
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              />
              {showScrollButton && (
                <TouchableOpacity style={styles.scrollToEndButton} onPress={scrollToEnd} activeOpacity={0.8}>
                  <Text style={styles.scrollToEndIcon}>▼</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton} onPress={handlePickImage} activeOpacity={0.7} accessibilityLabel="Enviar imagem">
              <Ionicons name="image-outline" size={26} color="#007AFF" />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { height: Math.max(40, Math.min(inputHeight, 120)) }]}
              value={text}
              onChangeText={setText}
              placeholder="Digite sua mensagem..."
              placeholderTextColor="#999"
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline
              onContentSizeChange={e => setInputHeight(e.nativeEvent.contentSize.height)}
              blurOnSubmit={false}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.7} accessibilityLabel="Enviar mensagem">
              <Ionicons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: '#23243a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 260,
    elevation: 5,
  },
  profileModalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
    backgroundColor: '#bdbdbd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModalName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#fff',
  },
  profileModalEmail: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 4,
  },
  profileModalId: {
    fontSize: 12,
    color: '#888',
    marginBottom: 16,
  },
  modalCloseButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB', // tom mais suave
    padding: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#007AFF',
  },
  messagesList: {
    flexGrow: 1,
    paddingBottom: 90, // espaço extra para input flutuante
    paddingHorizontal: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 7,
    backgroundColor: '#e2e2e2',
    borderWidth: 2.5,
    borderColor: '#007AFF', // Borda azul premium
    shadowColor: '#007AFF',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  avatarDefault: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#bdbdbd',
    borderColor: '#007AFF',
    borderWidth: 2.5,
  },
  avatarInitial: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 19,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
    letterSpacing: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
    padding: 2,
  },
  deleteIcon: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
  },
  messageContainer: {
    marginVertical: 5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 7,
    elevation: 4,
    alignSelf: 'flex-start',
    maxWidth: '86%',
    minWidth: 48,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 2,
    opacity: 0.97,
  },
  myMessage: {
    // degrade premium (preparado para LinearGradient)
    backgroundColor: '#4A90E2', // fallback
    marginLeft: 46,
    alignSelf: 'flex-end',
    borderTopRightRadius: 22,
    borderBottomRightRadius: 28,
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
    shadowColor: '#4A90E2',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: '#4A90E2',
    minHeight: 42,
    minWidth: 60,
    paddingBottom: 14,
  },
  myMessageTail: {
    position: 'absolute',
    right: -8,
    bottom: 0,
    width: 16,
    height: 18,
    zIndex: 0,
    // balão com cauda
    backgroundColor: 'transparent',
  },
  otherMessage: {
    backgroundColor: '#fff',
    marginRight: 46,
    alignSelf: 'flex-start',
    borderTopLeftRadius: 22,
    borderBottomRightRadius: 28,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 22,
    borderWidth: 1.5,
    borderColor: '#e3e7ee',
    shadowColor: '#4A90E2',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 42,
    minWidth: 60,
    paddingBottom: 14,
  },
  otherMessageTail: {
    position: 'absolute',
    left: -8,
    bottom: 0,
    width: 16,
    height: 18,
    zIndex: 0,
    backgroundColor: 'transparent',
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A90E2',
    marginBottom: 2,
    marginLeft: 4,
    letterSpacing: 0.1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
  messageText: {
    fontSize: 16,
    color: '#23243a',
    lineHeight: 22,
    flexShrink: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
    letterSpacing: 0.05,
  },
  myMessageText: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
  deletedText: {
    color: '#e0e0e0',
    fontStyle: 'italic',
    fontSize: 16,
    marginLeft: 4,
  },
  deletedIcon: {
    color: '#e0e0e0',
    fontSize: 18,
    marginRight: 2,
  },
  timeText: {
    fontSize: 11,
    color: '#8AA1C2',
    marginLeft: 8,
    alignSelf: 'flex-end',
    marginBottom: 0,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.98)',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 7,
    borderRadius: 20,
    marginHorizontal: 6,
    marginBottom: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 11,
    paddingHorizontal: 17,
    borderRadius: 18,
    backgroundColor: '#F4F7FB',
    marginRight: 7,
    borderWidth: 1.3,
    borderColor: '#BFD7F6',
    color: '#23243a',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
    shadowColor: '#007AFF',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  attachButton: {
    backgroundColor: '#F4F7FB',
    borderRadius: 18,
    padding: 7,
    marginRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFD7F6',
    shadowColor: '#007AFF',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  chatImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: '#ececec',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 11,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 4,
    marginLeft: 2,
    marginRight: 1,
    borderWidth: 1.5,
    borderColor: '#fff',
    // Efeito de toque: pode ser adicionado com TouchableOpacity activeOpacity
  },
});
