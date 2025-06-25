import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getApps } from 'firebase/app';

// Firebase já está inicializado em config/firebase.js
let db;
if (getApps().length > 0) {
  db = getFirestore();
}

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatId, setChatId] = useState(null);

  // Carrega mensagens do chat selecionado em tempo real
  useEffect(() => {
    if (!db || !chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'chatMessages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      );
      setLoading(false);
    });
    return unsubscribe;
  }, [chatId]);

  const sendMessage = useCallback(async (text) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !db || !chatId) return;
    await addDoc(collection(db, 'chatMessages'), {
      chatId,
      type: 'text',
      text,
      userId: user.uid,
      userName: user.displayName || user.email || 'Usuário',
      userEmail: user.email || '',
      photoURL: user.photoURL || '',
      timestamp: serverTimestamp(),
    });
  }, [chatId]);

  // Função para enviar imagem
  const sendImageMessage = useCallback(async (uri) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !db || !uri || !chatId) return;
    try {
      const storage = getStorage();
      const response = await fetch(uri);
      const blob = await response.blob();
      const imageRef = ref(storage, `chatImages/${user.uid}_${Date.now()}`);
      try {
        await uploadBytes(imageRef, blob);
      } catch (err) {
        Alert.alert('Erro ao fazer upload da imagem para o Storage.');
        console.error('Erro no uploadBytes:', err);
        return;
      }
      let imageUrl = '';
      try {
        imageUrl = await getDownloadURL(imageRef);
      } catch (err) {
        Alert.alert('Erro ao obter a URL da imagem do Storage.');
        console.error('Erro no getDownloadURL:', err);
        return;
      }
      console.log('URL da imagem enviada:', imageUrl);
      const docData = {
        chatId,
        type: 'image',
        imageUrl,
        userId: user.uid,
        userName: user.displayName || user.email || 'Usuário',
        userEmail: user.email || '',
        photoURL: user.photoURL || '',
        timestamp: serverTimestamp(),
      };
      try {
        await addDoc(collection(db, 'chatMessages'), docData);
        console.log('Mensagem de imagem enviada para o Firestore:', docData);
      } catch (err) {
        Alert.alert('Erro ao salvar a mensagem de imagem no Firestore.');
        console.error('Erro no addDoc:', err, docData);
        return;
      }
    } catch (e) {
      alert('Erro ao enviar imagem. Tente novamente.');
      console.error('Erro ao enviar imagem:', e);
    }
  }, [chatId]);

  // Função para deletar mensagem pelo id
  const deleteMessage = useCallback(async (id) => {
    if (!db || !id) {
      console.log('deleteMessage: db ou id inválido', { db, id });
      return;
    }
    try {
      // Exclusão lógica: marcar como apagada
      await updateDoc(doc(db, 'chatMessages', id), {
        deleted: true,
        text: '',
      });
      console.log('Mensagem marcada como apagada:', id);
    } catch (error) {
      console.error('Erro ao marcar mensagem como apagada:', error);
      alert('Não foi possível apagar a mensagem. Tente novamente.');
    }
  }, []);

  return (
    <ChatContext.Provider value={{ chatId, setChatId, messages, loading, sendMessage, sendImageMessage, deleteMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
