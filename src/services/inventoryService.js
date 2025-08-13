// src/services/inventoryService.js
// Complete inventory management system

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS, createBatchSchema, createInventoryLogSchema } from '../lib/firebaseSchema';
import { NotificationService } from './notificationService';

export class InventoryService {
  
  // Create new inventory batch
  static async createBatch(productId, batchData) {
    try {
      const batch = {
        ...createBatchSchema(),
        ...batchData,
        id: doc(collection(db, 'temp')).id, // Generate ID
        createdAt: serverTimestamp()
      };

      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      const productDoc = await getDoc(productRef);
      
      if (!productDoc.exists()) {
        throw new Error('Product not found');
      }

      const product = productDoc.data();
      const updatedBatches = [...(product.inventory?.batches || []), batch];
      
      // Update total stock
      const totalStock = updatedBatches.reduce((sum, b) => 
        b.status === 'available' ? sum + b.quantity : sum, 0
      );

      await updateDoc(productRef, {
        'inventory.batches': updatedBatches,
        'inventory.totalStock': totalStock,
        'inventory.availableStock': totalStock - (product.inventory?.reservedStock || 0),
        'inventory.lastRestocked': serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Log the inventory change
      await this.logInventoryChange(productId, batch.id, 'restock', {
        quantityBefore: product.inventory?.totalStock || 0,
        quantityChange: batch.quantity,
        quantityAfter: totalStock,
        reason: 'New batch created'
      });

      return batch;
    } catch (error) {
      console.error('Error creating batch:', error);
      throw error;
    }
  }

  // Update existing batch
  static async updateBatch(productId, batchId, updates) {
    try {
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      const productDoc = await getDoc(productRef);
      
      if (!productDoc.exists()) {
        throw new Error('Product not found');
      }

      const product = productDoc.data();
      const batches = product.inventory?.batches || [];
      const batchIndex = batches.findIndex(b => b.id === batchId);
      
      if (batchIndex === -1) {
        throw new Error('Batch not found');
      }

      const oldQuantity = batches[batchIndex].quantity;
      batches[batchIndex] = { ...batches[batchIndex], ...updates, updatedAt: serverTimestamp() };
      
      // Recalculate totals
      const totalStock = batches.reduce((sum, b) => 
        b.status === 'available' ? sum + b.quantity : sum, 0
      );

      await updateDoc(productRef, {
        'inventory.batches': batches,
        'inventory.totalStock': totalStock,
        'inventory.availableStock': totalStock - (product.inventory?.reservedStock || 0),
        updatedAt: serverTimestamp()
      });

      // Log if quantity changed
      if (updates.quantity && updates.quantity !== oldQuantity) {
        await this.logInventoryChange(productId, batchId, 'adjustment', {
          quantityBefore: oldQuantity,
          quantityChange: updates.quantity - oldQuantity,
          quantityAfter: updates.quantity,
          reason: 'Batch quantity updated'
        });
      }

      return batches[batchIndex];
    } catch (error) {
      console.error('Error updating batch:', error);
      throw error;
    }
  }

  // Reserve inventory for order
  static async reserveInventory(productId, quantity, orderId) {
    return await runTransaction(db, async (transaction) => {
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      const productDoc = await transaction.get(productRef);
      
      if (!productDoc.exists()) {
        throw new Error('Product not found');
      }

      const product = productDoc.data();
      const availableStock = product.inventory?.availableStock || 0;
      
      if (availableStock < quantity) {
        throw new Error(`Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`);
      }

      // Use FIFO - allocate from oldest batches first
      const batches = [...(product.inventory?.batches || [])];
      const allocatedBatches = [];
      let remainingQuantity = quantity;

      // Sort by harvest date (oldest first)
      const availableBatches = batches
        .filter(b => b.status === 'available' && b.quantity > 0)
        .sort((a, b) => new Date(a.harvestDate) - new Date(b.harvestDate));

      for (const batch of availableBatches) {
        if (remainingQuantity <= 0) break;
        
        const allocateFromBatch = Math.min(batch.quantity, remainingQuantity);
        
        allocatedBatches.push({
          batchId: batch.id,
          quantity: allocateFromBatch,
          unitPrice: product.price
        });
        
        // Update batch quantity
        const batchIndex = batches.findIndex(b => b.id === batch.id);
        batches[batchIndex].quantity -= allocateFromBatch;
        
        if (batches[batchIndex].quantity === 0) {
          batches[batchIndex].status = 'sold';
        }
        
        remainingQuantity -= allocateFromBatch;
      }

      if (remainingQuantity > 0) {
        throw new Error('Could not allocate sufficient inventory');
      }

      // Update product inventory
      const newReservedStock = (product.inventory?.reservedStock || 0) + quantity;
      const newAvailableStock = (product.inventory?.totalStock || 0) - newReservedStock;

      transaction.update(productRef, {
        'inventory.batches': batches,
        'inventory.reservedStock': newReservedStock,
        'inventory.availableStock': newAvailableStock,
        updatedAt: serverTimestamp()
      });

      // Log the reservation
      await this.logInventoryChange(productId, null, 'reservation', {
        quantityBefore: availableStock,
        quantityChange: -quantity,
        quantityAfter: newAvailableStock,
        reason: `Reserved for order ${orderId}`,
        orderId
      });

      return allocatedBatches;
    });
  }

  // Release reserved inventory (e.g., when order is cancelled)
  static async releaseReservedInventory(productId, quantity, orderId) {
    try {
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      const productDoc = await getDoc(productRef);
      
      if (!productDoc.exists()) {
        throw new Error('Product not found');
      }

      const product = productDoc.data();
      const currentReserved = product.inventory?.reservedStock || 0;
      const newReservedStock = Math.max(0, currentReserved - quantity);
      const newAvailableStock = (product.inventory?.totalStock || 0) - newReservedStock;

      await updateDoc(productRef, {
        'inventory.reservedStock': newReservedStock,
        'inventory.availableStock': newAvailableStock,
        updatedAt: serverTimestamp()
      });

      // Log the release
      await this.logInventoryChange(productId, null, 'release', {
        quantityBefore: product.inventory?.availableStock || 0,
        quantityChange: quantity,
        quantityAfter: newAvailableStock,
        reason: `Released from cancelled order ${orderId}`,
        orderId
      });

      return { newReservedStock, newAvailableStock };
    } catch (error) {
      console.error('Error releasing reserved inventory:', error);
      throw error;
    }
  }

  // Confirm sale (move from reserved to sold)
  static async confirmSale(productId, quantity, orderId) {
    try {
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      const productDoc = await getDoc(productRef);
      
      if (!productDoc.exists()) {
        throw new Error('Product not found');
      }

      const product = productDoc.data();
      const currentReserved = product.inventory?.reservedStock || 0;
      const newReservedStock = Math.max(0, currentReserved - quantity);
      const newTotalStock = (product.inventory?.totalStock || 0) - quantity;
      const newAvailableStock = newTotalStock - newReservedStock;

      await updateDoc(productRef, {
        'inventory.totalStock': newTotalStock,
        'inventory.reservedStock': newReservedStock,
        'inventory.availableStock': newAvailableStock,
        updatedAt: serverTimestamp()
      });

      // Log the sale
      await this.logInventoryChange(productId, null, 'sale', {
        quantityBefore: product.inventory?.totalStock || 0,
        quantityChange: -quantity,
        quantityAfter: newTotalStock,
        reason: `Sold via order ${orderId}`,
        orderId
      });

      // Check for low stock notification
      await this.checkLowStockAlert(productId, newAvailableStock, product);

      return { newTotalStock, newReservedStock, newAvailableStock };
    } catch (error) {
      console.error('Error confirming sale:', error);
      throw error;
    }
  }

  // Check for low stock and send notifications
  static async checkLowStockAlert(productId, currentStock, product) {
    try {
      const threshold = product.inventory?.lowStockThreshold || 10;
      
      if (currentStock <= threshold && currentStock > 0) {
        await NotificationService.sendNotification(product.farmerId, {
          type: 'LOW_STOCK',
          priority: 'high',
          title: 'Low Stock Alert',
          message: `${product.name}: Only ${currentStock}${product.inventory?.unit || ''} remaining`,
          actionData: {
            productId,
            currentStock,
            threshold,
            productName: product.name
          }
        });
      } else if (currentStock === 0) {
        await NotificationService.sendNotification(product.farmerId, {
          type: 'OUT_OF_STOCK',
          priority: 'urgent',
          title: 'Out of Stock',
          message: `${product.name} is now out of stock`,
          actionData: {
            productId,
            productName: product.name
          }
        });

        // Auto-hide if configured
        if (product.autoManagement?.hideWhenOutOfStock) {
          const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
          await updateDoc(productRef, {
            status: 'inactive',
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error checking low stock alert:', error);
    }
  }

  // Check for expiring batches
  static async checkExpiringBatches() {
    try {
      const productsRef = collection(db, COLLECTIONS.PRODUCTS);
      const snapshot = await getDocs(productsRef);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      for (const doc of snapshot.docs) {
        const product = doc.data();
        const batches = product.inventory?.batches || [];
        
        for (const batch of batches) {
          if (batch.status !== 'available') continue;
          
          const expiryDate = new Date(batch.expiryDate);
          
          // Urgent: Expires tomorrow
          if (expiryDate <= tomorrow) {
            await NotificationService.sendNotification(product.farmerId, {
              type: 'BATCH_EXPIRING',
              priority: 'urgent',
              title: 'Batch Expiring Tomorrow',
              message: `${product.name} batch expires tomorrow (${batch.quantity}${product.inventory?.unit})`,
              actionData: {
                productId: doc.id,
                batchId: batch.id,
                expiryDate: batch.expiryDate,
                quantity: batch.quantity
              }
            });
          }
          // Warning: Expires in 3 days
          else if (expiryDate <= threeDaysFromNow) {
            await NotificationService.sendNotification(product.farmerId, {
              type: 'BATCH_EXPIRING',
              priority: 'high',
              title: 'Batch Expiring Soon',
              message: `${product.name} batch expires in ${Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))} days`,
              actionData: {
                productId: doc.id,
                batchId: batch.id,
                expiryDate: batch.expiryDate,
                quantity: batch.quantity
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking expiring batches:', error);
    }
  }

  // Mark batches as expired
  static async markExpiredBatches() {
    try {
      const productsRef = collection(db, COLLECTIONS.PRODUCTS);
      const snapshot = await getDocs(productsRef);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const batch = writeBatch(db);
      let batchCount = 0;

      for (const docSnapshot of snapshot.docs) {
        const product = docSnapshot.data();
        const batches = product.inventory?.batches || [];
        let hasChanges = false;
        
        for (const batchItem of batches) {
          if (batchItem.status === 'available' && new Date(batchItem.expiryDate) < today) {
            batchItem.status = 'expired';
            hasChanges = true;
            
            // Log the expiry
            await this.logInventoryChange(docSnapshot.id, batchItem.id, 'expiry', {
              quantityBefore: batchItem.quantity,
              quantityChange: -batchItem.quantity,
              quantityAfter: 0,
              reason: 'Batch expired'
            });
          }
        }
        
        if (hasChanges) {
          // Recalculate totals
          const totalStock = batches.reduce((sum, b) => 
            b.status === 'available' ? sum + b.quantity : sum, 0
          );
          const availableStock = totalStock - (product.inventory?.reservedStock || 0);
          
          batch.update(doc(db, COLLECTIONS.PRODUCTS, docSnapshot.id), {
            'inventory.batches': batches,
            'inventory.totalStock': totalStock,
            'inventory.availableStock': availableStock,
            updatedAt: serverTimestamp()
          });
          
          batchCount++;
          
          // Commit in batches of 500 (Firestore limit)
          if (batchCount >= 500) {
            await batch.commit();
            batchCount = 0;
          }
        }
      }
      
      if (batchCount > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error marking expired batches:', error);
    }
  }

  // Get inventory status for a product
  static async getInventoryStatus(productId) {
    try {
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      const productDoc = await getDoc(productRef);
      
      if (!productDoc.exists()) {
        throw new Error('Product not found');
      }

      const product = productDoc.data();
      const inventory = product.inventory || {};
      
      return {
        totalStock: inventory.totalStock || 0,
        availableStock: inventory.availableStock || 0,
        reservedStock: inventory.reservedStock || 0,
        lowStockThreshold: inventory.lowStockThreshold || 10,
        unit: inventory.unit || 'units',
        batches: inventory.batches || [],
        isLowStock: (inventory.availableStock || 0) <= (inventory.lowStockThreshold || 10),
        isOutOfStock: (inventory.availableStock || 0) === 0,
        nextExpiring: this.getNextExpiringBatch(inventory.batches || [])
      };
    } catch (error) {
      console.error('Error getting inventory status:', error);
      throw error;
    }
  }

  // Get next expiring batch
  static getNextExpiringBatch(batches) {
    const availableBatches = batches.filter(b => b.status === 'available');
    if (availableBatches.length === 0) return null;
    
    return availableBatches.reduce((earliest, batch) => {
      return new Date(batch.expiryDate) < new Date(earliest.expiryDate) ? batch : earliest;
    });
  }

  // Log inventory changes
  static async logInventoryChange(productId, batchId, type, data) {
    try {
      const logEntry = {
        ...createInventoryLogSchema(),
        productId,
        batchId,
        type,
        ...data,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, COLLECTIONS.INVENTORY_LOGS), logEntry);
    } catch (error) {
      console.error('Error logging inventory change:', error);
    }
  }

  // Get inventory history
  static async getInventoryHistory(productId, limitCount = 50) {
    try {
      const logsRef = collection(db, COLLECTIONS.INVENTORY_LOGS);
      const q = query(
        logsRef,
        where('productId', '==', productId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting inventory history:', error);
      throw error;
    }
  }

  // Bulk update multiple products (for seasonal management)
  static async bulkUpdateSeasonality(farmerId, updates) {
    try {
      const productsRef = collection(db, COLLECTIONS.PRODUCTS);
      const q = query(productsRef, where('farmerId', '==', farmerId));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      let count = 0;

      for (const docSnapshot of snapshot.docs) {
        const product = docSnapshot.data();
        
        // Apply seasonal updates based on current date
        const now = new Date();
        const seasonStart = product.seasonality?.startSeason ? new Date(product.seasonality.startSeason) : null;
        const seasonEnd = product.seasonality?.endSeason ? new Date(product.seasonality.endSeason) : null;
        
        let shouldUpdate = false;
        let newStatus = product.status;
        
        if (product.autoManagement?.autoReactivateInSeason && seasonStart && seasonEnd) {
          const isInSeason = now >= seasonStart && now <= seasonEnd;
          
          if (isInSeason && product.status === 'out_of_season') {
            newStatus = 'active';
            shouldUpdate = true;
          } else if (!isInSeason && product.status === 'active' && product.autoManagement?.autoDeactivateOutOfSeason) {
            newStatus = 'out_of_season';
            shouldUpdate = true;
          }
        }
        
        if (shouldUpdate) {
          batch.update(doc(db, COLLECTIONS.PRODUCTS, docSnapshot.id), {
            status: newStatus,
            updatedAt: serverTimestamp()
          });
          
          count++;
          
          if (count >= 500) {
            await batch.commit();
            count = 0;
          }
        }
      }
      
      if (count > 0) {
        await batch.commit();
      }
      
      return { updatedProducts: count };
    } catch (error) {
      console.error('Error bulk updating seasonality:', error);
      throw error;
    }
  }

  // Get low stock products for a farmer
  static async getLowStockProducts(farmerId) {
    try {
      const productsRef = collection(db, COLLECTIONS.PRODUCTS);
      const q = query(
        productsRef,
        where('farmerId', '==', farmerId),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      const lowStockProducts = [];
      
      for (const doc of snapshot.docs) {
        const product = doc.data();
        const availableStock = product.inventory?.availableStock || 0;
        const threshold = product.inventory?.lowStockThreshold || 10;
        
        if (availableStock <= threshold) {
          lowStockProducts.push({
            id: doc.id,
            ...product,
            stockLevel: availableStock <= 0 ? 'out' : 'low'
          });
        }
      }
      
      return lowStockProducts.sort((a, b) => 
        (a.inventory?.availableStock || 0) - (b.inventory?.availableStock || 0)
      );
    } catch (error) {
      console.error('Error getting low stock products:', error);
      throw error;
    }
  }

  // Update inventory settings
  static async updateInventorySettings(productId, settings) {
    try {
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      const updates = {};
      
      Object.keys(settings).forEach(key => {
        updates[`inventory.${key}`] = settings[key];
      });
      
      updates.updatedAt = serverTimestamp();
      
      await updateDoc(productRef, updates);
      return true;
    } catch (error) {
      console.error('Error updating inventory settings:', error);
      throw error;
    }
  }

  // Calculate inventory value
  static async calculateInventoryValue(farmerId) {
    try {
      const productsRef = collection(db, COLLECTIONS.PRODUCTS);
      const q = query(productsRef, where('farmerId', '==', farmerId));
      const snapshot = await getDocs(q);
      
      let totalValue = 0;
      let totalItems = 0;
      const breakdown = [];
      
      for (const doc of snapshot.docs) {
        const product = doc.data();
        const batches = product.inventory?.batches || [];
        
        let productValue = 0;
        let productQuantity = 0;
        
        for (const batch of batches) {
          if (batch.status === 'available') {
            const batchValue = batch.quantity * (batch.cost || product.price);
            productValue += batchValue;
            productQuantity += batch.quantity;
          }
        }
        
        totalValue += productValue;
        totalItems += productQuantity;
        
        if (productQuantity > 0) {
          breakdown.push({
            productId: doc.id,
            name: product.name,
            quantity: productQuantity,
            unit: product.inventory?.unit || 'units',
            value: productValue,
            averageCost: productValue / productQuantity
          });
        }
      }
      
      return {
        totalValue,
        totalItems,
        breakdown: breakdown.sort((a, b) => b.value - a.value)
      };
    } catch (error) {
      console.error('Error calculating inventory value:', error);
      throw error;
    }
  }
}