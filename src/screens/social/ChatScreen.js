import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert, Modal, Pressable, Vibration, Dimensions, SafeAreaView, StatusBar, ActionSheetIOS } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, doc as firestoreDoc, getDoc, updateDoc, arrayRemove, getDocs, collection as firestoreCollection, updateDoc as firestoreUpdateDoc, arrayUnion, deleteDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Borders, Shadows } from '../../theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getUsersByIds, updateUserData } from '../../services/firebase/user';
import removeAccents from 'remove-accents';

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

// Função utilitária para gerar ID de cidade
function cityIdFromName(name) {
  return removeAccents(name || '').toLowerCase().replace(/\s+/g, '_');
}

export default function ChatScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { chatId, chatName } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const flatListRef = useRef();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [chatInfo, setChatInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuMsg, setContextMenuMsg] = useState(null);

  // Carregar mensagens do chatId
  useEffect(() => {
    if (!chatId) return;
    setLoading(true);
    const db = getFirestore();
    // Agora cada chat tem sua subcoleção de mensagens
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      setError('Erro ao carregar mensagens: ' + (err?.message || err));
      setLoading(false);
    });
    return unsubscribe;
  }, [chatId]);

  // Scroll para a última mensagem ao receber novas mensagens
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      if (initialScrollDone || !loading) {
         flatListRef.current.scrollToEnd({ animated: true });
        setInitialScrollDone(true);
      }
    }
  }, [messages, loading]);

  // Buscar informações do chat e membros
  useEffect(() => {
    if (!chatId) return;
    const fetchChatInfo = async () => {
      const db = getFirestore();
      const chatRef = firestoreDoc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        const chatData = { id: chatSnap.id, ...chatSnap.data() };
        setChatInfo(chatData);
        if (chatData.members && chatData.members.length) {
          const users = await getUsersByIds(chatData.members);
          setMembers(users);
        } else {
          setMembers([]);
        }
      }
    };
    fetchChatInfo();
  }, [chatId, infoModalVisible]);

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - Spacing.xl * 2;
    setShowScrollButton(!isAtBottom);
  };

  const scrollToEnd = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSend = async () => {
    if (text.trim().length === 0 || !user || !chatId) return;
    setSending(true);
    setError('');
    try {
      const db = getFirestore();
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      if (editingMessage) {
        // Editar mensagem existente
        const msgRef = firestoreDoc(db, 'chats', chatId, 'messages', editingMessage.id);
        await updateDoc(msgRef, { text, edited: true });
        setEditingMessage(null);
      } else {
        // Nova mensagem (com ou sem reply)
        await addDoc(messagesRef, {
          type: 'text',
          text,
          userId: user.id,
          userName: user.name || user.email || 'Usuário',
          userEmail: user.email || '',
          photoURL: user.photoURL || '',
          timestamp: serverTimestamp(),
          replyTo: replyTo ? {
            id: replyTo.id,
            userName: replyTo.userName,
            text: replyTo.text,
          } : null,
        });
      }
    setText('');
      setReplyTo(null);
    } catch (e) {
      setError('Erro ao enviar mensagem: ' + (e?.message || e));
    } finally {
      setSending(false);
    }
  };

  // Função para selecionar imagem
  const handlePickImage = async () => {
    if (!user || !chatId) return;
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setSending(true);
      setError('');
      try {
        const storage = getStorage();
        const response = await fetch(uri);
        const blob = await response.blob();
        const imageRef = ref(storage, `chatImages/${user.id}_${Date.now()}`);
        await uploadBytes(imageRef, blob);
        const imageUrl = await getDownloadURL(imageRef);
        const db = getFirestore();
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        await addDoc(messagesRef, {
          type: 'image',
          imageUrl,
          userId: user.id,
          userName: user.name || user.email || 'Usuário',
          userEmail: user.email || '',
          photoURL: user.photoURL || '',
          timestamp: serverTimestamp(),
        });
      } catch (e) {
        setError('Erro ao enviar imagem: ' + (e?.message || e));
      } finally {
        setSending(false);
      }
    }
  };

  const renderAvatar = (item) => {
    if (item.photoURL) {
      return (
        <Pressable onPress={() => setSelectedUser(item)}>
          <Image source={{ uri: item.photoURL }} style={styles.avatar} />
        </Pressable>
      );
    } else {
      const initial = (item.userName || 'U').charAt(0).toUpperCase();
      return (
        <Pressable onPress={() => setSelectedUser(item)}>
          <View style={[styles.avatar, styles.avatarDefault]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        </Pressable>
      );
    }
  };

  const handleMessageLongPress = (msg) => {
    setContextMenuMsg(msg);
    setContextMenuVisible(true);
  };

  const handleContextMenuAction = (action) => {
    if (!contextMenuMsg) return;
    if (action === 'responder') handleReplyTo(contextMenuMsg);
    else if (action === 'editar') handleEditMessage(contextMenuMsg);
    else if (action === 'apagar') handleDeleteMessage(contextMenuMsg);
    setContextMenuVisible(false);
    setContextMenuMsg(null);
  };

  const renderItem = ({ item }) => {
    const isMe = item.userId === user?.id;
    const isSystem = item.userId === 'system';
    if (item.deleted) {
      return (
        <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage, { alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', position: 'relative' }]}> 
          {renderAvatar(item)}
          <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{item.userName || 'Usuário'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.deletedIcon}>🚫</Text>
              <Text style={styles.deletedText}> Esta mensagem foi apagada</Text>
              <Text style={styles.timeText}>  {formatTime(item.timestamp)}</Text>
            </View>
          </View>
        </View>
      );
    }
    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Ionicons name="megaphone-outline" size={18} color="#b8860b" style={{ marginRight: 6 }} />
          <Text style={styles.systemMessageText}>{item.text}</Text>
          <Text style={styles.systemTimeText}>{formatTime(item.timestamp)}</Text>
        </View>
      );
    }
    if (item.type === 'image' && item.imageUrl) {
      return (
        <Pressable
          style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage, { alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', position: 'relative' }]}
          onLongPress={() => handleMessageLongPress(item)}
        >
          {renderAvatar(item)}
          <View>
              <Text style={styles.userName}>{item.userName || 'Usuário'}</Text>
            {item.replyTo && (
              <View style={{
                backgroundColor: '#f1f8e9',
                borderLeftWidth: 4,
                borderLeftColor: Colors.primary.light,
                padding: 6,
                marginBottom: 4,
                borderRadius: 7,
                maxWidth: 220,
              }}>
                <Text style={{ color: Colors.primary.dark, fontWeight: 'bold', fontSize: 12 }}>{item.replyTo.userName || 'Usuário'}</Text>
                <Text style={{ color: Colors.text.darkSecondary, fontSize: 12 }} numberOfLines={1}>
                  {item.replyTo.text ? item.replyTo.text.slice(0, 60) : '[imagem]'}
                </Text>
              </View>
            )}
            <Image source={{ uri: item.imageUrl }} style={{ width: 200, height: 200, borderRadius: Borders.radius.xs, marginBottom: Spacing.xs, backgroundColor: Colors.border.light }} resizeMode="cover" />
              <Text style={[styles.timeText, isMe && { color: Colors.text.lightOnPrimary }]}>{formatTime(item.timestamp)}</Text>
          </View>
        </Pressable>
      );
    }
    // Mensagem de texto (com ou sem reply)
    return (
      <Pressable
        style={[styles.messageContainer, isMe ? styles.myMessage : styles.otherMessage, { alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', position: 'relative' }]}
        onLongPress={() => handleMessageLongPress(item)}
      >
        {renderAvatar(item)}
        <View>
          <Text style={styles.userName}>{item.userName || 'Usuário'}</Text>
          {item.replyTo && (
            <View style={{
              backgroundColor: '#f1f8e9',
              borderLeftWidth: 4,
              borderLeftColor: Colors.primary.light,
              padding: 6,
              marginBottom: 4,
              borderRadius: 7,
              maxWidth: 220,
            }}>
              <Text style={{ color: Colors.primary.dark, fontWeight: 'bold', fontSize: 12 }}>{item.replyTo.userName || 'Usuário'}</Text>
              <Text style={{ color: Colors.text.darkSecondary, fontSize: 12 }} numberOfLines={1}>
                {item.replyTo.text ? item.replyTo.text.slice(0, 60) : '[imagem]'}
              </Text>
          </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.text}</Text>
            <Text style={[styles.timeText, isMe && { color: Colors.text.lightOnPrimary }, !isMe && { color: Colors.text.chatTimestamp }]}>  {formatTime(item.timestamp)}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  // Função para deletar mensagem
  const handleDeleteMessage = async (msg) => {
    if (!user || !chatId || !msg.id) return;
    if (msg.userId !== user.id) return;
    try {
      const db = getFirestore();
      const msgRef = firestoreDoc(db, 'chats', chatId, 'messages', msg.id);
      await updateDoc(msgRef, { deleted: true, text: '', imageUrl: '', edited: false });
    } catch {}
  };

  // Função para iniciar edição
  const handleEditMessage = (msg) => {
    setEditingMessage(msg);
    setText(msg.text);
  };

  // Função para responder/comentar
  const handleReplyTo = (msg) => {
    setReplyTo(msg);
  };

  // Função para sair do chat (adiciona mensagem do sistema)
  const handleLeaveChat = async () => {
    if (!chatInfo || !user) return;
    try {
      const db = getFirestore();
      const chatRef = firestoreDoc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        members: arrayRemove(user.id)
      });
      // Mensagem do sistema
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        type: 'system',
        text: `${user.name || user.email || 'Usuário'} saiu do grupo`,
        userId: 'system',
        timestamp: serverTimestamp(),
      });
      // Se não for o chat da cidade do usuário, remove do joinedChats
      if (chatInfo.cidade !== user.cidade && user.joinedChats?.includes(chatId)) {
        const newJoined = user.joinedChats.filter(id => id !== chatId);
        await updateUserData(user.id, { joinedChats: newJoined });
      }
      setInfoModalVisible(false);
      Alert.alert('Você saiu do chat.');
    } catch (e) {
      Alert.alert('Erro ao sair do chat', e?.message || String(e));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background.screen }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.dark} />
        <LinearGradient
          colors={[Colors.primary.dark, '#1976d2', Colors.primary.light]}
          style={{
            paddingTop: insets.top + 10,
            paddingBottom: 18,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
            elevation: 10,
            shadowColor: '#1976d2',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 12,
            marginBottom: 2,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ padding: 6, marginRight: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.10)' }}
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setInfoModalVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel="Ver informações do chat"
          >
            <Text
              style={{
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 21,
                textAlign: 'center',
                flex: 1,
                textDecorationLine: 'underline',
                letterSpacing: 0.5,
                textShadowColor: 'rgba(0,0,0,0.18)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
              numberOfLines={1}
            >
              {chatName || chatInfo?.name || 'Chat'}
            </Text>
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <Modal visible={infoModalVisible} animationType="slide" transparent onRequestClose={() => setInfoModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 22, padding: 0, width: '92%', maxWidth: 420, alignItems: 'stretch', elevation: 12, overflow: 'hidden' }}>
              <View style={{ backgroundColor: Colors.primary.dark, paddingVertical: 18, paddingHorizontal: 20, alignItems: 'center', borderTopLeftRadius: 22, borderTopRightRadius: 22 }}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 2, letterSpacing: 0.5 }}>{chatInfo?.name || chatName}</Text>
                {chatInfo?.cidade && <Text style={{ fontSize: 15, color: '#e3f2fd', marginBottom: 2 }}>{chatInfo.cidade}</Text>}
                <Text style={{ fontSize: 13, color: '#bbdefb', marginBottom: 0 }}>{chatInfo?.type === 'regional' ? 'Chat Regional' : 'Chat de Cidade'}</Text>
              </View>
              <View style={{ padding: 20, paddingBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 13, color: Colors.text.darkTertiary, marginRight: 8 }}>ID do chat:</Text>
                  <Text selectable style={{ fontSize: 13, color: Colors.primary.dark, fontWeight: 'bold', marginRight: 8 }}>{chatInfo?.id}</Text>
                  <TouchableOpacity onPress={() => { if (chatInfo?.id) {  navigator.clipboard?.writeText?.(chatInfo.id);  Alert.alert('ID copiado!'); } }} style={{ padding: 4 }}>
                    <Ionicons name="copy-outline" size={18} color={Colors.primary.dark} />
            </TouchableOpacity>
          </View>
                <View style={{ height: 1, backgroundColor: Colors.border.light, marginVertical: 8 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: Colors.text.darkSecondary }}>Criado em:</Text>
                  <Text style={{ fontSize: 14, color: Colors.text.darkPrimary, fontWeight: 'bold' }}>{chatInfo?.createdAt?.seconds ? new Date(chatInfo.createdAt.seconds * 1000).toLocaleDateString() : '-'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: Colors.text.darkSecondary }}>Total de mensagens:</Text>
                  <Text style={{ fontSize: 14, color: Colors.text.darkPrimary, fontWeight: 'bold' }}>{messages.length}</Text>
                </View>
                <View style={{ height: 1, backgroundColor: Colors.border.light, marginVertical: 8 }} />
                <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 6, color: Colors.primary.dark }}>Membros ({members.length}):</Text>
                <FlatList
                  data={members}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingVertical: 2 }}>
                      {item.photoURL ? (
                        <Image source={{ uri: item.photoURL }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10, backgroundColor: Colors.border.light }} />
                      ) : (
                        <View style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10, backgroundColor: Colors.border.medium, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{(item.name || 'U').charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', color: Colors.text.darkPrimary, fontSize: 15 }}>{item.name || 'Usuário'}</Text>
                        <Text style={{ color: Colors.text.darkSecondary, fontSize: 13 }}>{item.email}</Text>
                      </View>
                      <Text style={{ color: Colors.text.darkTertiary, fontSize: 12 }}>{item.id}</Text>
                    </View>
                  )}
                  style={{ width: '100%', marginBottom: 8 }}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={<Text style={{ color: Colors.text.darkTertiary, fontStyle: 'italic', textAlign: 'center', marginVertical: 8 }}>Nenhum membro.</Text>}
                />
                <View style={{ height: 1, backgroundColor: Colors.border.light, marginVertical: 8 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <TouchableOpacity onPress={() => { Alert.alert('Denúncia enviada', 'Sua denúncia foi registrada.'); }} style={{ backgroundColor: '#ff9800', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10, marginRight: 8 }}>
                    <Ionicons name="alert-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Denunciar</Text>
                  </TouchableOpacity>
                  {chatInfo?.type !== 'regional' && (
                    <TouchableOpacity onPress={handleLeaveChat} style={{ backgroundColor: '#f44336', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 }}>
                      <Ionicons name="exit-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Sair do chat</Text>
                    </TouchableOpacity>
            )}
          </View>
              </View>
              <TouchableOpacity onPress={() => setInfoModalVisible(false)} style={{ backgroundColor: Colors.primary.dark, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17, letterSpacing: 0.5 }}>Fechar</Text>
              </TouchableOpacity>
            </View>
            </View>
      </Modal>
        {error ? <Text style={{ color: '#f44336', textAlign: 'center', margin: 8 }}>{error}</Text> : null}
            {loading ? (
          <ActivityIndicator size="large" color={Colors.primary.dark} style={{ marginTop: 32 }} />
            ) : (
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  keyExtractor={item => item.id}
                  renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 100 + insets.bottom, paddingTop: 10, paddingHorizontal: 8 }}
                  showsVerticalScrollIndicator={false}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                />
        )}
                {showScrollButton && (
                  <TouchableOpacity style={{ ...styles.scrollToEndButton, bottom: 110 + insets.bottom }} onPress={scrollToEnd} activeOpacity={0.8}>
                    <Ionicons name="chevron-down" size={Typography.fontSizes.xl} color={Colors.text.lightOnPrimary} />
                  </TouchableOpacity>
                )}
        {/* Barra de escrever profissional */}
        <View style={{ backgroundColor: Colors.background.card, borderTopWidth: Borders.width.sm, borderColor: Colors.border.light, padding: 8, paddingBottom: insets.bottom + 8 }}>
          {/* Box de reply/edição */}
          {(replyTo || editingMessage) && (
            <View style={{
              backgroundColor: editingMessage ? '#fff3e0' : '#e3f2fd',
              borderLeftWidth: 4,
              borderLeftColor: editingMessage ? '#ff9800' : Colors.primary.dark,
              padding: 8,
              marginBottom: 6,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              elevation: 2,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: editingMessage ? '#ff9800' : Colors.primary.dark, fontWeight: 'bold', fontSize: 13 }}>
                  {editingMessage ? 'Editando mensagem' : `Respondendo a ${replyTo?.userName || 'Usuário'}`}
                </Text>
                <Text style={{ color: Colors.text.darkSecondary, fontSize: 13 }} numberOfLines={1}>
                  {editingMessage ? editingMessage.text.slice(0, 60) : (replyTo?.text ? replyTo.text.slice(0, 60) : '[imagem]')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setReplyTo(null); setEditingMessage(null); }} style={{ marginLeft: 10, padding: 4 }}>
                <Ionicons name="close-circle" size={20} color={editingMessage ? '#ff9800' : Colors.primary.dark} />
              </TouchableOpacity>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <TouchableOpacity style={styles.attachButton} onPress={handlePickImage} activeOpacity={0.7} accessibilityLabel="Enviar imagem">
                <Ionicons name="image-outline" size={Typography.fontSizes.xxl + 2} color={Colors.primary.dark} />
              </TouchableOpacity>
              <TextInput
              style={[styles.input, { height: Math.max(40, Math.min(inputHeight, 120)), flex: 1 }]}
                value={text}
                onChangeText={setText}
              placeholder={editingMessage ? 'Edite sua mensagem...' : (replyTo ? 'Responda à mensagem...' : 'Digite sua mensagem...')}
                placeholderTextColor={Colors.text.darkTertiary}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                multiline
                onContentSizeChange={e => setInputHeight(e.nativeEvent.contentSize.height)}
                blurOnSubmit={false}
              editable={!sending}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.7} accessibilityLabel="Enviar mensagem" disabled={sending || !text.trim()}>
              <LinearGradient colors={[Colors.primary.dark, Colors.primary.light]} style={styles.sendButtonGradient}>
                <Ionicons name={editingMessage ? 'checkmark-done' : 'send'} size={Typography.fontSizes.xxl} color={Colors.text.lightOnPrimary} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        {/* Modal de contexto multiplataforma */}
        <Modal
          visible={contextMenuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setContextMenuVisible(false)}
        >
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setContextMenuVisible(false)}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 18, minWidth: 220, elevation: 8, alignItems: 'stretch' }}>
              {contextMenuMsg && contextMenuMsg.userId === user?.id ? (
                <>
                  <TouchableOpacity onPress={() => handleContextMenuAction('responder')} style={{ paddingVertical: 12 }}><Text style={{ fontSize: 16, color: Colors.primary.dark }}>Responder</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleContextMenuAction('editar')} style={{ paddingVertical: 12 }}><Text style={{ fontSize: 16, color: Colors.primary.dark }}>Editar</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleContextMenuAction('apagar')} style={{ paddingVertical: 12 }}><Text style={{ fontSize: 16, color: '#f44336' }}>Apagar</Text></TouchableOpacity>
                  <View style={{ height: 1, backgroundColor: Colors.border.light, marginVertical: 6 }} />
                  <TouchableOpacity onPress={() => setContextMenuVisible(false)} style={{ paddingVertical: 12 }}><Text style={{ fontSize: 16, color: Colors.text.darkTertiary }}>Cancelar</Text></TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity onPress={() => handleContextMenuAction('responder')} style={{ paddingVertical: 12 }}><Text style={{ fontSize: 16, color: Colors.primary.dark }}>Responder</Text></TouchableOpacity>
                  <View style={{ height: 1, backgroundColor: Colors.border.light, marginVertical: 6 }} />
                  <TouchableOpacity onPress={() => setContextMenuVisible(false)} style={{ paddingVertical: 12 }}><Text style={{ fontSize: 16, color: Colors.text.darkTertiary }}>Cancelar</Text></TouchableOpacity>
                </>
              )}
            </View>
          </Pressable>
        </Modal>
        </SafeAreaView>
        </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Borders.radius.circular,
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
    fontSize: Typography.fontSizes.md + 1,
    fontFamily: Typography.fontFamily.system,
  },
  messageContainer: {
    marginVertical: Spacing.xxs,
    borderRadius: Borders.radius.lg - 7,
    paddingHorizontal: Spacing.sm * 1.25,
    paddingVertical: Spacing.sm - 1,
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
    borderRadius: Borders.radius.lg - 7,
    borderTopRightRadius: Borders.radius.xxs,
    ...Shadows.default,
    borderWidth: 0,
    minHeight: 30,
    paddingVertical: Spacing.xs * 1.5,
    paddingHorizontal: Spacing.sm * 1.25,
    paddingRight: Spacing.lg - Spacing.sm,
    flexShrink: 1,
  },
  otherMessage: {
    backgroundColor: Colors.text.chatOther,
    marginRight: 55,
    alignSelf: 'flex-start',
    borderRadius: Borders.radius.lg - 7,
    borderTopLeftRadius: Borders.radius.xxs,
    ...Shadows.default,
    borderWidth: 0,
    minHeight: 30,
    paddingVertical: Spacing.xs * 1.5,
    paddingHorizontal: Spacing.sm * 1.25,
    paddingLeft: Spacing.lg - Spacing.sm,
    flexShrink: 1,
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
  attachButton: {
    padding: Spacing.sm,
    marginRight: Spacing.xs * 1.5,
    marginBottom: Platform.OS === 'ios' ? 0 : Spacing.xs * 1.5,
    borderRadius: Borders.radius.sm,
    backgroundColor: Colors.background.disabled,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderRadius: Borders.radius.lg,
    paddingHorizontal: Spacing.lg - 1,
    paddingTop: Spacing.sm * 1.25,
    paddingBottom: Spacing.sm * 1.25,
    fontSize: Typography.fontSizes.md,
    maxHeight: 120,
    marginRight: Spacing.xs * 1.5,
    borderColor: Colors.border.light,
    borderWidth: Borders.width.sm,
    minHeight: 40,
    textAlignVertical: 'top',
    ...Shadows.input,
  },
  sendButton: {
    borderRadius: Borders.radius.circular,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs * 1.5,
    marginBottom: Platform.OS === 'ios' ? 0 : Spacing.xs * 1.5,
    ...Shadows.default,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: Borders.radius.circular,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollToEndButton: {
    position: 'absolute',
    right: Spacing.xl,
    width: 40,
    height: 40,
    borderRadius: Borders.radius.circular,
    backgroundColor: `rgba(${parseInt(Colors.primary.dark.slice(1, 3), 16)}, ${parseInt(Colors.primary.dark.slice(3, 5), 16)}, ${parseInt(Colors.primary.dark.slice(5, 7), 16)}, 0.8)`,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    ...Shadows.scrollToEnd,
  },
  systemMessageContainer: {
    backgroundColor: '#fffbe6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffe082',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    maxWidth: '90%',
    shadowColor: '#ffe082',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  systemMessageText: {
    color: '#b8860b',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
    flex: 1,
  },
  systemTimeText: {
    color: '#b8860b',
    fontSize: 11,
    marginLeft: 8,
    alignSelf: 'flex-end',
  },
});

