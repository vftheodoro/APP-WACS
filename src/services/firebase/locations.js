import { db } from './config';
import { collection, getDocs, doc, getDoc, query, orderBy, where, deleteDoc, updateDoc, getFirestore, setDoc, serverTimestamp } from 'firebase/firestore';

// Fetch all accessible locations, ordered by most recent (if timestamp exists)
export async function fetchLocations(filter = 'recent') {
  const locationsRef = collection(db, 'accessibleLocations');
  // Sempre ordenar por data no fetch para garantir a busca básica
  let q = query(locationsRef, orderBy('createdAt', 'desc'));

  const querySnapshot = await getDocs(q);
  const locations = [];

  for (const doc of querySnapshot.docs) {
    const locationData = { id: doc.id, ...doc.data() };

    // Buscar informações do autor se houver
    if (locationData.authorId) {
      const authorDoc = await getDoc(doc(db, 'users', locationData.authorId));
      if (authorDoc.exists()) {
        locationData.author = {
          id: authorDoc.id,
          ...authorDoc.data()
        };
      }
    }

    // Buscar avaliações dos recursos de acessibilidade
    const reviewsRef = collection(db, 'reviews');
    const reviewsQuery = query(reviewsRef, where('locationId', '==', doc.id));
    const reviewsSnapshot = await getDocs(reviewsQuery);

    // Calcular média das avaliações por recurso
    const featureRatings = {};
    let totalReviews = 0;

    reviewsSnapshot.forEach(reviewDoc => {
      const reviewData = reviewDoc.data();
      totalReviews++;

      // Somar avaliações por recurso
      if (reviewData.featureRatings) {
        Object.entries(reviewData.featureRatings).forEach(([feature, rating]) => {
          if (!featureRatings[feature]) {
            featureRatings[feature] = {
              total: 0,
              count: 0
            };
          }
          featureRatings[feature].total += rating;
          featureRatings[feature].count++;
        });
      }
    });

    // Calcular médias
    const averageFeatureRatings = {};
    Object.entries(featureRatings).forEach(([feature, data]) => {
      averageFeatureRatings[feature] = data.total / data.count;
    });

    locationData.featureRatings = averageFeatureRatings;
    locationData.reviewCount = totalReviews;

    locations.push(locationData);
  }

  return locations;
}

