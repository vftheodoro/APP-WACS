import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, TextInput, Pressable, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Borders } from '../../theme';

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

export default function CommentsModal({ visible, onClose, post, comments = [], onAddComment, onDeleteComment, user, loading, onLikeComment }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSend = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    await onAddComment(comment.trim());
    setComment('');
    setSubmitting(false);
  };

  const handleDelete = async (commentId) => {
    if (!onDeleteComment) return;
    await onDeleteComment(commentId);
  };

  const handleLike = async (comment) => {
    if (!onLikeComment) return;
    await onLikeComment(comment.id, comment.likes?.includes(user?.id));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Comentários</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={Colors.text.darkPrimary} />
            </Pressable>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary.dark} style={{ marginTop: 32 }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={item => item.id || item.createdAt}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Image source={{ uri: item.userPhoto || 'https://via.placeholder.com/40/BDBDBD/FFFFFF?text=U' }} style={styles.avatar} />
                  <View style={styles.commentContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.commentName}>{item.userName}</Text>
                        {user?.id === item.userId && (
                          <Pressable onPress={() => handleDelete(item.id)} hitSlop={8} style={{ marginLeft: 8 }}>
                            <Ionicons name="trash-outline" size={18} color={Colors.danger.primary} />
                          </Pressable>
                        )}
                      </View>
                      <Pressable style={styles.likeBtn} onPress={() => handleLike(item)} hitSlop={8}>
                        <Ionicons name={item.likes?.includes(user?.id) ? 'heart' : 'heart-outline'} size={20} color={item.likes?.includes(user?.id) ? '#E53935' : '#E53935'} />
                        <Text style={styles.likeCount}>{item.likes?.length || 0}</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.commentText}>{item.text}</Text>
                    <Text style={styles.commentDate}>{getRelativeDate(item.createdAt)}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Nenhum comentário ainda.</Text>}
              style={{ flexGrow: 0, maxHeight: 300 }}
            />
          )}
          <View style={styles.inputRow}>
            <Image source={{ uri: user?.photoURL || 'https://via.placeholder.com/40/BDBDBD/FFFFFF?text=U' }} style={styles.avatar} />
            <TextInput
              style={styles.input}
              placeholder="Adicionar um comentário..."
              value={comment}
              onChangeText={setComment}
              editable={!submitting}
            />
            <Pressable onPress={handleSend} disabled={submitting || !comment.trim()} style={styles.sendBtn}>
              {submitting ? <ActivityIndicator size="small" color={Colors.primary.dark} /> : <Ionicons name="send" size={22} color={Colors.primary.dark} />}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  modalContent: {
    backgroundColor: Colors.background.card,
    borderRadius: Borders.radius.lg,
    padding: Spacing.lg,
    width: '90%',
    maxWidth: 420,
    elevation: 8,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text.darkPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.sm,
    backgroundColor: Colors.background.disabled,
  },
  commentContent: {
    flex: 1,
  },
  commentName: {
    fontWeight: 'bold',
    color: Colors.text.darkPrimary,
    fontSize: Typography.fontSizes.sm,
  },
  commentText: {
    color: Colors.text.darkPrimary,
    fontSize: Typography.fontSizes.md,
    marginTop: 2,
  },
  commentDate: {
    color: Colors.text.darkSecondary,
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.text.darkSecondary,
    marginVertical: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background.screen,
    borderRadius: Borders.radius.md,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.fontSizes.md,
    color: Colors.text.darkPrimary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginRight: Spacing.sm,
  },
  sendBtn: {
    padding: 6,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(229,57,53,0.08)',
  },
  likeCount: {
    marginLeft: 4,
    color: '#E53935',
    fontWeight: 'bold',
    fontSize: Typography.fontSizes.sm,
  },
}); 