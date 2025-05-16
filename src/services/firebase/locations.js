import { db } from './config';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';

// Fetch all accessible locations, ordered by most recent (if timestamp exists)
export async function fetchLocations() {
  const locationsRef = collection(db, 'accessibleLocations');
  const q = query(locationsRef, orderBy('createdAt', 'desc'));
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
  return querySnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(review => review.locationId === locationId);
}
