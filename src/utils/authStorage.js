// src/utils/authStorage.js
// Helper functions to store auth tokens for service worker access

/**
 * Store auth token in IndexedDB for service worker access
 * Call this whenever a user logs in or token is refreshed
 */
export const storeAuthTokenForSW = async (token) => {
  try {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FarmDirectAuth', 1);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('auth')) {
          db.createObjectStore('auth', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['auth'], 'readwrite');
        const store = transaction.objectStore('auth');
        
        store.put({ 
          id: 'authToken', 
          token: token, 
          timestamp: Date.now() 
        });
        
        transaction.oncomplete = () => {
          console.log('Auth token stored for service worker');
          resolve();
        };
        
        transaction.onerror = () => {
          console.error('Failed to store auth token for service worker');
          reject(transaction.error);
        };
      };
      
      request.onerror = () => {
        console.error('Failed to open auth database for service worker');
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to store auth token for service worker:', error);
  }
};

/**
 * Remove auth token from IndexedDB when user logs out
 * Call this when user logs out
 */
export const removeAuthTokenFromSW = async () => {
  try {
    return new Promise((resolve) => {
      const request = indexedDB.open('FarmDirectAuth', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('auth')) {
          resolve();
          return;
        }
        
        const transaction = db.transaction(['auth'], 'readwrite');
        const store = transaction.objectStore('auth');
        
        store.delete('authToken');
        
        transaction.oncomplete = () => {
          console.log('Auth token removed from service worker storage');
          resolve();
        };
        
        transaction.onerror = () => {
          console.error('Failed to remove auth token from service worker storage');
          resolve(); // Don't fail the logout process
        };
      };
      
      request.onerror = () => {
        console.error('Failed to open auth database for service worker');
        resolve(); // Don't fail the logout process
      };
    });
  } catch (error) {
    console.error('Failed to remove auth token from service worker:', error);
  }
};

/**
 * Get auth token from IndexedDB (for main thread use)
 * This is mainly for debugging - service worker has its own implementation
 */
export const getAuthTokenFromSW = async () => {
  try {
    return new Promise((resolve) => {
      const request = indexedDB.open('FarmDirectAuth', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('auth')) {
          resolve(null);
          return;
        }
        
        const transaction = db.transaction(['auth'], 'readonly');
        const store = transaction.objectStore('auth');
        const getRequest = store.get('authToken');
        
        getRequest.onsuccess = () => {
          const result = getRequest.result;
          resolve(result ? result.token : null);
        };
        
        getRequest.onerror = () => {
          console.error('Failed to get auth token from service worker storage');
          resolve(null);
        };
      };
      
      request.onerror = () => {
        console.error('Failed to open auth database');
        resolve(null);
      };
    });
  } catch (error) {
    console.error('Failed to get auth token from service worker storage:', error);
    return null;
  }
};

/**
 * Example integration with your AuthContext
 * Add this to your login function
 */
export const loginWithSWStorage = async (credentials) => {
  try {
    // Your existing login logic
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (data.token) {
      // Store in localStorage as usual
      localStorage.setItem('authToken', data.token);
      
      // ALSO store for service worker
      await storeAuthTokenForSW(data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

/**
 * Example logout function
 */
export const logoutWithSWStorage = async () => {
  try {
    // Your existing logout logic
    localStorage.removeItem('authToken');
    
    // ALSO remove from service worker storage
    await removeAuthTokenFromSW();
    
    // Clear other auth-related data
    // ... your existing cleanup code
  } catch (error) {
    console.error('Logout cleanup failed:', error);
  }
};

/**
 * Token refresh function
 */
export const refreshTokenWithSWStorage = async () => {
  try {
    const currentToken = localStorage.getItem('authToken');
    
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      
      // Update service worker storage too
      await storeAuthTokenForSW(data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};