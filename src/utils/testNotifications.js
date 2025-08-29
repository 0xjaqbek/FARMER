// Firebase Functions Notification Test Suite
// Save as: src/utils/testNotifications.js
// Run with: import { NotificationTestSuite } from './utils/testNotifications';

import { db, auth } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  _doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  _writeBatch
} from 'firebase/firestore';

export class NotificationTestSuite {
  constructor() {
    this.testResults = [];
    this.currentUser = auth.currentUser;
  }

  // Utility function to log test results
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    console.log(`[${type.toUpperCase()}] ${timestamp}: ${message}`);
    this.testResults.push(logEntry);
  }

  // Generate test data
  generateTestData() {
    const timestamp = Date.now();
    return {
      testUserId: `test_user_${timestamp}`,
      testFarmerId: `test_farmer_${timestamp}`,
      testProductId: `test_product_${timestamp}`,
      testOrderId: `test_order_${timestamp}`,
      testCampaignId: `test_campaign_${timestamp}`,
      testConversationId: `test_conversation_${timestamp}`
    };
  }

  // Test 1: Direct Notification Creation
  async testDirectNotificationCreation() {
    this.log('🧪 Testing direct notification creation...');
    
    try {
      const testData = this.generateTestData();
      
      const notification = {
        userId: this.currentUser?.uid || testData.testUserId,
        type: 'test_notification',
        priority: 'high',
        title: 'Test Notification',
        message: 'This is a direct notification test',
        channels: {
          inApp: { sent: true, read: false, readAt: null },
          email: { sent: false, delivered: false, sentAt: null },
          sms: { sent: false, delivered: false, sentAt: null }
        },
        actionData: {
          type: 'test',
          testId: testData.testUserId
        },
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'notifications'), notification);
      this.log(`✅ Direct notification created successfully: ${docRef.id}`);
      return docRef.id;
      
    } catch (error) {
      this.log(`❌ Direct notification creation failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Test 2: Order Status Change (Triggers onOrderStatusChange function)
  async testOrderStatusChangeNotification() {
    this.log('🧪 Testing order status change notification trigger...');
    
    try {
      const testData = this.generateTestData();
      
      // First create an order
      const orderData = {
        id: testData.testOrderId,
        customerId: this.currentUser?.uid || testData.testUserId,
        farmerId: testData.testFarmerId,
        status: 'pending',
        items: [
          {
            productId: testData.testProductId,
            productName: 'Test Tomatoes',
            quantity: 5,
            price: 25.00
          }
        ],
        totalAmount: 25.00,
        createdAt: serverTimestamp()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      this.log(`✅ Test order created: ${orderRef.id}`);

      // Wait a moment, then update the order status to trigger the function
      setTimeout(async () => {
        try {
          await updateDoc(orderRef, {
            status: 'confirmed',
            updatedAt: serverTimestamp()
          });
          
          this.log(`✅ Order status updated to 'confirmed' - should trigger onOrderStatusChange function`);
          this.log('📋 Check Firebase Functions logs to verify trigger execution');
          
        } catch (updateError) {
          this.log(`❌ Order status update failed: ${updateError.message}`, 'error');
        }
      }, 2000);

      return orderRef.id;
      
    } catch (error) {
      this.log(`❌ Order status change test failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Test 3: New Message Notification (Triggers onNewMessage function)
  async testNewMessageNotification() {
    this.log('🧪 Testing new message notification trigger...');
    
    try {
      const testData = this.generateTestData();
      
      // Create a conversation first
      const conversationData = {
        participants: [
          this.currentUser?.uid || testData.testUserId,
          testData.testFarmerId
        ],
        type: 'direct',
        lastMessage: 'Test conversation',
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      const conversationRef = await addDoc(collection(db, 'conversations'), conversationData);
      this.log(`✅ Test conversation created: ${conversationRef.id}`);

      // Add a message to trigger the function
      setTimeout(async () => {
        try {
          const messageData = {
            senderId: this.currentUser?.uid || testData.testUserId,
            senderName: this.currentUser?.displayName || 'Test User',
            recipientId: testData.testFarmerId,
            content: 'This is a test message to trigger notifications',
            type: 'text',
            timestamp: serverTimestamp(),
            read: false
          };

          const messageRef = await addDoc(
            collection(db, 'conversations', conversationRef.id, 'messages'),
            messageData
          );
          
          this.log(`✅ Test message created: ${messageRef.id} - should trigger onNewMessage function`);
          this.log('📋 Check Firebase Functions logs to verify trigger execution');
          
        } catch (messageError) {
          this.log(`❌ Message creation failed: ${messageError.message}`, 'error');
        }
      }, 3000);

      return conversationRef.id;
      
    } catch (error) {
      this.log(`❌ New message test failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Test 4: New Review Notification (Triggers onNewReview function)
  async testNewReviewNotification() {
    this.log('🧪 Testing new review notification trigger...');
    
    try {
      const testData = this.generateTestData();
      
      const reviewData = {
        customerId: this.currentUser?.uid || testData.testUserId,
        customerName: this.currentUser?.displayName || 'Test Customer',
        targetType: 'farmer',
        targetId: testData.testFarmerId,
        productId: testData.testProductId,
        rating: 5,
        comment: 'Excellent test product! Great quality and fast delivery.',
        createdAt: serverTimestamp(),
        verified: true
      };

      const reviewRef = await addDoc(collection(db, 'reviews'), reviewData);
      this.log(`✅ Test review created: ${reviewRef.id} - should trigger onNewReview function`);
      this.log('📋 Check Firebase Functions logs to verify trigger execution');

      return reviewRef.id;
      
    } catch (error) {
      this.log(`❌ New review test failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Test 5: Inventory Levels Test (Triggers checkInventoryLevels - scheduled function)
  async testInventoryLevelsCheck() {
    this.log('🧪 Testing inventory levels check (scheduled function trigger)...');
    
    try {
      const testData = this.generateTestData();
      
      // Create a product with low inventory to trigger notifications
      const productData = {
        name: 'Test Low Stock Tomatoes',
        description: 'Test product for inventory level checking',
        farmerId: testData.testFarmerId,
        farmerName: 'Test Farmer',
        category: 'vegetables',
        price: 5.00,
        unit: 'kg',
        inventory: {
          available: 2, // Low stock
          reserved: 0,
          threshold: 5, // Threshold higher than available
          batches: [
            {
              id: 'batch_1',
              quantity: 2,
              expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
              harvestedDate: new Date()
            }
          ]
        },
        createdAt: serverTimestamp()
      };

      const productRef = await addDoc(collection(db, 'products'), productData);
      this.log(`✅ Low stock test product created: ${productRef.id}`);
      this.log('📋 This product should trigger low stock notification when checkInventoryLevels runs (every 6 hours)');
      this.log('💡 To test immediately, manually trigger the function in Firebase Console');

      return productRef.id;
      
    } catch (error) {
      this.log(`❌ Inventory levels test failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Test 6: Seasonal Notifications Test
  async testSeasonalNotifications() {
    this.log('🧪 Testing seasonal notifications (scheduled function trigger)...');
    
    try {
      const testData = this.generateTestData();
      
      // Create a product with seasonality starting soon
      const seasonStartDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
      const seasonEndDate = new Date(Date.now() + 93 * 24 * 60 * 60 * 1000); // ~3 months from now
      
      const seasonalProductData = {
        name: 'Test Seasonal Strawberries',
        description: 'Test product for seasonal notification checking',
        farmerId: testData.testFarmerId,
        farmerName: 'Test Farmer',
        category: 'fruits',
        price: 8.00,
        unit: 'kg',
        seasonality: [
          {
            startSeason: seasonStartDate.toISOString(),
            endSeason: seasonEndDate.toISOString(),
            description: 'Peak strawberry season'
          }
        ],
        inventory: {
          available: 50,
          reserved: 0,
          threshold: 10
        },
        createdAt: serverTimestamp()
      };

      const productRef = await addDoc(collection(db, 'products'), seasonalProductData);
      this.log(`✅ Seasonal test product created: ${productRef.id}`);
      this.log('📋 This product should trigger seasonal notification when checkSeasonalNotifications runs (daily at 8 AM)');
      this.log('💡 Season starts in 3 days - should trigger "season starting soon" notification');

      return productRef.id;
      
    } catch (error) {
      this.log(`❌ Seasonal notifications test failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Test 7: Check Existing Notifications
  async testCheckExistingNotifications() {
    this.log('🧪 Checking existing notifications...');
    
    try {
      const userId = this.currentUser?.uid;
      if (!userId) {
        this.log('⚠️ No authenticated user - checking all notifications');
      }

      const notificationsQuery = userId 
        ? query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(10)
          )
        : query(
            collection(db, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(20)
          );

      const snapshot = await getDocs(notificationsQuery);
      
      this.log(`✅ Found ${snapshot.size} recent notifications`);
      
      snapshot.forEach((doc, index) => {
        const notification = doc.data();
        this.log(`📬 [${index + 1}] ${notification.type}: ${notification.title} - ${notification.message}`);
      });

      return snapshot.size;
      
    } catch (error) {
      this.log(`❌ Check existing notifications failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Test 8: Scheduled Notifications Processing Test
  async testScheduledNotificationsProcessing() {
    this.log('🧪 Testing scheduled notifications processing...');
    
    try {
      const testData = this.generateTestData();
      
      // Create a scheduled notification
      const scheduledNotification = {
        userId: this.currentUser?.uid || testData.testUserId,
        type: 'scheduled_test',
        priority: 'medium',
        title: 'Scheduled Test Notification',
        message: 'This notification was scheduled for processing',
        scheduledFor: new Date(Date.now() - 1000), // Schedule 1 second in the past
        channels: {
          inApp: { sent: false, read: false, readAt: null },
          email: { sent: false, delivered: false, sentAt: null },
          sms: { sent: false, delivered: false, sentAt: null }
        },
        actionData: {
          type: 'scheduled_test',
          testId: testData.testUserId
        },
        createdAt: serverTimestamp()
      };

      const notificationRef = await addDoc(collection(db, 'notifications'), scheduledNotification);
      this.log(`✅ Scheduled notification created: ${notificationRef.id}`);
      this.log('📋 This should be processed by processScheduledNotifications function (runs every 5 minutes)');
      this.log('💡 Check Firebase Functions logs to verify processing');

      return notificationRef.id;
      
    } catch (error) {
      this.log(`❌ Scheduled notifications test failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('🚀 Starting comprehensive notification system tests...');
    console.group('🧪 Firebase Functions Notification Test Suite');
    
    try {
      // Test 1: Direct notification creation
      await this.testDirectNotificationCreation();
      await this.delay(2000);

      // Test 2: Order status change trigger
      await this.testOrderStatusChangeNotification();
      await this.delay(3000);

      // Test 3: New message trigger
      await this.testNewMessageNotification();
      await this.delay(3000);

      // Test 4: New review trigger
      await this.testNewReviewNotification();
      await this.delay(2000);

      // Test 5: Inventory levels (scheduled)
      await this.testInventoryLevelsCheck();
      await this.delay(2000);

      // Test 6: Seasonal notifications (scheduled)
      await this.testSeasonalNotifications();
      await this.delay(2000);

      // Test 7: Check existing notifications
      await this.testCheckExistingNotifications();
      await this.delay(2000);

      // Test 8: Scheduled processing
      await this.testScheduledNotificationsProcessing();

      this.log('🎉 All notification tests completed!');
      this.printTestSummary();
      
    } catch (error) {
      this.log(`❌ Test suite failed: ${error.message}`, 'error');
      throw error;
    } finally {
      console.groupEnd();
    }
  }

  // Helper function to add delays between tests
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Print test summary
  printTestSummary() {
    console.group('📊 Test Summary');
    
    const successCount = this.testResults.filter(r => r.message.includes('✅')).length;
    const errorCount = this.testResults.filter(r => r.type === 'error').length;
    const totalTests = this.testResults.length;
    
    console.log(`Total test actions: ${totalTests}`);
    console.log(`Successful actions: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n❌ Errors encountered:');
      this.testResults
        .filter(r => r.type === 'error')
        .forEach(r => console.log(`  - ${r.message}`));
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Check Firebase Console > Functions > Logs for trigger execution');
    console.log('2. Check Firebase Console > Firestore for created test data');
    console.log('3. Verify notifications appear in your app\'s notification center');
    console.log('4. Monitor scheduled functions (every 5 mins, 6 hours, daily)');
    
    console.groupEnd();
  }

  // Clean up test data (optional)
  async cleanupTestData() {
    this.log('🧹 Cleaning up test data...');
    // Implementation would delete test documents created during testing
    // Left as exercise - be careful not to delete production data!
  }
}

// Easy-to-use exported functions
export const runNotificationTests = async () => {
  const testSuite = new NotificationTestSuite();
  await testSuite.runAllTests();
  return testSuite.testResults;
};

export const quickNotificationTest = async () => {
  const testSuite = new NotificationTestSuite();
  await testSuite.testDirectNotificationCreation();
  await testSuite.testCheckExistingNotifications();
  return testSuite.testResults;
};

// Browser console friendly version
if (typeof window !== 'undefined') {
  window.runNotificationTests = runNotificationTests;
  window.quickNotificationTest = quickNotificationTest;
}