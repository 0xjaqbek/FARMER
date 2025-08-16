// src/firebase/admin.js - Firebase functions for admin operations
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  getDoc,
  writeBatch,
  addDoc
} from 'firebase/firestore';
import { db } from './config';

// Helper function to safely convert dates
const safeToDate = (timestamp) => {
  if (!timestamp) return new Date();
  
  // If it's already a Date object
  if (timestamp instanceof Date) return timestamp;
  
  // If it's a Firestore Timestamp
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a string or number, try to convert
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  
  // Fallback to current date
  return new Date();
};

// Get all users with admin privileges
export const getAllUsers = async () => {
  try {
    console.log('🔥 Admin: Fetching all users...');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const users = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        uid: doc.id,
        ...userData,
        // Safely convert Firestore timestamps to Date objects
        createdAt: safeToDate(userData.createdAt),
        updatedAt: safeToDate(userData.updatedAt),
        lastLoginAt: safeToDate(userData.lastLoginAt),
        verificationDate: safeToDate(userData.verificationDate)
      });
    });
    
    console.log(`✅ Admin: Found ${users.length} users`);
    return users;
    
  } catch (error) {
    console.error('❌ Admin: Error fetching all users:', error);
    throw error;
  }
};

// Get users by role
export const getUsersByRole = async (role) => {
  try {
    console.log(`🔥 Admin: Fetching users with role: ${role}`);
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    const snapshot = await getDocs(q);
    
    const users = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        uid: doc.id,
        ...userData,
        createdAt: safeToDate(userData.createdAt),
        updatedAt: safeToDate(userData.updatedAt),
        lastLoginAt: safeToDate(userData.lastLoginAt),
        verificationDate: safeToDate(userData.verificationDate)
      });
    });
    
    console.log(`✅ Admin: Found ${users.length} users with role ${role}`);
    return users;
    
  } catch (error) {
    console.error(`❌ Admin: Error fetching users by role ${role}:`, error);
    throw error;
  }
};

// Get unverified farmers
export const getUnverifiedFarmers = async () => {
  try {
    console.log('🔥 Admin: Fetching unverified farmers...');
    
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('role', 'in', ['rolnik', 'farmer']),
      where('isVerified', '==', false)
    );
    const snapshot = await getDocs(q);
    
    const farmers = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      farmers.push({
        uid: doc.id,
        ...userData,
        createdAt: safeToDate(userData.createdAt),
        updatedAt: safeToDate(userData.updatedAt),
        verificationDate: safeToDate(userData.verificationDate)
      });
    });
    
    console.log(`✅ Admin: Found ${farmers.length} unverified farmers`);
    return farmers;
    
  } catch (error) {
    console.error('❌ Admin: Error fetching unverified farmers:', error);
    throw error;
  }
};

