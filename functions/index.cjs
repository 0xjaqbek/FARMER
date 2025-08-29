const admin = require('firebase-admin');

// Import specific 2nd generation Cloud Function types
const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");

// Initialize admin only once
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Fixed: Order status change trigger (updated to 2nd Gen)
exports.onOrderStatusChange = onDocumentUpdated("orders/{orderId}", async (event) => {
    console.log('Order status change detected');

    // Make sure data exists before proceeding
    if (!event.data) {
        console.log('No data associated with the event.');
        return;
    }

    try {
      // In 2nd Gen, data is accessed via event.data.before and event.data.after
      const before = event.data.before.data();
      const after = event.data.after.data();
      // Parameters are accessed via event.params
      const orderId = event.params.orderId;

      // Check if status actually changed
      if (before.status === after.status) {
        console.log('No status change detected, skipping notification');
        return;
      }

      console.log(`Order ${orderId} status changed from ${before.status} to ${after.status}`);

      await sendOrderStatusNotification(orderId, after.status, after.rolnikId, after.clientId);

    } catch (error) {
      console.error('Error handling order status change:', error);
    }
});

// New message notification trigger (updated to 2nd Gen)
exports.onNewMessage = onDocumentCreated("conversations/{conversationId}/messages/{messageId}", async (event) => {
    console.log('New message detected');

    if (!event.data) {
        console.log('No data associated with the event.');
        return;
    }

    try {
      // For onCreate, the document data is directly on event.data
      const message = event.data.data();
      const conversationId = event.params.conversationId;

      // Get conversation data to find participants
      const conversationDoc = await db.collection('conversations').doc(conversationId).get();

      if (conversationDoc.exists()) {
        const conversation = conversationDoc.data();
        const participants = conversation.participants || [];

        // Send notification to all participants except sender
        const recipientIds = participants.filter(id => id !== message.senderId);

        for (const recipientId of recipientIds) {
          await createNotification(recipientId, {
            type: 'new_message',
            priority: 'medium',
            title: 'New Message',
            message: `You have a new message from ${message.senderName || 'someone'}`,
            actionData: {
              conversationId: conversationId,
              messageId: event.params.messageId, // Use event.params
              type: 'conversation'
            }
          });
        }
      }

    } catch (error) {
      console.error('Error sending new message notification:', error);
    }
});

// Inventory check function (updated to 2nd Gen Pub/Sub)
// The `event` parameter for onSchedule is often not explicitly used if you only need to trigger a job
exports.checkInventoryLevels = onSchedule("every 6 hours", async (event) => {
    console.log('Checking inventory levels...');

    try {
      const productsSnapshot = await db.collection('products').get();

      for (const productDoc of productsSnapshot.docs) {
        const product = productDoc.data();

        // Check total stock level
        const totalStock = (product.inventory?.batches || [])
          .reduce((sum, batch) => sum + (batch.quantity || 0), 0);

        // Low stock notification
        if (totalStock <= (product.lowStockThreshold || 5) && totalStock > 0) {
          await createNotification(product.farmerId, {
            type: 'low_stock',
            priority: 'medium',
            title: 'Low Stock Alert',
            message: `${product.name} is running low (${totalStock} remaining)`,
            actionData: {
              productId: productDoc.id,
              currentStock: totalStock,
              type: 'product'
            }
          });
        }

        // Out of stock notification
        if (totalStock === 0) {
          await createNotification(product.farmerId, {
            type: 'out_of_stock',
            priority: 'high',
            title: 'Out of Stock',
            message: `${product.name} is out of stock`,
            actionData: {
              productId: productDoc.id,
              type: 'product'
            }
          });
        }

        // Check for expiring batches
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

        for (const batch of product.inventory?.batches || []) {
          if (batch.expiryDate && batch.quantity > 0) {
            const expiryDate = new Date(batch.expiryDate.seconds * 1000);

            if (expiryDate <= threeDaysFromNow && expiryDate > now) {
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

      console.log('Finished checking inventory levels');
    } catch (error) {
      console.error('Error checking inventory levels:', error);
    }
});

// Seasonal notifications (updated to 2nd Gen Pub/Sub)
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

// Process scheduled notifications (updated to 2nd Gen Pub/Sub)
exports.processScheduledNotifications = onSchedule("*/5 * * * *", async (event) => {
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

// New review notification trigger (updated to 2nd Gen)
exports.onNewReview = onDocumentCreated("reviews/{reviewId}", async (event) => {
    console.log('New review detected');

    if (!event.data) {
        console.log('No data associated with the event.');
        return;
    }

    try {
      const review = event.data.data();
      const reviewId = event.params.reviewId; // Access reviewId from event.params

      if (review.targetType === 'farmer') {
        // Notify farmer of new review
        await createNotification(review.targetId, {
          type: 'new_review',
          priority: 'medium',
          title: 'New Review',
          message: `You received a ${review.rating}-star review for your product`,
          actionData: {
            reviewId: reviewId, // Use the extracted reviewId
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

// HELPER FUNCTIONS (No changes needed for these, as they are not triggers)

async function createNotification(userId, notificationData) {
  try {
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

// Keep this function even if unused for future inventory logging
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
    case 'in_transit':
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

      // Also notify farmer
      notifications.push({
        userId: farmerId,
        type: 'order_cancelled',
        priority: 'medium',
        title: 'Order Cancelled',
        message: `Order ${orderId} was cancelled`,
        actionData: { orderId, type: 'order' }
      });
      break;
  }

  // Send all notifications
  const promises = notifications.map(notification =>
    createNotification(notification.userId, notification)
  );
  await Promise.all(promises);
}

// Ensure all your functions are exported correctly for Firebase to deploy them.
// The previous `module.exports = { logInventoryChange };` would override all previous `exports.myFunction = ...`
// So we just let the direct `exports.functionName = ...` assignments stand.
