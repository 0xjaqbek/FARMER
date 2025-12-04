// functions/src/pushNotifications.js
const admin = require('firebase-admin');

exports.sendPushNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    
    if (!notification.userId || !notification.push) return;
    
    // Get user's push subscription from Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(notification.userId)
      .get();
    
    const pushSubscription = userDoc.data()?.pushSubscription;
    if (!pushSubscription) return;
    
    const payload = {
      notification: {
        title: notification.title,
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: notification.type || 'general',
        data: {
          type: notification.type,
          orderId: notification.orderId,
          campaignId: notification.campaignId,
          productId: notification.productId
        }
      }
    };
    
    try {
      await admin.messaging().sendToDevice(pushSubscription.token, payload);
      console.log('Push notification sent successfully');
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  });