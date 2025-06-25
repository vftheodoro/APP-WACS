import { db, storage } from './config';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  startAfter,
  limit as limitFn,
  deleteDoc,
  deleteField,
  getDoc,
  increment,
  setDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const POSTS_COLLECTION = 'posts';

// Cria um novo post
export async function createPost({ userId, userName, userPhoto, text, imageUri }) {
  let imageUrl = null;
  if (imageUri) {
    const imageRef = ref(storage, `posts/${userId}_${Date.now()}`);
    const img = await fetch(imageUri);
    const blob = await img.blob();
    await uploadBytes(imageRef, blob);
    imageUrl = await getDownloadURL(imageRef);
  }
  const postData = {
    userId,
    userName,
    userPhoto,
    text,
    imageUrl,
    createdAt: serverTimestamp(),
    likes: [],
    commentsCount: 0,
  };
  const docRef = await addDoc(collection(db, POSTS_COLLECTION), postData);
  return { id: docRef.id, ...postData };
}

// Busca os posts mais recentes com paginação
export async function fetchPostsPaginated({ pageSize = 10, lastDoc = null }) {
  let q = query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc'), limitFn(pageSize));
  if (lastDoc) {
    q = query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc'), startAfter(lastDoc), limitFn(pageSize));
  }
  const querySnapshot = await getDocs(q);
  const posts = [];
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    posts.push({
      id: docSnap.id,
      userId: data.userId || '',
      userName: data.userName || 'Usuário',
      userPhoto: data.userPhoto || null,
      text: data.text || '',
      imageUrl: data.imageUrl || null,
      likes: Array.isArray(data.likes) ? data.likes : [],
      commentsCount: typeof data.commentsCount === 'number' ? data.commentsCount : 0,
      createdAt: data.createdAt,
    });
  });
  return { posts, lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] };
}

// Curtir/descurtir post
export async function toggleLikePost(postId, userId, liked) {
  const postRef = doc(db, POSTS_COLLECTION, postId);
  await updateDoc(postRef, {
    likes: liked ? arrayRemove(userId) : arrayUnion(userId),
  });
}

// Adiciona um comentário na subcoleção e incrementa o contador
export async function addComment(postId, { userId, userName, userPhoto, text }) {
  const commentData = {
    userId,
    userName,
    userPhoto,
    text,
    createdAt: new Date().toISOString(),
    likes: [],
  };
  await addDoc(collection(db, POSTS_COLLECTION, postId, 'comments'), commentData);
  await updateDoc(doc(db, POSTS_COLLECTION, postId), {
    comments: deleteField(),
    commentsCount: increment(1),
  });
}

// Curtir/descurtir comentário
export async function toggleLikeComment(postId, commentId, userId, liked) {
  const commentRef = doc(db, POSTS_COLLECTION, postId, 'comments', commentId);
  await updateDoc(commentRef, {
    likes: liked ? arrayRemove(userId) : arrayUnion(userId),
  });
}

// Busca comentários da subcoleção (ordenados por relevância: mais curtidos, depois mais recentes)
export async function fetchComments(postId, { limit = 30 } = {}) {
  const q = query(collection(db, POSTS_COLLECTION, postId, 'comments'), orderBy('createdAt', 'desc'), limitFn(limit));
  const querySnapshot = await getDocs(q);
  // Ordena por likes (desc), depois por data (desc)
  return querySnapshot.docs
    .map(docSnap => ({ id: docSnap.id, likes: [], ...docSnap.data() }))
    .map(c => ({ ...c, likes: Array.isArray(c.likes) ? c.likes : [] }))
    .sort((a, b) => {
      if ((b.likes?.length || 0) !== (a.likes?.length || 0)) {
        return (b.likes?.length || 0) - (a.likes?.length || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

// Remove comentário e decrementa o contador
export async function deleteComment(postId, commentId, userId, isAdmin = false) {
  const commentRef = doc(db, POSTS_COLLECTION, postId, 'comments', commentId);
  const commentSnap = await getDoc(commentRef);
  if (!commentSnap.exists()) throw new Error('Comentário não encontrado');
  const data = commentSnap.data();
  if (data.userId !== userId && !isAdmin) throw new Error('Sem permissão para apagar este comentário');
  await deleteDoc(commentRef);
  await updateDoc(doc(db, POSTS_COLLECTION, postId), {
    commentsCount: increment(-1),
  });
}

// Deleta um post e sua imagem do Storage (se houver)
export async function deletePost(postId, imageUrl) {
  // Deleta imagem do Storage se houver
  if (imageUrl) {
    try {
      // Extrai o caminho relativo da imagem a partir da URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)$/);
      let storagePath = null;
      if (pathMatch && pathMatch[1]) {
        storagePath = decodeURIComponent(pathMatch[1].split('?')[0]);
      } else {
        // fallback: tenta extrair após /o/
        storagePath = imageUrl.split('/o/')[1]?.split('?')[0];
      }
      if (storagePath) {
        const imageRef = ref(storage, storagePath);
        await deleteObject(imageRef);
      }
    } catch (err) {
      // Loga mas não impede a exclusão do post
      console.warn('Erro ao deletar imagem do Storage:', err);
    }
  }
  // Deleta o documento do post
  await deleteDoc(doc(db, POSTS_COLLECTION, postId));
  return true;
}

// Atualiza o texto do post
export async function updatePost(postId, { text }) {
  await updateDoc(doc(db, POSTS_COLLECTION, postId), { text });
} 