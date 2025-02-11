import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin with service account
let serviceAccountPath: string;
try {
  serviceAccountPath = resolve(__dirname, '../service-account-key.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
  
  // Initialize Firebase Admin
  initializeApp({
    credential: cert(serviceAccount),
    projectId: "settle-75bb2"
  });
} catch (error) {
  console.error('❌ Error reading service account key:', error);
  process.exit(1);
}

const db = getFirestore();

async function resetDatabase() {
  console.log('Starting database reset...');
  const results = {
    deletedUsers: 0,
    deletedSubscriptions: 0,
    deletedHistory: 0,
    deletedCustomers: 0,
    failed: 0
  };

  try {
    // Delete all users
    console.log('\nDeleting users...');
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.get();
    
    for (const doc of userSnapshot.docs) {
      try {
        await doc.ref.delete();
        console.log(`✅ Deleted user: ${doc.id}`);
        results.deletedUsers++;
      } catch (error) {
        console.error(`❌ Failed to delete user ${doc.id}:`, error);
        results.failed++;
      }
    }

    // Delete all subscriptions
    console.log('\nDeleting subscriptions...');
    const subscriptionsRef = db.collection('subscriptions');
    const subscriptionSnapshot = await subscriptionsRef.get();
    
    for (const doc of subscriptionSnapshot.docs) {
      try {
        await doc.ref.delete();
        console.log(`✅ Deleted subscription: ${doc.id}`);
        results.deletedSubscriptions++;
      } catch (error) {
        console.error(`❌ Failed to delete subscription ${doc.id}:`, error);
        results.failed++;
      }
    }

    // Delete all history
    console.log('\nDeleting history...');
    const historyRef = db.collection('history');
    const historySnapshot = await historyRef.get();
    
    for (const doc of historySnapshot.docs) {
      try {
        await doc.ref.delete();
        console.log(`✅ Deleted history: ${doc.id}`);
        results.deletedHistory++;
      } catch (error) {
        console.error(`❌ Failed to delete history ${doc.id}:`, error);
        results.failed++;
      }
    }

    // Delete all customers
    console.log('\nDeleting customers...');
    const customersRef = db.collection('customers');
    const customersSnapshot = await customersRef.get();
    
    for (const doc of customersSnapshot.docs) {
      try {
        await doc.ref.delete();
        console.log(`✅ Deleted customer: ${doc.id}`);
        results.deletedCustomers++;
      } catch (error) {
        console.error(`❌ Failed to delete customer ${doc.id}:`, error);
        results.failed++;
      }
    }

    console.log('\nReset Summary:');
    console.log(`✅ Deleted ${results.deletedUsers} users`);
    console.log(`✅ Deleted ${results.deletedSubscriptions} subscriptions`);
    console.log(`✅ Deleted ${results.deletedHistory} history records`);
    console.log(`✅ Deleted ${results.deletedCustomers} customers`);
    if (results.failed > 0) {
      console.log(`❌ Failed to delete ${results.failed} documents`);
    }
  } catch (error) {
    console.error('Reset error:', error);
    throw error;
  }
}

// Run the reset
console.log('⚠️ WARNING: This will delete all data from the database!');
console.log('This includes: users, subscriptions, history, and customers');
console.log('Press Ctrl+C within 5 seconds to cancel...\n');

setTimeout(() => {
  resetDatabase().then(() => {
    console.log('\nDatabase reset completed successfully');
    process.exit(0);
  }).catch((error) => {
    console.error('\nDatabase reset failed:', error);
    process.exit(1);
  });
}, 5000); 