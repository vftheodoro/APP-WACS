import { db } from './config';
import { collection, getDocs, doc, getDoc, query, orderBy, where, deleteDoc, updateDoc } from 'firebase/firestore';

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
