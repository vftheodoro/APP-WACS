import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Modal, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Borders, Shadows } from '../../theme';

const fallbackAvatar = 'https://via.placeholder.com/48/BDBDBD/FFFFFF?text=U';

function getRelativeDate(date) {
  if (!date) return '';
  let d;
  if (date.seconds) d = new Date(date.seconds * 1000);
  else d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const postDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today - postDay) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return `Hoje, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return 'Ontem';
  } else if (diffDays < 7) {
    return `${diffDays} dias atrás`;
  } else {
    return d.toLocaleDateString('pt-BR', { dateStyle: 'short' });
  }
}

export default function PostCard({ post, onLike, onComment, isLiked, userId, onDelete, onEdit }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [likeAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [imgAnim] = useState(new Animated.Value(0.95));
  const [avatarPulse] = useState(new Animated.Value(1));
  const [imgModal, setImgModal] = useState(false);
  const [imgModalAnim] = useState(new Animated.Value(0));
  const formattedDate = getRelativeDate(post.createdAt);
  const isOwner = userId === post.userId;

  // Fade-in do card
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Zoom-in da imagem
  useEffect(() => {
    if (post.imageUrl) {
      Animated.timing(imgAnim, {
        toValue: 1,
        duration: 400,
        delay: 100,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    }
  }, [post.imageUrl]);

  // Pulse do avatar ao publicar
  useEffect(() => {
    if (isOwner) {
      Animated.sequence([
        Animated.timing(avatarPulse, { toValue: 1.15, duration: 200, useNativeDriver: true }),
        Animated.timing(avatarPulse, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, []);

  // Animação de pop no coração ao curtir
  const handleLikePress = () => {
    Animated.sequence([
      Animated.timing(likeAnim, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.timing(likeAnim, { toValue: 1, duration: 120, useNativeDriver: true })
    ]).start();
    onLike && onLike(post.id, isLiked);
  };

  // Abrir imagem em tela cheia
  const handleImagePress = () => {
    setImgModal(true);
    imgModalAnim.setValue(0);
    Animated.timing(imgModalAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeImgModal = () => {
    Animated.timing(imgModalAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setImgModal(false));
  };

  const { width, height } = Dimensions.get('window');

  return (
    <Animated.View style={[styles.cardShadow, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }, isOwner && styles.ownerBorder]}>
      <View style={styles.feedCard}>
        <View style={styles.feedHeader}>
          <Animated.Image
            source={{ uri: post.userPhoto || fallbackAvatar }}
            style={[styles.feedProfilePic, { transform: [{ scale: avatarPulse }] }]}
            onError={e => (e.target.src = fallbackAvatar)}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.feedName}>{post.userName}</Text>
            <Text style={styles.feedTime}>{formattedDate}</Text>
          </View>
          {isOwner && (
            <Pressable onPress={() => setMenuVisible(true)} style={styles.menuBtn} hitSlop={10} android_ripple={{ color: Colors.primary.light }}>
              <Ionicons name="ellipsis-vertical" size={22} color={Colors.text.darkSecondary} />
            </Pressable>
          )}
        </View>
        <Text style={styles.feedText}>{post.text}</Text>
        {post.imageUrl && (
          <Pressable onPress={handleImagePress} style={{ borderRadius: Borders.radius.md, overflow: 'hidden' }}>
            <Animated.Image source={{ uri: post.imageUrl }} style={[styles.feedPostImage, { transform: [{ scale: imgAnim }] }]} />
          </Pressable>
        )}
        <View style={styles.feedActions}>
          <Pressable
            style={({ pressed }) => [styles.feedActionItem, isLiked && styles.liked, pressed && styles.actionPressed]}
            onPress={handleLikePress}
          >
            <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={26} color={isLiked ? '#E53935' : '#E53935'} />
            </Animated.View>
            <Text style={[styles.feedActionText, isLiked && styles.likedText]}>{post.likes?.length || 0}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.feedActionItem, pressed && styles.actionPressed]}
            onPress={() => onComment && onComment(post)}
          >
            <Ionicons name="chatbubble-outline" size={24} color={Colors.text.darkSecondary} />
            <Text style={styles.feedActionText}>{post.comments?.length || 0}</Text>
          </Pressable>
        </View>
        {/* Menu de opções */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
            <Animated.View style={[styles.menuModal, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }] }>
              <Pressable style={styles.menuItem} onPress={() => { setMenuVisible(false); onEdit && onEdit(post); }}>
                <Ionicons name="create-outline" size={20} color={Colors.primary.dark} style={{ marginRight: 8 }} />
                <Text style={styles.menuText}>Editar</Text>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={() => { setMenuVisible(false); onDelete && onDelete(post); }}>
                <Ionicons name="trash-outline" size={20} color={Colors.danger.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.menuText, { color: Colors.danger.primary }]}>Apagar</Text>
              </Pressable>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
        {/* Modal de imagem em tela cheia */}
        <Modal
          visible={imgModal}
          transparent
          animationType="none"
          onRequestClose={closeImgModal}
        >
          <TouchableOpacity style={styles.imgModalOverlay} activeOpacity={1} onPress={closeImgModal}>
            <Animated.View style={[styles.imgModalContent, { opacity: imgModalAnim }] }>
              <Image source={{ uri: post.imageUrl }} style={{ width: width, height: height, resizeMode: 'contain', backgroundColor: '#000' }} />
              <Pressable style={styles.imgModalClose} onPress={closeImgModal} hitSlop={16}>
                <Ionicons name="close-circle" size={38} color="#fff" />
              </Pressable>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    ...Shadows.lg,
    borderRadius: Borders.radius.lg,
    marginBottom: Spacing.xl,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  ownerBorder: {
    borderWidth: 2,
    borderColor: Colors.primary.dark,
  },
  feedCard: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: Borders.radius.lg,
    padding: Spacing.xl,
    borderWidth: 0,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  feedProfilePic: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary.dark,
    backgroundColor: Colors.background.disabled,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  menuBtn: {
    padding: 4,
    marginLeft: 8,
  },
  feedName: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text.darkPrimary,
  },
  feedTime: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.text.darkSecondary,
    marginTop: 2,
  },
  feedText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.text.darkPrimary,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  feedPostImage: {
    width: '100%',
    height: 220,
    borderRadius: Borders.radius.md,
    resizeMode: 'cover',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.disabled,
  },
  feedActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  feedActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginRight: Spacing.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: Colors.background.disabled,
    justifyContent: 'center',
  },
  actionPressed: {
    backgroundColor: Colors.primary.light,
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  feedActionText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.text.darkSecondary,
    marginLeft: Spacing.xs,
    fontWeight: 'bold',
  },
  liked: {
    backgroundColor: Colors.primary.light,
  },
  likedText: {
    color: Colors.primary.dark,
    fontWeight: 'bold',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuModal: {
    backgroundColor: '#fff',
    borderRadius: Borders.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 180,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuText: {
    fontSize: Typography.fontSizes.md,
    color: Colors.text.darkPrimary,
    fontWeight: 'bold',
  },
  imgModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imgModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  imgModalClose: {
    position: 'absolute',
    top: 32,
    right: 24,
    zIndex: 10,
  },
}); 