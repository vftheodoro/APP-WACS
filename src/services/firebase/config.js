import { getFirestore } from 'firebase/firestore';
import { app, auth, storage } from '../../config/firebase';

// Reexporta as instâncias centralizadas
export { auth, storage };
export const db = getFirestore(app);