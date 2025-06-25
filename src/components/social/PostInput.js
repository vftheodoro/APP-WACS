import React, { useState, useRef } from 'react';
import { View, TextInput, Image, Pressable, StyleSheet, ActivityIndicator, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Borders, Shadows } from '../../theme';

export default function PostInput({ user, onPublish, loading }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const scaleImgBtn = useRef(new Animated.Value(1)).current;
  const scaleSendBtn = useRef(new Animated.Value(1)).current;
  const [cardAnim] = useState(new Animated.Value(1));

  const pickImage = async () => {
    Animated.sequence([
      Animated.timing(scaleImgBtn, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleImgBtn, { toValue: 1, duration: 80, useNativeDriver: true })
    ]).start();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePublish = () => {
    Animated.sequence([
      Animated.timing(scaleSendBtn, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleSendBtn, { toValue: 1, duration: 80, useNativeDriver: true })
    ]).start();
    if (!text.trim() && !image) return;
    onPublish({ text: text.trim(), imageUri: image });
    setText('');
    setImage(null);
  };

  // Efeito de escala/sombra ao focar no input
  const handleFocus = () => {
    setInputFocused(true);
    Animated.timing(cardAnim, {
      toValue: 1.025,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };
  const handleBlur = () => {
    setInputFocused(false);
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.cardShadow, { transform: [{ scale: cardAnim }] }]}>
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.avatarShadow}>
            <Image source={{ uri: user?.photoURL || 'https://via.placeholder.com/48/BDBDBD/FFFFFF?text=VP' }} style={styles.feedProfilePic} />
          </View>
          <TextInput
            style={[styles.postInput, inputFocused && styles.postInputFocused]}
            placeholder="Compartilhe algo legal com a comunidade WACS..."
            placeholderTextColor={Colors.text.darkTertiary}
            multiline
            value={text}
            onChangeText={setText}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </View>
        {image && (
          <View style={styles.previewImageContainer}>
            <Image source={{ uri: image }} style={styles.previewImage} />
            <Pressable style={styles.removeImageBtn} onPress={() => setImage(null)} hitSlop={12}>
              <Ionicons name="close-circle" size={28} color="#fff" style={{ textShadowColor: '#000', textShadowRadius: 6 }} />
            </Pressable>
          </View>
        )}
        <View style={styles.postActions}>
          <Animated.View style={{ transform: [{ scale: scaleImgBtn }] }}>
            <Pressable style={styles.postActionButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={Typography.fontSizes.xl} color={Colors.primary.dark} />
            </Pressable>
          </Animated.View>
          <LinearGradient
            colors={[Colors.primary.dark, Colors.primary.light]}
            style={styles.publishButtonGradient}
          >
            <Animated.View style={{ transform: [{ scale: scaleSendBtn }] }}>
              <Pressable style={styles.publishButton} onPress={handlePublish} disabled={loading || (!text.trim() && !image)}>
                {loading ? <ActivityIndicator color={Colors.text.lightOnPrimary} /> : (
                  <Ionicons name="send" size={Typography.fontSizes.lg} color={Colors.text.lightOnPrimary} />
                )}
              </Pressable>
            </Animated.View>
          </LinearGradient>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 16,
    borderRadius: 32,
    marginBottom: Spacing.xl,
    backgroundColor: 'transparent',
  },
  postCard: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.96)' : '#fff',
    borderRadius: 32,
    paddingVertical: Spacing.xl + 4,
    paddingHorizontal: Spacing.xl + 2,
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
    borderRadius: 28,
    marginRight: Spacing.md,
  },
  feedProfilePic: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.primary.dark,
    backgroundColor: Colors.background.disabled,
  },
  postInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: Colors.background.screen,
    borderRadius: Borders.radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSizes.md,
    color: Colors.text.darkPrimary,
    textAlignVertical: 'top',
    borderWidth: Borders.width.sm,
    borderColor: Colors.border.light,
    transition: 'border-color 0.2s',
  },
  postInputFocused: {
    borderColor: Colors.primary.dark,
    shadowColor: Colors.primary.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  previewImageContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
    marginTop: 2,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: Borders.radius.md,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.disabled,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    zIndex: 2,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Borders.radius.xs,
    backgroundColor: Colors.background.disabled,
    marginRight: Spacing.md,
  },
  publishButtonGradient: {
    borderRadius: Borders.radius.sm,
    overflow: 'hidden',
    shadowColor: Colors.primary.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  publishButton: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg + 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 