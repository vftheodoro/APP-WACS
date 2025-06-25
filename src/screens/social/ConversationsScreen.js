import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, StatusBar, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Borders, Shadows } from '../../theme';
import { fetchAllChats, getNearbyCitiesByDistance } from '../../services/firebase/locations';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserData, getUserData, getUsersByIds, addUserToRegionalChat } from '../../services/firebase/user';
import { getFirestore, collection as firestoreCollection, getDocs } from 'firebase/firestore';

// Imagens públicas representativas das cidades do Vale do Ribeira (Wikimedia Commons ou Google Images)
const cityImages = {
  'Apiaí': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Apiai_SP_Centro.jpg',
  'Barra do Chapéu': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Barra_do_Chapeu_SP_Prefeitura.jpg',
  'Barra do Turvo': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Barra_do_Turvo_SP_Centro.jpg',
  'Cajati': 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Cajati_SP_Centro.jpg',
  'Cananéia': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Cananeia_SP_Centro.jpg',
  'Eldorado': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Eldorado_SP_Centro.jpg',
  'Iguape': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Iguape_SP_Centro.jpg',
  'Ilha Comprida': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Ilha_Comprida_SP_Praia.jpg',
  'Iporanga': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Iporanga_SP_Centro.jpg',
  'Itaoca': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Itaoca_SP_Centro.jpg',
  'Itapirapuã Paulista': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Itapirapua_Paulista_SP_Centro.jpg',
  'Itariri': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Itariri_SP_Centro.jpg',
  'Jacupiranga': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Jacupiranga_SP_Prefeitura.jpg',
  'Juquiá': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Juquia_SP_Centro.jpg',
  'Juquitiba': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Juquitiba_SP_Centro.jpg',
  'Miracatu': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Miracatu_SP_Centro.jpg',
  'Pariquera-Açu': 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Pariquera-Acu_SP_Centro.jpg',
  'Pedro de Toledo': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Pedro_de_Toledo_SP_Centro.jpg',
  'Registro': 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Registro-SP-Ponte.jpg',
  'Ribeira': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Ribeira_SP_Centro.jpg',
  'São Lourenço da Serra': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Sao_Lourenco_da_Serra_SP_Centro.jpg',
  'Sete Barras': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Sete_Barras_SP_Centro.jpg',
  'Tapiraí': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Tapirai_SP_Centro.jpg',
};

// Componente para imagem da cidade com fallback
function CityImage({ cidade, style }) {
  const [showFallback, setShowFallback] = useState(false);
  useEffect(() => {
    setShowFallback(false);
    let timeout;
    if (cityImages[cidade]) {
      timeout = setTimeout(() => setShowFallback(true), 2000);
    }
    return () => clearTimeout(timeout);
  }, [cidade]);
  if (!cityImages[cidade] || showFallback) {
    return (
      <Image
        source={require('../../../assets/logos_wacs/logo_padrao.png')}
        style={style}
        resizeMode="cover"
      />
    );
  }
  return (
    <Image
      source={{ uri: cityImages[cidade] }}
      style={style}
      resizeMode="cover"
      onLoad={() => setShowFallback(false)}
      onError={() => setShowFallback(true)}
    />
  );
}

