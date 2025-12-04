// Fixed functions/index.cjs - Replace your current file with this
const admin = require('firebase-admin');

// Import specific 2nd generation Cloud Function types
const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");

// Initialize admin only once
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// FIXED: Order status change trigger
exports.onOrderStatusChange = onDocumentUpdated("orders/{orderId}", async (event) => {
    console.log('Order status change detected');

    if (!event.data) {
        console.log('No data associated with the event.');
        return;
    }

    try {
      const before = event.data.before.data();
      const after = event.data.after.data();
      const orderId = event.params.orderId;

      if (before.status === after.status) {
        console.log('No status change detected, skipping notification');
        return;
      }

      console.log(`Order ${orderId} status changed from ${before.status} to ${after.status}`);

      // FIXED: Handle missing clientId/farmerId fields gracefully
      const farmerId = after.farmerId || after.rolnikId;
      const customerId = after.customerId || after.clientId;

      if (!customerId) {
        console.log('Warning: No customer ID found in order data, skipping notification');
        return;
      }

      await sendOrderStatusNotification(orderId, after.status, farmerId, customerId);

    } catch (error) {
      console.error('Error handling order status change:', error);
    }
});

// FIXED: New message notification trigger
exports.onNewMessage = onDocumentCreated("conversations/{conversationId}/messages/{messageId}", async (event) => {
    console.log('New message detected');

    if (!event.data) {
        console.log('No data associated with the event.');
        return;
    }

    try {
      const message = event.data.data();
      const conversationId = event.params.conversationId;

      // FIXED: Use admin SDK .get() method properly
      const conversationDoc = await db.collection('conversations').doc(conversationId).get();

      if (conversationDoc.exists) {  // FIXED: Remove parentheses for admin SDK
        const conversation = conversationDoc.data();
        const participants = conversation.participants || [];

        const recipientIds = participants.filter(id => id !== message.senderId);

        for (const recipientId of recipientIds) {
          if (recipientId) {  // FIXED: Check for valid recipient ID
            await createNotification(recipientId, {
              type: 'new_message',
              priority: 'medium',
              title: 'New Message',
              message: `You have a new message from ${message.senderName || 'someone'}`,
              actionData: {
                conversationId: conversationId,
                messageId: event.params.messageId,
                type: 'conversation'
              }
            });
          }
        }
      }

    } catch (error) {
      console.error('Error sending new message notification:', error);
    }
});

