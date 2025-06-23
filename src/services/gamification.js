import { db } from './firebase/config';
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

// Regras de XP por ação
const XP_RULES = {
  review: { xp: 10, dailyLimit: 20 },
  add_location: { xp: 30, dailyLimit: 5 },
  add_photo: { xp: 15, dailyLimit: 20 },
  verify_info: { xp: 20, dailyLimit: 10 },
  report_error: { xp: 5, dailyLimit: 20 },
};

const BONUS = {
  firstReviewOfDay: 5,
  streak7: 100,
};

// Níveis: sobe a cada 50 XP
const LEVELS = [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 999999];

// Badges extras
const BADGES = {
  primeiros_passos: { label: 'Primeiros Passos', condition: (data) => data.xp >= 50 },
  fotografo: { label: 'Fotógrafo', condition: (data) => data.photosSent >= 10 },
  mestre_avaliacoes: { label: 'Mestre das Avaliações', condition: (data) => data.reviewsDone >= 100 },
  detetive: { label: 'Detetive', condition: (data) => data.errorsReported >= 50 },
};

// Utilitário para obter nível pelo XP
export function getLevel(xp) {
  let level = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function getLevelNameAndReward(level) {
  // Pode customizar nomes/recompensas se quiser
  return { name: `Nível ${level}`, reward: null };
}

// Função para buscar dados de gamificação do usuário
export async function getUserGamificationData(userId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  const data = userSnap.data();
  return {
    xp: data.xp || 0,
    level: data.level || getLevel(data.xp || 0),
    badges: data.badges || [],
    reviewsDone: data.reviewsDone || 0,
    photosSent: data.photosSent || 0,
    errorsReported: data.errorsReported || 0,
    // ...outros contadores
  };
}

// Função para logar ação do usuário
export async function logUserAction(userId, actionType, meta = {}) {
  const actionsRef = collection(db, 'users', userId, 'userActions');
  await addDoc(actionsRef, {
    actionType,
    meta,
    timestamp: serverTimestamp(),
  });
}

// Função para adicionar XP e processar regras
export async function addXP(userId, actionType, meta = {}) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const userData = userSnap.data();
  // XP base
  let xpToAdd = XP_RULES[actionType]?.xp || 0;
  // Bônus primeira avaliação do dia
  // (opcional: pode remover se quiser facilitar ainda mais)
  // Atualizar XP e contadores
  const newXP = (userData.xp || 0) + xpToAdd;
  const newLevel = getLevel(newXP);
  const updates = {
    xp: newXP,
    level: newLevel,
  };
  // Contadores para badges
  if (actionType === 'review') updates.reviewsDone = (userData.reviewsDone || 0) + 1;
  if (actionType === 'add_photo') updates.photosSent = (userData.photosSent || 0) + 1;
  if (actionType === 'report_error') updates.errorsReported = (userData.errorsReported || 0) + 1;
  // Badges extras
  let badges = userData.badges || [];
  for (const [key, badge] of Object.entries(BADGES)) {
    if (!badges.includes(key) && badge.condition({ ...userData, ...updates })) {
      badges.push(key);
    }
  }
  updates.badges = badges;
  await updateDoc(userRef, updates);
  await logUserAction(userId, actionType, meta);
}

// Função para conceder badge manualmente
export async function grantBadge(userId, badgeType) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const userData = userSnap.data();
  const badges = userData.badges || [];
  if (!badges.includes(badgeType)) {
    badges.push(badgeType);
    await updateDoc(userRef, { badges });
  }
}

// Função para checar streak (pode ser chamada ao logar ou ao fazer ação)
export async function checkStreak(userId) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return 0;
  const userData = userSnap.data();
  return userData.streak || 0;
}

// Função para checar e aplicar desafios (simplificado)
export async function checkChallenges(userId) {
  // Exemplo: desafio semanal de 5 avaliações
  // Pode ser expandido para buscar desafios ativos do Firestore
  const userData = await getUserGamificationData(userId);
  let xpBonus = 0;
  if ((userData.reviewsDone || 0) % 5 === 0 && userData.reviewsDone > 0) {
    xpBonus += 150; // Desafio semanal
    await addXP(userId, 'challenge_weekly', { challenge: '5_reviews_week' });
  }
  // Mensal: 20 locais
  if ((userData.locationsAdded || 0) % 20 === 0 && userData.locationsAdded > 0) {
    xpBonus += 500;
    await addXP(userId, 'challenge_monthly', { challenge: '20_locations_month' });
  }
  return xpBonus;
} 