export const ConversationsScreen = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const [chats, setChats] = React.useState([]);
  const [loadingChats, setLoadingChats] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [joiningChatId, setJoiningChatId] = React.useState(null);
  const [showAll, setShowAll] = React.useState(false);
  const [search, setSearch] = React.useState('');
  // Estado para controlar carregamento/erro das imagens
  const [imageStatus, setImageStatus] = React.useState({}); // { cidade: 'loading' | 'loaded' | 'error' }
  const [joinedChats, setJoinedChats] = React.useState(user?.joinedChats || []);

  const loadChats = React.useCallback(() => {
    if (!user) return;
    setLoadingChats(true);
    fetchAllChats(user.cidade).then(setChats).finally(() => setLoadingChats(false));
  }, [user]);

  React.useEffect(() => {
    loadChats();
  }, [loadChats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllChats(user.cidade).then(setChats).finally(() => setRefreshing(false));
  };

  // Atualiza joinedChats localmente e no Firestore/contexto
  const addJoinedChat = async (chatId) => {
    if (!user || !chatId) return;
    // Evita duplicidade
    if (joinedChats.includes(chatId)) return;
    const newJoined = [...joinedChats, chatId];
    setJoinedChats(newJoined);
    // Atualiza no Firestore
    await updateUserData(user.id, { joinedChats: newJoined });
    // Atualiza no contexto
    if (updateUser) {
      updateUser({ joinedChats: newJoined });
    }
  };

  // Atualiza joinedChats ao carregar usuário
  React.useEffect(() => {
    setJoinedChats(user?.joinedChats || []);
  }, [user]);

  // Função para entrar em um grupo de cidade
  const handleJoinChat = async (chatId, chatCidade) => {
    setJoiningChatId(chatId);
    try {
      const db = require('firebase/firestore').getFirestore();
      const chatRef = require('firebase/firestore').doc(db, 'chats', chatId);
      await require('firebase/firestore').updateDoc(chatRef, {
        members: require('firebase/firestore').arrayUnion(user.id)
      });
      // Se não for o chat da cidade do usuário, salva no perfil
      if (chatCidade !== user.cidade) {
        await addJoinedChat(chatId);
      }
      fetchAllChats(user.cidade).then(setChats);
    } catch (e) {
      alert('Erro ao entrar no grupo: ' + (e?.message || e));
    } finally {
      setJoiningChatId(null);
    }
  };

  // Filtragem inteligente: cidade do usuário + 4 cidades próximas
  let filteredChats = chats;
  const cidadesProximas = user?.cidade ? getNearbyCitiesByDistance(user.cidade, 5) : [];
  if (!showAll && !search) {
    filteredChats = chats.filter(chat =>
      chat.type === 'regional' ||
      (chat.type === 'cidade' && cidadesProximas.includes(chat.cidade))
    );
  }
  if (search) {
    filteredChats = chats.filter(chat =>
      chat.type === 'regional' ||
      (chat.cidade && chat.cidade.toLowerCase().includes(search.toLowerCase()))
    );
  }
  // Priorizar: regional > cidade do usuário > joinedChats > demais
  filteredChats = filteredChats.sort((a, b) => {
    if (a.type === 'regional') return -1;
    if (b.type === 'regional') return 1;
    if (a.cidade === user.cidade) return -1;
    if (b.cidade === user.cidade) return 1;
    if (joinedChats.includes(a.id) && !joinedChats.includes(b.id)) return -1;
    if (joinedChats.includes(b.id) && !joinedChats.includes(a.id)) return 1;
    return (a.cidade || a.name).localeCompare(b.cidade || b.name);
  });

  // Renderização dos chats
  const renderChatItem = (chat) => {
    const isRegional = chat.type === 'regional';
    const isUserCity = chat.cidade === user.cidade;
    const isJoined = joinedChats.includes(chat.id);
    const isMember = isRegional || isUserCity || isJoined || (chat.members && chat.members.includes(user.id));
    const canJoin = chat.type === 'cidade' && !isMember;
    return (
      <View
        key={chat.id}
        style={[
          styles.chatCard,
          isUserCity && styles.chatCardUserCity,
          isRegional && styles.chatCardRegional,
          !isMember && styles.chatCardNotMember,
        ]}
      >
        <Pressable
          style={({ pressed }) => [styles.cardContent, pressed && { opacity: 0.85 }]}
          onPress={() => {
            if (isMember) {
              const parentNav = navigation.getParent();
              if (parentNav) {
                parentNav.navigate('ChatScreen', { chatId: chat.id, chatName: chat.name });
              } else {
                navigation.navigate('ChatScreen', { chatId: chat.id, chatName: chat.name });
              }
            }
          }}
          disabled={!isMember}
          android_ripple={{ color: Colors.primary.light + '33' }}
        >
          <View style={styles.iconContainer}>
            {chat.type === 'cidade' ? (
              <View style={styles.cityImageWrapper}>
                <CityImage cidade={chat.cidade} style={styles.cityImage} />
              </View>
            ) : (
              <LinearGradient
                colors={isRegional ? ['#1976d2', '#2196f3'] : ['#fff', '#e3f2fd']}
                style={styles.iconGradient}
              >
                <Ionicons
                  name={isRegional ? 'earth' : 'chatbubbles-outline'}
                  size={36}
                  color={isRegional ? '#fff' : '#1976d2'}
                  style={{ alignSelf: 'center' }}
                />
              </LinearGradient>
            )}
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.chatName, isUserCity && { color: '#1976d2' }]} numberOfLines={1}>
              {chat.name}
            </Text>
            {isRegional ? (
              <Text style={styles.chatSubtitle}>Converse com todos da região do Vale do Ribeira</Text>
            ) : isUserCity ? (
              <Text style={styles.chatSubtitle}>Chat da sua cidade</Text>
            ) : (
              <Text style={styles.chatSubtitle}>Grupo da cidade de {chat.cidade}</Text>
            )}
            {!isMember && (
              <View style={styles.badgeNovo}>
                <Text style={styles.badgeNovoText}>Novo</Text>
              </View>
            )}
          </View>
        </Pressable>
        {canJoin && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => handleJoinChat(chat.id, chat.cidade)}
            disabled={joiningChatId === chat.id}
            activeOpacity={0.8}
          >
            {joiningChatId === chat.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.joinButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.dark} />
      {/* Só renderiza o header se NÃO estiver dentro de um parent (ou seja, não está em uma Tab) */}
      {navigation.getParent() == null && (
        <LinearGradient
          colors={[Colors.primary.dark, Colors.primary.light]}
          style={styles.header}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chatbubbles" size={28} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.headerTitle}>Chats do Vale do Ribeira</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton} accessibilityLabel="Atualizar lista de chats">
              <Ionicons name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary.dark]} />}
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          style={{
            backgroundColor: Colors.background.card,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: 16,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: Colors.border.light,
            color: Colors.text.darkPrimary,
          }}
          placeholder="Buscar cidade..."
          placeholderTextColor={Colors.text.darkTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {loadingChats ? (
          <ActivityIndicator size="large" color={Colors.primary.dark} style={{ marginTop: 48 }} />
        ) : filteredChats.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum chat disponível no momento.</Text>
        ) : (
          filteredChats.map(renderChatItem)
        )}
        {!showAll && !search && chats.some(chat => chat.type === 'cidade' && !cidadesProximas.includes(chat.cidade)) && (
          <TouchableOpacity
            style={{ alignSelf: 'center', marginTop: 10, backgroundColor: Colors.primary.dark, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 }}
            onPress={() => setShowAll(true)}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Ver mais cidades</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background.screen,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingBottom: 18,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 6,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.5,
  },
  refreshButton: {
    marginLeft: 10,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scrollViewContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  chatCard: {
    backgroundColor: Colors.background.card,
    borderRadius: Borders.radius.lg,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    ...Shadows.default,
    borderWidth: 1,
    borderColor: Colors.border.light,
    minHeight: 80,
  },
  chatCardUserCity: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd',
  },
  chatCardRegional: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd',
  },
  chatCardNotMember: {
    opacity: 0.85,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityImageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.border.light,
    borderWidth: 2,
    borderColor: Colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 0,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  chatName: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.text.darkPrimary,
    marginBottom: 2,
  },
  chatSubtitle: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.text.darkSecondary,
    marginBottom: 2,
  },
  badgeNovo: {
    backgroundColor: Colors.primary.dark,
    borderRadius: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeNovoText: {
    color: '#fff',
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
  joinButton: {
    backgroundColor: Colors.primary.dark,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginLeft: 12,
    alignSelf: 'center',
    ...Shadows.sm,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: Typography.fontSizes.md,
    letterSpacing: 0.5,
  },
  emptyText: {
    color: Colors.text.darkTertiary,
    fontSize: Typography.fontSizes.md,
    textAlign: 'center',
    marginTop: 48,
    fontStyle: 'italic',
  },
}); 