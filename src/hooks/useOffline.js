import { useState, useEffect, useCallback } from 'react';
import { saveOfflineData, getOfflineData, registerBackgroundSync } from '../utils/pwa';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Network: Back online, syncing data...');
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Network: Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline queue on mount
  useEffect(() => {
    loadOfflineQueue();
  }, []);

  const loadOfflineQueue = async () => {
    try {
      const orders = await getOfflineData('offline_orders') || [];
      const messages = await getOfflineData('offline_messages') || [];
      const reviews = await getOfflineData('offline_reviews') || [];
      
      setOfflineQueue([...orders, ...messages, ...reviews]);
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  };

  // Save action for offline processing
  const saveOfflineAction = useCallback(async (type, data) => {
    if (!isOnline) {
      const actionData = {
        id: Date.now().toString(),
        type,
        data,
        timestamp: Date.now(),
        retryCount: 0
      };

      try {
        await saveOfflineData(`offline_${type}`, actionData);
        setOfflineQueue(prev => [...prev, actionData]);
        
        // Register for background sync when online
        await registerBackgroundSync(`sync-${type}`);
        
        console.log(`Offline ${type} saved:`, actionData.id);
        return { success: true, id: actionData.id, offline: true };
      } catch (error) {
        console.error(`Failed to save offline ${type}:`, error);
        return { success: false, error: error.message, offline: true };
      }
    }

    // If online, process normally
    return { success: true, offline: false };
  }, [isOnline]);

  // Sync offline data when back online
  const syncOfflineData = useCallback(async () => {
    if (!isOnline || syncing) return;

    setSyncing(true);
    const successfulSyncs = [];

    try {
      for (const item of offlineQueue) {
        try {
          let endpoint = '';
          let method = 'POST';

          switch (item.type) {
            case 'orders':
              endpoint = '/api/orders';
              break;
            case 'messages':
              endpoint = '/api/messages';
              break;
            case 'reviews':
              endpoint = '/api/reviews';
              break;
            default:
              continue;
          }

          const response = await fetch(endpoint, {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(item.data)
          });

          if (response.ok) {
            successfulSyncs.push(item.id);
            console.log(`Synced offline ${item.type}:`, item.id);
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.error(`Failed to sync ${item.type}:`, error);
          
          // Increment retry count
          item.retryCount = (item.retryCount || 0) + 1;
          
          // Remove items that have failed too many times
          if (item.retryCount >= 3) {
            successfulSyncs.push(item.id);
            console.log(`Removing failed offline action after 3 retries:`, item.id);
          }
        }
      }

      // Remove successfully synced items
      setOfflineQueue(prev => 
        prev.filter(item => !successfulSyncs.includes(item.id))
      );

    } catch (error) {
      console.error('Offline sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }, [isOnline, syncing, offlineQueue]);

  // Manual sync trigger
  const forcSync = useCallback(async () => {
    if (isOnline) {
      await syncOfflineData();
    }
  }, [isOnline, syncOfflineData]);

  // Clear offline queue
  const clearOfflineQueue = useCallback(async () => {
    try {
      // Clear IndexedDB stores
      const stores = ['offline_orders', 'offline_messages', 'offline_reviews'];
      
      for (const storeName of stores) {
        const items = await getOfflineData(storeName);
        for (const item of items) {
          await removeFromIndexedDB(storeName, item.id);
        }
      }
      
      setOfflineQueue([]);
      console.log('Offline queue cleared');
    } catch (error) {
      console.error('Failed to clear offline queue:', error);
    }
  }, []);

  return {
    isOnline,
    offlineQueue,
    syncing,
    saveOfflineAction,
    syncOfflineData,
    forcSync,
    clearOfflineQueue,
    hasOfflineData: offlineQueue.length > 0
  };
};

// Hook for specific offline functionality
export const useOfflineOrders = () => {
  const { isOnline, saveOfflineAction } = useOffline();

  const createOfflineOrder = useCallback(async (orderData) => {
    if (isOnline) {
      // Process normally when online
      return await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(orderData)
      });
    } else {
      // Save for offline processing
      return await saveOfflineAction('orders', orderData);
    }
  }, [isOnline, saveOfflineAction]);

  return { createOfflineOrder };
};

export const useOfflineMessages = () => {
  const { isOnline, saveOfflineAction } = useOffline();

  const sendOfflineMessage = useCallback(async (messageData) => {
    if (isOnline) {
      return await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(messageData)
      });
    } else {
      return await saveOfflineAction('messages', messageData);
    }
  }, [isOnline, saveOfflineAction]);

  return { sendOfflineMessage };
};

export const useOfflineReviews = () => {
  const { isOnline, saveOfflineAction } = useOffline();

  const submitOfflineReview = useCallback(async (reviewData) => {
    if (isOnline) {
      return await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(reviewData)
      });
    } else {
      return await saveOfflineAction('reviews', reviewData);
    }
  }, [isOnline, saveOfflineAction]);

  return { submitOfflineReview };
};

// Helper function for IndexedDB cleanup
const removeFromIndexedDB = async (storeName, id) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FarmDirectOffline', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
};