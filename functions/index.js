// functions/index.js
// Firebase Cloud Functions for automated tasks

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Check for expiring batches daily
exports.checkExpiringBatches = functions.pubsub.schedule('0 8 * * *')
  .timeZone('Europe/Warsaw')
  .onRun(async (context) => {
    console.log('Checking for expiring batches...');
    
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const productsSnapshot = await db.collection('products').get();
      
      for (const productDoc of productsSnapshot.docs) {
        const product = productDoc.data();
        const batches = product.inventory?.batches || [];
        
        for (const batch of batches) {
          if (batch.status !== 'available') continue;
          
          const expiryDate = new Date(batch.expiryDate);
          
          // Urgent: Expires tomorrow
          if (expiryDate <= tomorrow) {
            await createNotification(product.farmerId, {
              type: 'batch_expiring',
              priority: 'urgent',
              title: 'Batch Expiring Tomorrow',
              message: `${product.name} batch expires tomorrow (${batch.quantity}${product.inventory?.unit})`,
              actionData: {
                productId: productDoc.id,
                batchId: batch.id,
                expiryDate: batch.expiryDate,
                quantity: batch.quantity
              }
            });
          }
          // Warning: Expires in 3 days
          else if (expiryDate <= threeDaysFromNow) {
            await createNotification(product.farmerId, {
              type: 'batch_expiring',
              priority: 'high',
              title: 'Batch Expiring Soon',
              message: `${product.name} batch expires in ${Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))} days`,
              actionData: {
                productId: productDoc.id,
                batchId: batch.id,
                expiryDate: batch.expiryDate,
                quantity: batch.quantity
              }
            });
          }
        }
      }
      
      console.log('Finished checking expiring batches');
    } catch (error) {
      console.error('Error checking expiring batches:', error);
    }
  });

