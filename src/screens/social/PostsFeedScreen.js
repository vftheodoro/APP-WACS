import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, Borders, Shadows } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import PostInput from '../../components/social/PostInput';
import PostCard from '../../components/social/PostCard';
import { fetchPostsPaginated, createPost, toggleLikePost, addComment, deletePost, fetchComments, deleteComment, toggleLikeComment, updatePost } from '../../services/firebase/posts';
import CommentsModal from '../../components/social/CommentsModal';
import Toast from '../../components/common/Toast';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';

export const PostsFeedScreen = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, type: 'info', message: '' });
  const PAGE_SIZE = 10;

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Você precisa estar logado para acessar o feed da comunidade.
        </Text>
      </View>
    );
  }

  const updateCommentsCountIfNeeded = async (post) => {
    if (typeof post.commentsCount === 'number' && post.commentsCount > 0) return;
    let count = 0;
    try {
      const comments = await fetchComments(post.id);
      count = comments.length;
    } catch {
      if (Array.isArray(post.comments)) count = post.comments.length;
    }
    await updateDoc(doc(db, 'posts', post.id), { commentsCount: count });
  };

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { posts: newPosts, lastDoc: newLastDoc } = await fetchPostsPaginated({ pageSize: PAGE_SIZE });
      // Atualiza commentsCount retroativamente
      for (const post of newPosts) {
        if (typeof post.commentsCount !== 'number' || post.commentsCount === 0) {
          updateCommentsCountIfNeeded(post);
        }
      }
      setPosts(newPosts);
      setLastDoc(newLastDoc);
    } catch (e) {
      setError('Não foi possível carregar o feed. ' + (e?.message || ''));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMorePosts = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const { posts: morePosts, lastDoc: newLastDoc } = await fetchPostsPaginated({ pageSize: PAGE_SIZE, lastDoc });
      setPosts(prev => [...prev, ...morePosts]);
      setLastDoc(newLastDoc);
    } catch (e) {
      setError('Erro ao carregar mais posts. ' + (e?.message || ''));
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const showToast = (type, message) => {
    setToast({ visible: true, type, message });
  };

  const handlePublish = async ({ text, imageUri }) => {
    setLoading(true);
    setError(null);
    try {
      const newPost = await createPost({
        userId: user.uid || user.id,
        userName: user.displayName || user.name,
        userPhoto: user.photoURL,
        text,
        imageUri,
      });
      setPosts(prev => [{ ...newPost, likes: [], commentsCount: 0, createdAt: { seconds: Math.floor(Date.now() / 1000) } }, ...prev]);
      await new Promise(res => setTimeout(res, 1000));
      await loadPosts();
      showToast('success', 'Post publicado com sucesso!');
    } catch (e) {
      setError('Erro ao publicar post. ' + (e?.message || ''));
      showToast('error', 'Erro ao publicar post. ' + (e?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId, liked) => {
    setError(null);
    try {
      await toggleLikePost(postId, user.id, liked);
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id !== postId) return post;
        let newLikes = Array.isArray(post.likes) ? [...post.likes] : [];
        if (liked) {
          newLikes = newLikes.filter(uid => uid !== user.id);
        } else {
          newLikes.push(user.id);
        }
        return { ...post, likes: newLikes };
      }));
      showToast('success', liked ? 'Curtida removida!' : 'Post curtido!');
    } catch (e) {
      setError('Erro ao curtir/descurtir post. ' + (e?.message || ''));
      showToast('error', 'Erro ao curtir/descurtir post. ' + (e?.message || ''));
    }
  };

  const handleComment = async (post) => {
    setSelectedPost(post);
    setCommentsLoading(true);
    try {
      let fetched = await fetchComments(post.id);
      // Se não houver comentários na subcoleção mas houver no array antigo, migrar
      if ((!fetched || fetched.length === 0) && Array.isArray(post.comments) && post.comments.length > 0) {
        for (const c of post.comments) {
          await addComment(post.id, {
            userId: c.userId,
            userName: c.userName,
            userPhoto: c.userPhoto,
            text: c.text,
          });
        }
        fetched = await fetchComments(post.id);
      }
      // Se ainda não houver, usar o array antigo como fallback (apenas leitura)
      if ((!fetched || fetched.length === 0) && Array.isArray(post.comments) && post.comments.length > 0) {
        fetched = post.comments.map((c, idx) => ({ ...c, id: c.createdAt || String(idx), likes: [] }));
      }
      setComments(fetched);
    } catch (e) {
      setComments([]);
    }
    setCommentsLoading(false);
  };

  const handleAddComment = async (text) => {
    if (!user || !selectedPost) return;
    setCommentsLoading(true);
    try {
      await addComment(selectedPost.id, {
        userId: user.id,
        userName: user.name,
        userPhoto: user.photoURL,
        text,
      });
      const updated = await fetchComments(selectedPost.id);
      setComments(updated);
      showToast('success', 'Comentário adicionado!');
      // Atualiza o commentsCount localmente
      setPosts(prevPosts => prevPosts.map(post =>
        post.id === selectedPost.id
          ? { ...post, commentsCount: (typeof post.commentsCount === 'number' ? post.commentsCount + 1 : 1) }
          : post
      ));
    } catch (e) {
      showToast('error', 'Erro ao comentar.');
    }
    setCommentsLoading(false);
  };

  const handleDeleteComment = async (commentId) => {
    if (!user || !selectedPost) return;
    setCommentsLoading(true);
    try {
      await deleteComment(selectedPost.id, commentId, user.id);
      const updated = await fetchComments(selectedPost.id);
      setComments(updated);
      showToast('success', 'Comentário apagado!');
      // Atualiza o commentsCount localmente
      setPosts(prevPosts => prevPosts.map(post =>
        post.id === selectedPost.id
          ? { ...post, commentsCount: Math.max((typeof post.commentsCount === 'number' ? post.commentsCount - 1 : 0), 0) }
          : post
      ));
    } catch (e) {
      showToast('error', 'Erro ao apagar comentário.');
    }
    setCommentsLoading(false);
  };

  const handleLikeComment = async (commentId, liked) => {
    if (!user || !selectedPost) return;
    setCommentsLoading(true);
    try {
      await toggleLikeComment(selectedPost.id, commentId, user.id, liked);
      const updated = await fetchComments(selectedPost.id);
      setComments(updated);
    } catch (e) {}
    setCommentsLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleDeletePost = async (post) => {
    Alert.alert(
      'Apagar post',
      'Tem certeza que deseja apagar este post? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar', style: 'destructive', onPress: async () => {
            try {
              await deletePost(post.id, post.imageUrl);
              setPosts(prev => prev.filter(p => p.id !== post.id));
              showToast('success', 'Post apagado com sucesso!');
              await loadPosts();
            } catch (err) {
              showToast('error', 'Erro ao apagar post: ' + (err?.message || ''));
            }
          }
        }
      ]
    );
  };

  const handleEditPost = async (post, newText) => {
    try {
      await updatePost(post.id, { text: newText });
      setPosts(prevPosts => prevPosts.map(p => p.id === post.id ? { ...p, text: newText } : p));
      showToast('success', 'Post atualizado!');
    } catch (e) {
      showToast('error', 'Erro ao atualizar post.');
    }
  };

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />
      {loading && (
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <ActivityIndicator size="large" color={Colors.primary.dark} />
        </View>
      )}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      {!loading && !error && posts.length === 0 && (
        <Text style={styles.emptyText}>
          Nenhum post encontrado. Seja o primeiro a publicar!
        </Text>
      )}
      <FlatList
        ListHeaderComponent={
          <PostInput user={user} onPublish={handlePublish} loading={loading} />
        }
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            userId={user?.id || user?.uid}
            isLiked={item.likes?.includes(user?.id || user?.uid)}
            onLike={handleLike}
            onComment={handleComment}
            onDelete={handleDeletePost}
            onEdit={handleEditPost}
          />
        )}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={Colors.primary.dark} style={{ marginVertical: 16 }} /> : null}
      />
      <CommentsModal
        visible={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        post={selectedPost}
        comments={comments}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onLikeComment={handleLikeComment}
        user={user}
        loading={commentsLoading}
      />
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
  errorText: {
    color: Colors.error || 'red',
    textAlign: 'center',
    marginTop: 16,
    fontSize: Typography.fontSizes.md,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: Colors.text.darkSecondary,
    fontSize: Typography.fontSizes.md,
  },
}); 