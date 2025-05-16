import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert, Modal, Pressable } from 'react-native';
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
  const { messages, loading, sendMessage } = useChat();
  const { user } = useAuth();
  const [text, setText] = useState('');
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
    return (
      <View style={[
        styles.messageContainer,
        isMe ? styles.myMessage : styles.otherMessage,
        { alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', position: 'relative' }
      ]}>
        {renderAvatar(item, isMe)}
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{item.userName || 'Usuário'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.text}</Text>
            <Text style={styles.timeText}>  {formatTime(item.timestamp)}</Text>
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
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Digite sua mensagem..."
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Text style={styles.sendButtonText}>Enviar</Text>
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
    backgroundColor: '#f9f9f9',
    padding: 10,
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
    paddingBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 8,
    backgroundColor: '#eee',
  },
  avatarDefault: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#bdbdbd',
  },
  avatarInitial: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
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
    marginVertical: 4,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'flex-start',
    maxWidth: '80%',
    minWidth: 48,
  },
  myMessage: {
    backgroundColor: '#007AFF', 
    marginLeft: 40,
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  otherMessage: {
    backgroundColor: '#FFF',
    marginRight: 40,
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  myMessageText: {
    color: '#fff',
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
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