// Fetch a single location by ID
export async function fetchLocationById(id) {
  const docRef = doc(db, 'accessibleLocations', id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const locationData = { id: docSnap.id, ...docSnap.data() };

  // Fetch author info
  if (locationData.authorId) {
    const authorDoc = await getDoc(doc(db, 'users', locationData.authorId));
    if (authorDoc.exists()) {
      locationData.author = {
        id: authorDoc.id,
        ...authorDoc.data()
      };
    }
  }

  // Garantir que features esteja presente e correto
  locationData.features =
    locationData.features ||
    locationData.accessibilityFeatures ||
    locationData.acessibilidade ||
    [];

  // Fetch reviews to calculate average feature ratings
  const reviewsRef = collection(db, 'reviews');
  const reviewsQuery = query(reviewsRef, where('locationId', '==', id));
  const reviewsSnapshot = await getDocs(reviewsQuery);

  const featureRatings = {};
  reviewsSnapshot.forEach(reviewDoc => {
    const reviewData = reviewDoc.data();
    if (reviewData.featureRatings) {
      Object.entries(reviewData.featureRatings).forEach(([feature, rating]) => {
        if (!featureRatings[feature]) {
          featureRatings[feature] = { total: 0, count: 0 };
        }
        featureRatings[feature].total += rating;
        featureRatings[feature].count++;
      });
    }
  });

  const averageFeatureRatings = {};
  Object.entries(featureRatings).forEach(([feature, data]) => {
    averageFeatureRatings[feature] = data.total / data.count;
  });

  locationData.featureRatings = averageFeatureRatings;

  return locationData;
}

// Fetch reviews for a location
export async function fetchReviewsForLocation(locationId) {
  const reviewsRef = collection(db, 'reviews');
  const q = query(reviewsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  const reviewsWithUsers = [];
  for (const docSnapshot of querySnapshot.docs) {
    const review = { id: docSnapshot.id, ...docSnapshot.data() };
    
    // Apenas processe avaliações para o local correto
    if (review.locationId === locationId) {
      // Buscar dados do usuário que fez a avaliação
      if (review.userId) {
        const userDocRef = doc(db, 'users', review.userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          review.photoURL = userData.photoURL || null; // Adicionar photoURL à avaliação
        }
      }
      reviewsWithUsers.push(review);
    }
  }
  
  return reviewsWithUsers;
}

// Deletar local pelo ID
export async function deleteLocationById(locationId) {
  try {
    await deleteDoc(doc(db, 'accessibleLocations', locationId));
    return true;
  } catch (error) {
    console.error('Erro ao deletar local:', error);
    throw error;
  }
}

// Deletar avaliação pelo ID
export async function deleteReviewById(reviewId) {
  try {
    await deleteDoc(doc(db, 'reviews', reviewId));
    return true;
  } catch (error) {
    console.error('Erro ao deletar avaliação:', error);
    throw error;
  }
}

// Atualizar avaliação pelo ID
export async function updateReviewById(reviewId, data) {
  try {
    await updateDoc(doc(db, 'reviews', reviewId), data);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    throw error;
  }
}

export async function initializeChatsValeRibeira() {
  const db = getFirestore();
  const cidadesValeRibeira = [
    'Apiaí', 'Barra do Chapéu', 'Barra do Turvo', 'Cajati', 'Cananéia', 'Eldorado',
    'Iguape', 'Ilha Comprida', 'Iporanga', 'Itaoca', 'Itapirapuã Paulista', 'Itariri',
    'Jacupiranga', 'Juquiá', 'Juquitiba', 'Miracatu', 'Pariquera-Açu', 'Pedro de Toledo',
    'Registro', 'Ribeira', 'São Lourenço da Serra', 'Sete Barras', 'Tapiraí'
  ];
  // Chat regional
  await setDoc(doc(db, 'chats', 'vale_do_ribeira'), {
    name: 'Chat da sua Região - Vale do Ribeira',
    type: 'regional',
    createdAt: serverTimestamp(),
  });
  // Chats de cidades
  for (const cidade of cidadesValeRibeira) {
    await setDoc(doc(db, 'chats', cidade.toLowerCase().replace(/ /g, '_')), {
      name: cidade,
      type: 'cidade',
      cidade,
      members: [],
      createdAt: serverTimestamp(),
    });
  }
}

/**
 * Busca todos os chats do Firestore.
 * @param {string} userCidade - Cidade do usuário (opcional, para ordenar em destaque)
 * @returns {Promise<Array>} Lista de chats
 */
export async function fetchAllChats(userCidade = null) {
  const db = getFirestore();
  const snapshot = await getDocs(collection(db, 'chats'));
  let chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Ordenar: regional primeiro, depois cidade do usuário, depois demais cidades
  chats = chats.sort((a, b) => {
    if (a.type === 'regional') return -1;
    if (b.type === 'regional') return 1;
    if (userCidade) {
      if (a.cidade === userCidade && b.cidade !== userCidade) return -1;
      if (b.cidade === userCidade && a.cidade !== userCidade) return 1;
    }
    return (a.cidade || a.name).localeCompare(b.cidade || b.name);
  });
  return chats;
}

const cidadesValeRibeira = [
  'Apiaí', 'Barra do Chapéu', 'Barra do Turvo', 'Cajati', 'Cananéia', 'Eldorado',
  'Iguape', 'Ilha Comprida', 'Iporanga', 'Itaoca', 'Itapirapuã Paulista', 'Itariri',
  'Jacupiranga', 'Juquiá', 'Juquitiba', 'Miracatu', 'Pariquera-Açu', 'Pedro de Toledo',
  'Registro', 'Ribeira', 'São Lourenço da Serra', 'Sete Barras', 'Tapiraí'
];

/**
 * Retorna as n cidades mais próximas (antes e depois) da cidade informada na lista.
 * Sempre inclui a cidade informada.
 */
export function getNearbyCities(cidade, n = 5) {
  const idx = cidadesValeRibeira.findIndex(c => c.toLowerCase() === cidade?.toLowerCase());
  if (idx === -1) return [cidade];
  const half = Math.floor(n / 2);
  let start = Math.max(0, idx - half);
  let end = Math.min(cidadesValeRibeira.length, idx + half + 1);
  // Ajusta se estiver no início ou fim
  if (end - start < n) {
    if (start === 0) end = Math.min(cidadesValeRibeira.length, n);
    else if (end === cidadesValeRibeira.length) start = Math.max(0, cidadesValeRibeira.length - n);
  }
  return cidadesValeRibeira.slice(start, end);
}

// Coordenadas aproximadas das cidades do Vale do Ribeira
const cidadesValeRibeiraCoords = {
  'Apiaí': { lat: -24.5111, lng: -48.8447 },
  'Barra do Chapéu': { lat: -24.4722, lng: -49.0253 },
  'Barra do Turvo': { lat: -24.7597, lng: -48.5011 },
  'Cajati': { lat: -24.7322, lng: -48.1222 },
  'Cananéia': { lat: -25.0144, lng: -47.9344 },
  'Eldorado': { lat: -24.5281, lng: -48.1128 },
  'Iguape': { lat: -24.6986, lng: -47.5553 },
  'Ilha Comprida': { lat: -24.7306, lng: -47.5381 },
  'Iporanga': { lat: -24.5842, lng: -48.5972 },
  'Itaoca': { lat: -24.6392, lng: -48.8411 },
  'Itapirapuã Paulista': { lat: -24.5722, lng: -49.0142 },
  'Itariri': { lat: -24.2831, lng: -47.1731 },
  'Jacupiranga': { lat: -24.6967, lng: -48.0067 },
  'Juquiá': { lat: -24.3106, lng: -47.6422 },
  'Juquitiba': { lat: -23.9242, lng: -47.0653 },
  'Miracatu': { lat: -24.2761, lng: -47.4622 },
  'Pariquera-Açu': { lat: -24.7142, lng: -47.8761 },
  'Pedro de Toledo': { lat: -24.2761, lng: -47.2353 },
  'Registro': { lat: -24.4971, lng: -47.8449 },
  'Ribeira': { lat: -24.6511, lng: -49.0042 },
  'São Lourenço da Serra': { lat: -23.8492, lng: -46.9431 },
  'Sete Barras': { lat: -24.3822, lng: -47.9272 },
  'Tapiraí': { lat: -23.9611, lng: -47.5067 },
};

// Função de distância Haversine (em km)
function haversine(lat1, lng1, lat2, lng2) {
  const toRad = deg => deg * Math.PI / 180;
  const R = 6371; // raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Retorna as n cidades mais próximas fisicamente da cidade informada (incluindo ela mesma).
 */
export function getNearbyCitiesByDistance(cidade, n = 5) {
  const base = cidadesValeRibeiraCoords[cidade];
  if (!base) return [cidade];
  const cidadesDist = Object.entries(cidadesValeRibeiraCoords)
    .map(([nome, coords]) => ({
      nome,
      dist: haversine(base.lat, base.lng, coords.lat, coords.lng)
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n)
    .map(c => c.nome);
  return cidadesDist;
}
