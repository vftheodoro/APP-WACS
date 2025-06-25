import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, Borders, Shadows } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import PostInput from '../../components/social/PostInput';
import PostCard from '../../components/social/PostCard';
import { fetchPostsPaginated, createPost, toggleLikePost, addComment, deletePost } from '../../services/firebase/posts';
import CommentsModal from '../../components/social/CommentsModal';
import Toast from '../../components/common/Toast';

export const PostsFeedScreen = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
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

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log('[Feed] Iniciando loadPosts');
    try {
      const { posts: newPosts, lastDoc: newLastDoc } = await fetchPostsPaginated({ pageSize: PAGE_SIZE });
      console.log('[Feed] Posts carregados:', newPosts.length, newPosts.map(p => p.id));
      setPosts(newPosts);
      setLastDoc(newLastDoc);
    } catch (e) {
      console.error('[Feed] Erro ao carregar posts:', e);
      setError('Não foi possível carregar o feed. ' + (e?.message || ''));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMorePosts = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    console.log('[Feed] Carregando mais posts...');
    try {
      const { posts: morePosts, lastDoc: newLastDoc } = await fetchPostsPaginated({ pageSize: PAGE_SIZE, lastDoc });
      console.log('[Feed] Mais posts carregados:', morePosts.length, morePosts.map(p => p.id));
      setPosts(prev => [...prev, ...morePosts]);
      setLastDoc(newLastDoc);
    } catch (e) {
      console.error('[Feed] Erro ao carregar mais posts:', e);
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
    console.log('[Feed] Publicando post:', { text, imageUri, user });
    try {
      const newPost = await createPost({
        userId: user.id,
        userName: user.name,
        userPhoto: user.photoURL,
        text,
        imageUri,
      });
      console.log('[Feed] Post criado:', newPost);
      setPosts(prev => [{ ...newPost, likes: [], comments: [], createdAt: { seconds: Math.floor(Date.now() / 1000) } }, ...prev]);
      await new Promise(res => setTimeout(res, 1000));
      await loadPosts();
      showToast('success', 'Post publicado com sucesso!');
    } catch (e) {
      console.error('[Feed] Erro ao publicar post:', e);
      setError('Erro ao publicar post. ' + (e?.message || ''));
      showToast('error', 'Erro ao publicar post. ' + (e?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId, liked) => {
    setError(null);
    console.log('[Feed] Curtir/descurtir post:', { postId, liked, userId: user.id });
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
      console.log('[Feed] Curtida atualizada localmente para post:', postId);
      showToast('success', liked ? 'Curtida removida!' : 'Post curtido!');
    } catch (e) {
      console.error('[Feed] Erro ao curtir/descurtir post:', e);
      setError('Erro ao curtir/descurtir post. ' + (e?.message || ''));
      showToast('error', 'Erro ao curtir/descurtir post. ' + (e?.message || ''));
    }
  };

  const handleComment = (post) => {
    setSelectedPost(post);
    console.log('[Feed] Abrindo modal de comentários para post:', post.id);
  };

  const handleAddComment = async (text) => {
    if (!user || !selectedPost) return;
    setCommentsLoading(true);
    setError(null);
    console.log('[Feed] Adicionando comentário:', { postId: selectedPost.id, text, user });
    try {
      await addComment(selectedPost.id, {
        userId: user.id,
        userName: user.name,
        userPhoto: user.photoURL,
        text,
      });
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id !== selectedPost.id) return post;
        const newComments = Array.isArray(post.comments) ? [...post.comments, {
          userId: user.id,
          userName: user.name,
          userPhoto: user.photoURL,
          text,
          createdAt: new Date().toISOString(),
        }] : [{
          userId: user.id,
          userName: user.name,
          userPhoto: user.photoURL,
          text,
          createdAt: new Date().toISOString(),
        }];
        return { ...post, comments: newComments };
      }));
      setSelectedPost(null);
      await loadPosts();
      showToast('success', 'Comentário adicionado!');
    } catch (e) {
      console.error('[Feed] Erro ao comentar:', e);
      setError('Erro ao comentar. ' + (e?.message || ''));
      showToast('error', 'Erro ao comentar. ' + (e?.message || ''));
    } finally {
      setCommentsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    console.log('[Feed] Refresh manual do feed');
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
            userId={user?.id}
            isLiked={item.likes?.includes(user?.id)}
            onLike={handleLike}
            onComment={handleComment}
            onDelete={handleDeletePost}
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
        post={selectedPost || { comments: [] }}
        onAddComment={handleAddComment}
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