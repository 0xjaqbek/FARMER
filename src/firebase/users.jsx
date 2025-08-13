
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from './config.jsx';

// Find nearby rolniks based on postal code
export const findNearbyRolniks = async (postalCode) => {
  try {
    // FIXED: Check if postalCode is valid before processing
    if (!postalCode || typeof postalCode !== 'string' || postalCode.trim().length < 2) {
      console.warn('Invalid postalCode provided:', postalCode);
      // Return all rolniks if no valid postal code
      return await getAllRolniks();
    }
    
    // Get the postal prefix for filtering
    const cleanedPostalCode = postalCode.trim();
    const postalPrefix = cleanedPostalCode.substring(0, 2);
    
    console.log('Searching nearby rolniks with postal prefix:', postalPrefix);
    
    // Use a simpler query that just filters by role
    // This avoids requiring a composite index
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'rolnik')
    );
    
    const querySnapshot = await getDocs(q);
    
    // Filter the results by postal code in JavaScript
    const allRolniks = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
    console.log('Found total rolniks:', allRolniks.length);
    
    // Filter by postal code prefix if available
    const nearbyRolniks = allRolniks.filter(user => {
      // Check if user has a postalCode and it starts with the same prefix
      if (!user.postalCode || typeof user.postalCode !== 'string') {
        return false;
      }
      
      const userPrefix = user.postalCode.trim().substring(0, 2);
      return userPrefix === postalPrefix;
    });
    
    console.log('Found nearby rolniks:', nearbyRolniks.length);
    
    // If no nearby rolniks found, return a subset of all rolniks
    if (nearbyRolniks.length === 0) {
      console.log('No nearby rolniks found, returning subset of all rolniks');
      return allRolniks.slice(0, 10); // Return first 10 rolniks
    }
    
    return nearbyRolniks;
  } catch (error) {
    console.error('Error finding nearby rolniks:', error);
    
    // Fallback: try to get all rolniks
    try {
      console.log('Attempting fallback to getAllRolniks');
      return await getAllRolniks();
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return []; // Return empty array as last resort
    }
  }
};

// Get all rolniks
export const getAllRolniks = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'rolnik')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all rolniks:', error);
    throw error;
  }
};

// Get all clients
export const getAllClients = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'klient')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all clients:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};