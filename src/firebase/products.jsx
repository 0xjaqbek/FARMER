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

// Add a new product
export const addProduct = async (productData, images) => {
  // Upload images first and get URLs
  const imageUrls = [];
  
  for (const image of images) {
    const storageRef = ref(storage, `products/${Date.now()}_${image.name}`);
    const snapshot = await uploadBytes(storageRef, image);
    const url = await getDownloadURL(snapshot.ref);
    imageUrls.push(url);
  }
  
  // Add product to Firestore (removed blockchain fields)
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
};

// Get products by farmer ID
export const getProductsByFarmer = async (farmerId) => {
  const q = query(collection(db, 'products'), where('farmerId', '==', farmerId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date()
  }));
};

// Get all products
export const getAllProducts = async () => {
  const querySnapshot = await getDocs(collection(db, 'products'));
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date()
  }));
};

// Get active products only
export const getActiveProducts = async () => {
  const q = query(collection(db, 'products'), where('status', '==', 'active'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date()
  }));
};

// Get product by ID
export const getProductById = async (productId) => {
  const docRef = doc(db, 'products', productId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  } else {
    throw new Error('Product not found');
  }
};

// Update product
export const updateProduct = async (productId, productData) => {
  const docRef = doc(db, 'products', productId);
  await updateDoc(docRef, {
    ...productData,
    updatedAt: serverTimestamp()
  });
  
  return true;
};

// Update product status
export const updateProductStatus = async (productId, status) => {
  const docRef = doc(db, 'products', productId);
  await updateDoc(docRef, {
    status,
    updatedAt: serverTimestamp()
  });
  
  return true;
};

// Update actual quantity
export const updateActualQuantity = async (productId, actualQuantity) => {
  const docRef = doc(db, 'products', productId);
  await updateDoc(docRef, {
    actualQuantity,
    updatedAt: serverTimestamp()
  });
  
  return true;
};

// Verify product (admin function)
export const verifyProduct = async (productId, isVerified = true) => {
  const docRef = doc(db, 'products', productId);
  await updateDoc(docRef, {
    isVerified,
    verificationDate: isVerified ? serverTimestamp() : null,
    updatedAt: serverTimestamp()
  });
  
  return true;
};

// Delete product
export const deleteProduct = async (productId) => {
  await deleteDoc(doc(db, 'products', productId));
  return true;
};

// Product status constants
export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive', 
  SOLD_OUT: 'sold_out',
  ARCHIVED: 'archived'
};