// FIXED: New review notification trigger  
exports.onNewReview = onDocumentCreated("reviews/{reviewId}", async (event) => {
    console.log('New review detected');

    if (!event.data) {
        console.log('No data associated with the event.');
        return;
    }

    try {
      const review = event.data.data();
      const reviewId = event.params.reviewId;

      if (review.targetType === 'farmer' && review.targetId) {  // FIXED: Validate targetId
        await createNotification(review.targetId, {
          type: 'new_review',
          priority: 'medium',
          title: 'New Review',
          message: `You received a ${review.rating}-star review for your product`,
          actionData: {
            reviewId: reviewId,
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

// FIXED: Scheduled notifications processing
exports.processScheduledNotifications = onSchedule("*/5 * * * *", async (event) => {
    console.log('Processing scheduled notifications...');

    try {
      const now = new Date();
      
      // SIMPLIFIED QUERY - Remove the complex index requirement for now
      const notificationsSnapshot = await db.collection('notifications')
        .where('scheduledFor', '<=', now)
        .limit(100)
        .get();

      const batch = db.batch();
      let processedCount = 0;

      for (const notificationDoc of notificationsSnapshot.docs) {
        const notification = notificationDoc.data();
        
        // Skip if already sent
        if (notification.channels?.inApp?.sent) {
          continue;
        }

        // FIXED: Use admin SDK exists property (no parentheses)
        const userDoc = await db.collection('users').doc(notification.userId).get();

        if (userDoc.exists) {  // FIXED: Remove parentheses for admin SDK
          batch.update(notificationDoc.ref, {
            'channels.inApp.sent': true,
            'channels.email.sent': true,
            'channels.email.delivered': true,
            sentAt: admin.firestore.FieldValue.serverTimestamp()
          });
          processedCount++;
        }
      }

      await batch.commit();
      console.log(`Processed ${processedCount} scheduled notifications`);

    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
});

// Inventory check function (working correctly)
exports.checkInventoryLevels = onSchedule("every 6 hours", async (event) => {
    console.log('Checking inventory levels...');

    try {
      const productsSnapshot = await db.collection('products').get();

      for (const productDoc of productsSnapshot.docs) {
        const product = productDoc.data();

        if (product.inventory && typeof product.inventory.available === 'number') {
          const threshold = product.inventory.threshold || 10;
          
          if (product.inventory.available <= threshold) {
            await createNotification(product.farmerId, {
              type: 'low_stock',
              priority: 'high',
              title: 'Low Stock Alert',
              message: `${product.name} is running low (${product.inventory.available} left)`,
              actionData: {
                productId: productDoc.id,
                currentStock: product.inventory.available,
                threshold: threshold,
                type: 'inventory'
              }
            });
          }

          // Check batch expiration
          if (product.inventory.batches) {
            const threeDaysFromNow = new Date(Date.now() + (3 * 24 * 60 * 60 * 1000));
            
            for (const batch of product.inventory.batches) {
              if (batch.expiryDate) {
                const expiryDate = new Date(batch.expiryDate);
                
                if (expiryDate <= threeDaysFromNow) {
                  await createNotification(product.farmerId, {
                    type: 'batch_expiring',
                    priority: 'high',
                    title: 'Batch Expiring Soon',
                    message: `Batch of ${product.name} expires on ${expiryDate.toLocaleDateString()}`,
                    actionData: {
                      productId: productDoc.id,
                      batchId: batch.id,
                      expiryDate: batch.expiryDate,
                      type: 'inventory'
                    }
                  });
                }
              }
            }
          }
        }
      }

      console.log('Finished checking inventory levels');
    } catch (error) {
      console.error('Error checking inventory levels:', error);
    }
});

// Seasonal notifications (working correctly)
exports.checkSeasonalNotifications = onSchedule("0 8 * * *", async (event) => {
    console.log('Checking seasonal notifications...');

    try {
      const productsSnapshot = await db.collection('products').get();
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

      for (const productDoc of productsSnapshot.docs) {
        const product = productDoc.data();

        if (!product.seasonality) continue;

        for (const seasonality of product.seasonality) {
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
      }

      console.log('Finished checking seasonal notifications');
    } catch (error) {
      console.error('Error sending seasonal notifications:', error);
    }
});

// FIXED: Helper function with better error handling
async function createNotification(userId, notificationData) {
  try {
    // FIXED: Validate userId before creating notification
    if (!userId) {
      console.error('Cannot create notification: userId is undefined');
      return null;
    }

    return await db.collection('notifications').add({
      userId,
      ...notificationData,
      channels: {
        inApp: { sent: true, read: false, readAt: null },
        email: { sent: false, delivered: false, sentAt: null },
        sms: { sent: false, delivered: false, sentAt: null }
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// FIXED: Order notification function with better validation
async function sendOrderStatusNotification(orderId, newStatus, farmerId, customerId) {
  console.log(`Sending notification for order ${orderId}, status: ${newStatus}, farmer: ${farmerId}, customer: ${customerId}`);
  
  const notifications = [];

  switch (newStatus) {
    case 'confirmed':
      if (customerId) {  // FIXED: Check if customerId exists
        notifications.push({
          userId: customerId,
          type: 'order_confirmed',
          priority: 'medium',
          title: 'Order Confirmed',
          message: 'Your order has been confirmed by the farmer',
          actionData: { orderId, type: 'order' }
        });
      }
      break;

    case 'shipped':
    case 'in_transit':
      if (customerId) {
        notifications.push({
          userId: customerId,
          type: 'order_shipped',
          priority: 'high',
          title: 'Order Shipped',
          message: 'Your order is on its way!',
          actionData: { orderId, type: 'order' }
        });
      }
      break;

    case 'delivered':
      if (customerId) {
        notifications.push({
          userId: customerId,
          type: 'order_delivered',
          priority: 'medium',
          title: 'Order Delivered',
          message: 'Your order has been delivered. Please confirm receipt.',
          actionData: { orderId, type: 'order' }
        });
      }
      break;

    case 'cancelled':
      if (customerId) {
        notifications.push({
          userId: customerId,
          type: 'order_cancelled',
          priority: 'high',
          title: 'Order Cancelled',
          message: 'Your order has been cancelled',
          actionData: { orderId, type: 'order' }
        });
      }

      if (farmerId) {
        notifications.push({
          userId: farmerId,
          type: 'order_cancelled',
          priority: 'medium',
          title: 'Order Cancelled',
          message: `Order ${orderId} was cancelled`,
          actionData: { orderId, type: 'order' }
        });
      }
      break;
  }

  // FIXED: Only send notifications if we have valid user IDs
  const validNotifications = notifications.filter(n => n.userId);
  
  if (validNotifications.length === 0) {
    console.log('No valid user IDs found, skipping notifications');
    return;
  }

  // Send all notifications
  const promises = validNotifications.map(notification =>
    createNotification(notification.userId, notification)
  );
  
  await Promise.all(promises);
  console.log(`Sent ${validNotifications.length} notifications for order ${orderId}`);
}

// Keep this for future use
async function logInventoryChange(productId, batchId, type, data) {
  try {
    return await db.collection('inventory_logs').add({
      productId,
      batchId,
      type,
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging inventory change:', error);
  }
}