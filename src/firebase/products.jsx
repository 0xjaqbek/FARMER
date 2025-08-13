// Fixed products.jsx - Handle timestamp conversion properly

import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  where,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config.jsx';

// Helper function to safely convert Firestore timestamp
const safeToDate = (timestamp) => {
  if (!timestamp) return new Date();
  
  // If it's already a Date object
  if (timestamp instanceof Date) return timestamp;
  
  // If it has a toDate method (Firestore Timestamp)
  if (timestamp && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch (error) {
      console.warn('Error converting timestamp:', error);
      return new Date();
    }
  }
  
  // If it's a string or number, try to parse
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  
  // Fallback to current date
  return new Date();
};

// Add a new product
export const addProduct = async (productData, images) => {
  try {
    // Upload images first and get URLs
    const imageUrls = [];
    
    if (images && images.length > 0) {
      for (const image of images) {
        const storageRef = ref(storage, `products/${Date.now()}_${image.name}`);
        const snapshot = await uploadBytes(storageRef, image);
        const url = await getDownloadURL(snapshot.ref);
        imageUrls.push(url);
      }
    }
    
    // Add product to Firestore
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      images: imageUrls,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      actualQuantity: 0, // Actual harvested quantity
      isVerified: false, // Manual verification status
      verificationDate: null,
      status: 'active' // active, inactive, sold_out
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

// Get products by farmer ID
export const getProductsByFarmer = async (farmerId) => {
  try {
    if (!farmerId) {
      console.warn('No farmerId provided to getProductsByFarmer');
      return [];
    }
    
    // Try both rolnikId and farmerId for compatibility
    let q = query(collection(db, 'products'), where('rolnikId', '==', farmerId));
    let querySnapshot = await getDocs(q);
    
    let products = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt)
      };
    });
    
    // If no products found with rolnikId, try farmerId
    if (products.length === 0) {
      console.log('No products found with rolnikId, trying farmerId...');
      q = query(collection(db, 'products'), where('farmerId', '==', farmerId));
      querySnapshot = await getDocs(q);
      
      products = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: safeToDate(data.createdAt),
          updatedAt: safeToDate(data.updatedAt)
        };
      });
    }
    
    return products;
  } catch (error) {
    console.error('Error getting products by farmer:', error);
    return [];
  }
};

// Get all products
export const getAllProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt)
      };
    });
  } catch (error) {
    console.error('Error getting all products:', error);
    return [];
  }
};

// Get active products only
export const getActiveProducts = async () => {
  try {
    const q = query(collection(db, 'products'), where('status', '==', 'active'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt)
      };
    });
  } catch (error) {
    console.error('Error getting active products:', error);
    return [];
  }
};

// Get product by ID
export const getProductById = async (productId) => {
  try {
    if (!productId) {
      throw new Error('Product ID is required');
    }
    
    const docRef = doc(db, 'products', productId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: safeToDate(data.createdAt),
        updatedAt: safeToDate(data.updatedAt)
      };
    } else {
      throw new Error('Product not found');
    }
  } catch (error) {
    console.error('Error getting product by ID:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (productId, productData) => {
  try {
    if (!productId) {
      throw new Error('Product ID is required');
    }
    
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      ...productData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Update product status
export const updateProductStatus = async (productId, status) => {
  try {
    if (!productId || !status) {
      throw new Error('Product ID and status are required');
    }
    
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating product status:', error);
    throw error;
  }
};

// Update actual quantity
export const updateActualQuantity = async (productId, actualQuantity) => {
  try {
    if (!productId || actualQuantity === undefined || actualQuantity === null) {
      throw new Error('Product ID and actual quantity are required');
    }
    
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      actualQuantity,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating actual quantity:', error);
    throw error;
  }
};

// Verify product (admin function)
export const verifyProduct = async (productId, isVerified = true) => {
  try {
    if (!productId) {
      throw new Error('Product ID is required');
    }
    
    const docRef = doc(db, 'products', productId);
    await updateDoc(docRef, {
      isVerified,
      verificationDate: isVerified ? serverTimestamp() : null,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error verifying product:', error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (productId) => {
  try {
    if (!productId) {
      throw new Error('Product ID is required');
    }
    
    await deleteDoc(doc(db, 'products', productId));
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Product status constants
export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive', 
  SOLD_OUT: 'sold_out',
  ARCHIVED: 'archived'
};