// Mark expired batches
exports.markExpiredBatches = functions.pubsub.schedule('0 0 * * *')
  .timeZone('Europe/Warsaw')
  .onRun(async (context) => {
    console.log('Marking expired batches...');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const productsSnapshot = await db.collection('products').get();
      const batch = db.batch();
      
      for (const productDoc of productsSnapshot.docs) {
        const product = productDoc.data();
        const batches = product.inventory?.batches || [];
        let hasChanges = false;
        
        for (const batchItem of batches) {
          if (batchItem.status === 'available' && new Date(batchItem.expiryDate) < today) {
            batchItem.status = 'expired';
            hasChanges = true;
            
            // Log the expiry
            await logInventoryChange(productDoc.id, batchItem.id, 'expiry', {
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
          
          batch.update(productDoc.ref, {
            'inventory.batches': batches,
            'inventory.totalStock': totalStock,
            'inventory.availableStock': availableStock,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
      
      await batch.commit();
      console.log('Finished marking expired batches');
    } catch (error) {
      console.error('Error marking expired batches:', error);
    }
  });

// Send seasonal notifications
exports.sendSeasonalNotifications = functions.pubsub.schedule('0 9 * * *')
  .timeZone('Europe/Warsaw')
  .onRun(async (context) => {
    console.log('Checking for seasonal notifications...');
    
    try {
      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      const productsSnapshot = await db.collection('products').get();
      
      for (const productDoc of productsSnapshot.docs) {
        const product = productDoc.data();
        const seasonality = product.seasonality;
        
        if (!seasonality || !seasonality.startSeason || !seasonality.endSeason) continue;
        
        const startDate = new Date(seasonality.startSeason);
        const endDate = new Date(seasonality.endSeason);
        
        // Season starting in 3 days
        if (Math.abs(startDate - threeDaysFromNow) < 24 * 60 * 60 * 1000) {
          await createNotification(product.farmerId, {
            type: 'season_starting',
            priority: 'medium',
            title: 'Season Starting Soon',
            message: `${product.name} season starts in 3 days. Prepare your inventory!`,
            actionData: { 
              productId: productDoc.id, 
              startDate: seasonality.startSeason,
              type: 'product' 
            }
          });
        }
        
        // Season ending in 3 days
        if (Math.abs(endDate - threeDaysFromNow) < 24 * 60 * 60 * 1000) {
          await createNotification(product.farmerId, {
            type: 'season_ending',
            priority: 'high',
            title: 'Season Ending Soon',
            message: `${product.name} season ends in 3 days. Last chance to sell!`,
            actionData: { 
              productId: productDoc.id, 
              endDate: seasonality.endSeason,
              type: 'product' 
            }
          });
        }
      }
      
      console.log('Finished checking seasonal notifications');
    } catch (error) {
      console.error('Error sending seasonal notifications:', error);
    }
  });

// Process scheduled notifications
exports.processScheduledNotifications = functions.pubsub.schedule('*/5 * * * *')
  .onRun(async (context) => {
    console.log('Processing scheduled notifications...');
    
    try {
      const now = new Date();
      const notificationsSnapshot = await db.collection('notifications')
        .where('scheduledFor', '<=', now)
        .where('channels.inApp.sent', '==', false)
        .limit(100)
        .get();
      
      const batch = db.batch();
      
      for (const notificationDoc of notificationsSnapshot.docs) {
        const notification = notificationDoc.data();
        
        // Get user data for delivery
        const userDoc = await db.collection('users').doc(notification.userId).get();
        
        if (userDoc.exists()) {
          const user = userDoc.data();
          
          // In a real implementation, you would send emails/SMS here
          // For now, just mark as sent
          batch.update(notificationDoc.ref, {
            'channels.inApp.sent': true,
            'channels.email.sent': true,
            'channels.email.delivered': true,
            sentAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
      
      await batch.commit();
      console.log(`Processed ${notificationsSnapshot.size} scheduled notifications`);
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  });

// Trigger on order status change
exports.onOrderStatusChange = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if status changed
    if (before.status !== after.status) {
      console.log(`Order ${context.params.orderId} status changed from ${before.status} to ${after.status}`);
      
      try {
        await sendOrderStatusNotification(
          context.params.orderId,
          after.status,
          after.farmerId,
          after.customerId
        );
      } catch (error) {
        console.error('Error sending order status notification:', error);
      }
    }
  });

// Trigger on new review
exports.onNewReview = functions.firestore
  .document('reviews/{reviewId}')
  .onCreate(async (snap, context) => {
    const review = snap.data();
    
    try {
      // Send notification to farmer
      let farmerId = null;
      
      if (review.type === 'product') {
        const productDoc = await db.collection('products').doc(review.targetId).get();
        if (productDoc.exists()) {
          farmerId = productDoc.data().farmerId;
        }
      } else if (review.type === 'farmer') {
        farmerId = review.targetId;
      }
      
      if (farmerId) {
        await createNotification(farmerId, {
          type: 'new_review',
          priority: 'medium',
          title: 'New Review Received',
          message: 'A customer has left a review for your product',
          actionData: {
            reviewId: context.params.reviewId,
            targetId: review.targetId,
            customerId: review.customerId,
            type: 'review'
          }
        });
      }
    } catch (error) {
      console.error('Error sending new review notification:', error);
    }
  });

// Helper functions
async function createNotification(userId, notificationData) {
  return await db.collection('notifications').add({
    userId,
    ...notificationData,
    channels: {
      inApp: { sent: true, read: false, readAt: null },
      email: { sent: true, delivered: false, sentAt: null },
      sms: { sent: false, delivered: false, sentAt: null }
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function logInventoryChange(productId, batchId, type, data) {
  return await db.collection('inventory_logs').add({
    productId,
    batchId,
    type,
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function sendOrderStatusNotification(orderId, newStatus, farmerId, customerId) {
  const notifications = [];
  
  switch (newStatus) {
    case 'confirmed':
      notifications.push({
        userId: customerId,
        type: 'order_confirmed',
        priority: 'medium',
        title: 'Order Confirmed',
        message: 'Your order has been confirmed by the farmer',
        actionData: { orderId, type: 'order' }
      });
      break;
      
    case 'shipped':
      notifications.push({
        userId: customerId,
        type: 'order_shipped',
        priority: 'high',
        title: 'Order Shipped',
        message: 'Your order is on its way!',
        actionData: { orderId, type: 'order' }
      });
      break;
      
    case 'delivered':
      notifications.push({
        userId: customerId,
        type: 'order_delivered',
        priority: 'medium',
        title: 'Order Delivered',
        message: 'Your order has been delivered. Please confirm receipt.',
        actionData: { orderId, type: 'order' }
      });
      break;
      
    case 'cancelled':
      notifications.push({
        userId: customerId,
        type: 'order_cancelled',
        priority: 'high',
        title: 'Order Cancelled',
        message: 'Your order has been cancelled',
        actionData: { orderId, type: 'order' }
      });
      break;
  }
  
  // Send all notifications
  const promises = notifications.map(notification => createNotification(notification.userId, notification));
  await Promise.all(promises);
}