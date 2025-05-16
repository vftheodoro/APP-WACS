import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
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

  // Carrega mensagens em tempo real
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'chatMessages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      );
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const sendMessage = useCallback(async (text) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !db) return;
    await addDoc(collection(db, 'chatMessages'), {
      text,
      userId: user.uid,
      userName: user.displayName || user.email || 'Usuário',
      userEmail: user.email || '',
      photoURL: user.photoURL || '',
      timestamp: serverTimestamp(),
    });
  }, []);

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
    <ChatContext.Provider value={{ messages, loading, sendMessage, deleteMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
