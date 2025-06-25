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
    likes: [], // array de userId
    comments: [], // array de objetos {userId, userName, userPhoto, text, createdAt}
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
      userName: data.userName || data.author || 'Usuário',
      userPhoto: data.userPhoto || data.avatar || null,
      text: data.text || data.content || '',
      imageUrl: data.imageUrl || data.image || null,
      likes: Array.isArray(data.likes) && data.likes.length > 0 ? data.likes : (Array.isArray(data.likedBy) ? data.likedBy : []),
      comments: Array.isArray(data.comments) ? data.comments : [],
      createdAt: data.createdAt,
      _docSnap: docSnap, // Para paginação
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

// Adicionar comentário
export async function addComment(postId, { userId, userName, userPhoto, text }) {
  const postRef = doc(db, POSTS_COLLECTION, postId);
  await updateDoc(postRef, {
    comments: arrayUnion({ userId, userName, userPhoto, text, createdAt: new Date().toISOString() }),
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