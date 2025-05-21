import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert, Modal, Pressable, Vibration } from 'react-native';
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
  const [initialScrollDone, setInitialScrollDone] = useState(false); // Estado para controlar a rolagem inicial
  const [messageModalVisible, setMessageModalVisible] = useState(false); // Estado para controlar a visibilidade do modal de mensagem
  const [selectedMessage, setSelectedMessage] = useState(null); // Estado para armazenar a mensagem selecionada

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
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40; // Ajuste para a margem inferior
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
            { alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', position: 'relative', paddingRight: isMe ? 10 : undefined, paddingLeft: !isMe ? 10 : undefined },
            pressed && { opacity: 0.8 }
          ]}
        >
          {renderAvatar(item, isMe)}
          <View style={{/* Removido flex: 1 */}}>{/* Conteúdo da mensagem */}
            {!isMe && (
              <Text style={styles.userName}>{item.userName || 'Usuário'}</Text>
            )}
            <View style={{ flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: 200, height: 200, borderRadius: 10, marginBottom: 4, backgroundColor: '#eee' }}
                resizeMode="cover"
              />
              <Text style={[styles.timeText, isMe && { color: '#FFFFFF' }]}>{formatTime(item.timestamp)}</Text>
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
          { alignSelf: isMe ? 'flex-end' : 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', position: 'relative', paddingRight: isMe ? 10 : undefined, paddingLeft: !isMe ? 10 : undefined },
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
              borderTopColor: isMe ? '#007AFF' : '#FFFFFF',
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
              borderTopColor: isMe ? '#007AFF' : '#FFFFFF',
            }} />
          </View>
        )}
        {renderAvatar(item, isMe)}
        <View style={{/* Removido flex: 1 */}}>{/* Conteúdo da mensagem */}
          {!isMe && (
            <Text style={styles.userName}>{item.userName || 'Usuário'}</Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>{/* Ajustado alignItems */}
            <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.text}</Text>
            <Text style={[styles.timeText, isMe && { color: '#FFFFFF' }, !isMe && { color: '#666666' }]}>  {formatTime(item.timestamp)}</Text>
          </View>
        </View>
      </Pressable>
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
              <Text style={styles.modalCloseButtonText}>Fechar</Text>
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
              <Text style={[styles.fullScreenModalText, selectedMessage?.userId === user?.id && { color: '#FFFFFF' }]}>
                {selectedMessage?.text}
              </Text>
            )}
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
    backgroundColor: '#FFFFFF', // Fundo branco para o modal
    borderRadius: 12, // Raio de borda ligeiramente menor
    padding: 24,
    alignItems: 'center',
    minWidth: 280, // Aumentar largura mínima
    elevation: 8, // Sombra mais proeminente para modal
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  profileModalAvatar: {
    width: 80, // Aumentar tamanho do avatar no modal
    height: 80,
    borderRadius: 40, // Metade da largura/altura para círculo perfeito
    marginBottom: 16,
    backgroundColor: '#E0E0E0', // Cinza claro padrão
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3, // Borda um pouco mais grossa
    borderColor: '#007AFF', // Cor primária
  },
  profileModalName: {
    fontSize: 22, // Aumentar tamanho da fonte
    fontWeight: '600', // Peso da fonte semi-bold
    marginBottom: 4,
    color: '#333333', // Cor de texto mais escura
  },
  profileModalEmail: {
    fontSize: 15,
    color: '#666666', // Cinza médio para email
    marginBottom: 8,
  },
  profileModalId: {
    fontSize: 13,
    color: '#888888', // Cinza mais claro para ID
    marginBottom: 20,
  },
  modalCloseButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#007AFF', // Fundo com cor primária
    alignSelf: 'stretch', // Ocupar largura total
    alignItems: 'center',
  },
  modalCloseButtonText: { // Adicionar estilo para o texto do botão
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#E0EAF5', // Um azul bem clarinho
    padding: 0, // Remover padding do container principal
  },
  title: {
    // Manter ou remover se não for necessário na tela de chat
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#007AFF',
  },
  messagesList: {
    flexGrow: 1,
    paddingVertical: 10, // Adicionar padding vertical
    paddingHorizontal: 8, // Adicionar padding horizontal
    paddingBottom: 90, // espaço extra para input flutuante
  },
  avatar: {
    width: 36, // Tamanho um pouco menor para o avatar na lista
    height: 36,
    borderRadius: 18,
    marginHorizontal: 4, // Espaçamento horizontal menor
    backgroundColor: '#E0E0E0',
    borderWidth: 2, // Borda ligeiramente mais fina
    borderColor: '#007AFF', // Cor primária
    // Remover sombras excessivas aqui, a sombra será na bolha da mensagem
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    overflow: 'hidden',
  },
  avatarDefault: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#BDBDBD', // Cinza um pouco mais escuro para default
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 17,
    // Manter fontes do sistema, mas garantir fallback
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  deleteButton: {
    position: 'absolute',
    top: 6, // Ajustar posição
    right: 6,
    zIndex: 10,
    padding: 4, // Aumentar área clicável
  },
  deleteIcon: {
    fontSize: 16, // Tamanho um pouco menor
    color: '#FFFFFF', // Ícone branco para contraste
    opacity: 1, // Remover opacidade
    textShadowColor: 'rgba(0, 0, 0, 0.2)', // Sombra leve para destaque
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  messageContainer: {
    marginVertical: 2, // Reduzir ainda mais a margem vertical
    borderRadius: 18, // Aumentar ligeiramente o raio de borda geral
    paddingHorizontal: 10, // Ajustar padding horizontal
    paddingVertical: 7, // Ajustar padding vertical
    shadowColor: '#000', // Sombra geral para bolhas
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, // Sombra mais sutil
    shadowRadius: 2, // Raio da sombra menor
    elevation: 1, // Elevação menor
    alignSelf: 'flex-start',
    maxWidth: '85%',
    minWidth: 50, // Manter um minWidth razoável
    flexDirection: 'row', // Manter flexDirection row
    alignItems: 'flex-end', // Alinhar itens ao final (para timestamp)
    marginBottom: 4, // Ajustar margem inferior
    opacity: 1,
  },
  myMessage: {
    backgroundColor: '#007AFF', // Azul principal
    marginLeft: 55, // Ajustar margem para a direita
    alignSelf: 'flex-end',
    borderRadius: 18,
    borderTopRightRadius: 5, // Canto superior direito menos arredondado
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 0,
    minHeight: 30, // Altura mínima menor
    paddingVertical: 6, // Ajustar padding vertical
    paddingHorizontal: 10, // Ajustar padding horizontal
    paddingRight: 18, // Espaço para a cauda
    flexShrink: 1,
  },
  myMessageTail: {
    position: 'absolute',
    right: -5, // Ajustar posição
    bottom: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10, // Ajustar tamanho da cauda
    borderRightWidth: 0,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#007AFF', // Cor da cauda
    transform: [{ rotate: '90deg' }],
    zIndex: -1,
  },
  otherMessage: {
    backgroundColor: '#FFFFFF', // Mantido branco
    marginRight: 55, // Ajustar margem para a esquerda
    alignSelf: 'flex-start',
    borderRadius: 18,
    borderTopLeftRadius: 5, // Canto superior esquerdo menos arredondado
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 0,
    minHeight: 30, // Altura mínima menor
    paddingVertical: 6, // Ajustar padding vertical
    paddingHorizontal: 10, // Ajustar padding horizontal
    paddingLeft: 18, // Espaço para a cauda
    flexShrink: 1,
  },
  otherMessageTail: {
    position: 'absolute',
    left: -5, // Ajustar posição
    bottom: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 0,
    borderRightWidth: 10, // Ajustar tamanho da cauda
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF', // Cor da cauda
    transform: [{ rotate: '-90deg' }],
    zIndex: -1,
  },
  messageText: {
    fontSize: 15, // Tamanho da fonte ligeiramente menor
    color: '#000000',
    flexShrink: 1,
    paddingHorizontal: 0, // Remover padding horizontal aqui
    // Adicionar lineHeight para melhor leitura
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
    fontWeight: 'normal',
  },
  timeText: {
    fontSize: 9, // Tamanho menor para timestamp
    color: '#FFFFFF',
    marginTop: 0, // Remover margem superior
    marginLeft: 8, // Espaço à esquerda
    alignSelf: 'flex-end', // Alinhar à direita dentro da bolha
    // Adicionar um pequeno padding para não colar no texto/imagem
    paddingLeft: 4,
  },
  deletedText: {
    fontSize: 14, // Tamanho da fonte ajustado
    color: '#888888',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  deletedIcon: {
    fontSize: 16, // Tamanho ajustado
    color: '#888888',
  },
  userName: {
    fontSize: 12, // Tamanho menor para nome de usuário
    fontWeight: '700',
    color: '#4A90E2',
    marginBottom: 1, // Reduzir margem inferior
    marginLeft: 0, // Remover margem esquerda (avatar já tem)
    letterSpacing: 0,
    // Manter fontes do sistema
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Alinhar itens na parte inferior
    paddingVertical: 6, // Ajustar padding vertical
    paddingHorizontal: 8, // Ajustar padding horizontal
    backgroundColor: '#F8F8F8', // Fundo cinza mais claro para input area
    borderTopWidth: 1,
    borderColor: '#EEEEEE', // Borda superior mais clara
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6, // Ajustar padding inferior para iOS
  },
  attachButton: {
    padding: 8, // Ajustar padding
    marginRight: 6, // Ajustar espaço
    marginBottom: Platform.OS === 'ios' ? 0 : 6, // Alinhar com input no Android
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10, // Ajustar padding top
    paddingBottom: 10, // Ajustar padding bottom
    fontSize: 16,
    maxHeight: 120,
    marginRight: 6, // Ajustar espaço
    borderColor: '#E0E0E0',
    borderWidth: 1,
    // Adicionar minHeight para garantir altura mínima mesmo vazio
    minHeight: 40,
    // Alinhar texto ao topo para multilinha
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6, // Ajustar espaço
    marginBottom: Platform.OS === 'ios' ? 0 : 6, // Alinhar com input no Android
  },
  scrollToEndButton: {
    position: 'absolute',
    bottom: 100, // Ajustar posição acima do input area
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fundo semi-transparente
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  scrollToEndIcon: {
    color: '#FFFFFF',
    fontSize: 20,
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
    borderRadius: 10,
  },
  fullScreenModalText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  fullScreenModalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
});

