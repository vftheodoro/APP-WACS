import { db } from './config';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';

// Fetch all accessible locations, ordered by most recent (if timestamp exists)
export async function fetchLocations(filter = 'recent') {
  const locationsRef = collection(db, 'accessibleLocations');
  // Sempre ordenar por data no fetch para garantir a busca básica
  let q = query(locationsRef, orderBy('createdAt', 'desc'));

  // A ordenação por rating será feita no cliente

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Fetch a single location by ID
export async function fetchLocationById(id) {
  const docRef = doc(db, 'accessibleLocations', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
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