// Verify a farmer
export const verifyFarmer = async (uid) => {
  try {
    console.log(`🔥 Admin: Verifying farmer with UID: ${uid}`);
    
    const userRef = doc(db, 'users', uid);
    
    // Check if user exists and is a farmer
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    if (!['rolnik', 'farmer'].includes(userData.role)) {
      throw new Error('User is not a farmer');
    }
    
    // Update verification status
    await updateDoc(userRef, {
      isVerified: true,
      verificationDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Create verification log entry
    const logEntry = {
      type: 'farmer_verified',
      farmerId: uid,
      farmerName: `${userData.firstName} ${userData.lastName}`,
      farmName: userData.farmInfo?.farmName || userData.farmName,
      timestamp: serverTimestamp(),
      verifiedBy: 'admin' // You can pass admin UID here
    };
    
    // Add to verification logs collection (optional)
    try {
      await addDoc(collection(db, 'verificationLogs'), logEntry);
    } catch (logError) {
      console.warn('⚠️ Admin: Could not create verification log:', logError);
    }
    
    console.log(`✅ Admin: Farmer ${uid} verified successfully`);
    return true;
    
  } catch (error) {
    console.error(`❌ Admin: Error verifying farmer ${uid}:`, error);
    throw error;
  }
};

// Remove farmer verification
export const unverifyFarmer = async (uid) => {
  try {
    console.log(`🔥 Admin: Removing verification for farmer: ${uid}`);
    
    const userRef = doc(db, 'users', uid);
    
    // Check if user exists
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    // Update verification status
    await updateDoc(userRef, {
      isVerified: false,
      verificationDate: null,
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Admin: Farmer ${uid} verification removed`);
    return true;
    
  } catch (error) {
    console.error(`❌ Admin: Error removing farmer verification ${uid}:`, error);
    throw error;
  }
};

// Delete a user (admin function)
export const deleteUser = async (uid) => {
  try {
    console.log(`🔥 Admin: Deleting user: ${uid}`);
    
    const batch = writeBatch(db);
    
    // Delete user document
    const userRef = doc(db, 'users', uid);
    batch.delete(userRef);
    
    // TODO: Delete related data
    // - User's products
    // - User's orders
    // - User's messages
    // - User's conversations
    
    // For now, just delete the user document
    await batch.commit();
    
    console.log(`✅ Admin: User ${uid} deleted successfully`);
    return true;
    
  } catch (error) {
    console.error(`❌ Admin: Error deleting user ${uid}:`, error);
    throw error;
  }
};

// Update user role
export const updateUserRole = async (uid, newRole) => {
  try {
    console.log(`🔥 Admin: Updating user ${uid} role to: ${newRole}`);
    
    const userRef = doc(db, 'users', uid);
    
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Admin: User ${uid} role updated to ${newRole}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Admin: Error updating user role:`, error);
    throw error;
  }
};

// Get system statistics
export const getSystemStats = async () => {
  try {
    console.log('🔥 Admin: Fetching system statistics...');
    
    // Get all users
    const users = await getAllUsers();
    
    // Calculate stats
    const totalUsers = users.length;
    const farmers = users.filter(user => ['rolnik', 'farmer'].includes(user.role));
    const customers = users.filter(user => ['klient', 'customer'].includes(user.role));
    const admins = users.filter(user => user.role === 'admin');
    const verifiedFarmers = farmers.filter(farmer => farmer.isVerified);
    const pendingVerifications = farmers.filter(farmer => !farmer.isVerified);
    
    // Get additional stats from other collections
    let totalProducts = 0;
    let totalOrders = 0;
    let totalRevenue = 0;
    
    try {
      // Get products count
      const productsSnapshot = await getDocs(collection(db, 'products'));
      totalProducts = productsSnapshot.size;
      
      // Get orders count and revenue
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      totalOrders = ordersSnapshot.size;
      
      // Calculate total revenue
      ordersSnapshot.forEach((doc) => {
        const orderData = doc.data();
        if (orderData.total && orderData.status === 'completed') {
          totalRevenue += orderData.total;
        }
      });
      
    } catch (statsError) {
      console.warn('⚠️ Admin: Could not fetch additional stats:', statsError);
    }
    
    const stats = {
      totalUsers,
      totalFarmers: farmers.length,
      totalCustomers: customers.length,
      totalAdmins: admins.length,
      verifiedFarmers: verifiedFarmers.length,
      pendingVerifications: pendingVerifications.length,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      verificationRate: farmers.length > 0 ? ((verifiedFarmers.length / farmers.length) * 100).toFixed(1) : 0
    };
    
    console.log('✅ Admin: System stats fetched:', stats);
    return stats;
    
  } catch (error) {
    console.error('❌ Admin: Error fetching system stats:', error);
    throw error;
  }
};

// Get recent activity
export const getRecentActivity = async (limitCount = 20) => {
  try {
    console.log('🔥 Admin: Fetching recent activity...');
    
    const activities = [];
    
    // Get recent user registrations
    const usersRef = collection(db, 'users');
    const recentUsersQuery = query(
      usersRef, 
      orderBy('createdAt', 'desc'), 
      limit(10)
    );
    const recentUsersSnapshot = await getDocs(recentUsersQuery);
    
    recentUsersSnapshot.forEach((doc) => {
      const userData = doc.data();
      activities.push({
        id: `user_${doc.id}`,
        type: 'user_registration',
        message: `New ${userData.role === 'rolnik' ? 'farmer' : 'customer'} registered: ${userData.firstName} ${userData.lastName}`,
        timestamp: safeToDate(userData.createdAt),
        userId: doc.id,
        userRole: userData.role
      });
    });
    
    // Get recent verification logs if they exist
    try {
      const logsRef = collection(db, 'verificationLogs');
      const recentLogsQuery = query(
        logsRef, 
        orderBy('timestamp', 'desc'), 
        limit(10)
      );
      const logsSnapshot = await getDocs(recentLogsQuery);
      
      logsSnapshot.forEach((doc) => {
        const logData = doc.data();
        activities.push({
          id: `log_${doc.id}`,
          type: logData.type,
          message: `Farmer verified: ${logData.farmName || logData.farmerName}`,
          timestamp: safeToDate(logData.timestamp),
          userId: logData.farmerId
        });
      });
    } catch (logsError) {
      console.warn('⚠️ Admin: No verification logs found:', logsError);
    }
    
    // Sort all activities by timestamp and limit
    activities.sort((a, b) => b.timestamp - a.timestamp);
    const limitedActivities = activities.slice(0, limitCount);
    
    console.log(`✅ Admin: Found ${limitedActivities.length} recent activities`);
    return limitedActivities;
    
  } catch (error) {
    console.error('❌ Admin: Error fetching recent activity:', error);
    throw error;
  }
};

// Search users
export const searchUsers = async (searchTerm) => {
  try {
    console.log(`🔥 Admin: Searching users with term: ${searchTerm}`);
    
    // Note: Firestore doesn't support full-text search natively
    // This is a simple implementation that gets all users and filters client-side
    // For production, consider using Algolia or similar search service
    
    const allUsers = await getAllUsers();
    
    const searchTermLower = searchTerm.toLowerCase();
    const filteredUsers = allUsers.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = user.email.toLowerCase();
      const farmName = user.farmInfo?.farmName?.toLowerCase() || '';
      
      return fullName.includes(searchTermLower) || 
             email.includes(searchTermLower) || 
             farmName.includes(searchTermLower);
    });
    
    console.log(`✅ Admin: Search found ${filteredUsers.length} users`);
    return filteredUsers;
    
  } catch (error) {
    console.error('❌ Admin: Error searching users:', error);
    throw error;
  }
};

// Send notification to user(s)
export const sendNotificationToUser = async (userId, notification) => {
  try {
    console.log(`🔥 Admin: Sending notification to user: ${userId}`);
    
    const notificationData = {
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'admin',
      read: false,
      createdAt: serverTimestamp(),
      sentBy: 'admin'
    };
    
    await addDoc(collection(db, 'notifications'), notificationData);
    
    console.log(`✅ Admin: Notification sent to user ${userId}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Admin: Error sending notification:`, error);
    throw error;
  }
};

// Bulk operations
export const bulkVerifyFarmers = async (farmerIds) => {
  try {
    console.log(`🔥 Admin: Bulk verifying ${farmerIds.length} farmers`);
    
    const batch = writeBatch(db);
    
    farmerIds.forEach(farmerId => {
      const userRef = doc(db, 'users', farmerId);
      batch.update(userRef, {
        isVerified: true,
        verificationDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    
    console.log(`✅ Admin: Bulk verified ${farmerIds.length} farmers`);
    return true;
    
  } catch (error) {
    console.error('❌ Admin: Error in bulk verification:', error);
    throw error;
  }
};

// Export user data (for GDPR compliance)
export const exportUserData = async (userId) => {
  try {
    console.log(`🔥 Admin: Exporting data for user: ${userId}`);
    
    const userData = {};
    
    // Get user profile
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      userData.profile = userDoc.data();
    }
    
    // Get user's products (if farmer)
    const productsQuery = query(
      collection(db, 'products'), 
      where('farmerId', '==', userId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    userData.products = [];
    productsSnapshot.forEach(doc => {
      userData.products.push({ id: doc.id, ...doc.data() });
    });
    
    // Get user's orders
    const ordersQuery = query(
      collection(db, 'orders'), 
      where('customerId', '==', userId)
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    userData.orders = [];
    ordersSnapshot.forEach(doc => {
      userData.orders.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`✅ Admin: User data exported for ${userId}`);
    return userData;
    
  } catch (error) {
    console.error(`❌ Admin: Error exporting user data:`, error);
    throw error;
  }
};

// Admin activity logging
export const logAdminActivity = async (adminId, action, details) => {
  try {
    const logEntry = {
      adminId,
      action,
      details,
      timestamp: serverTimestamp()
    };
    
    await addDoc(collection(db, 'adminLogs'), logEntry);
    console.log(`✅ Admin: Activity logged - ${action}`);
    
  } catch (error) {
    console.warn('⚠️ Admin: Could not log activity:', error);
  }
};