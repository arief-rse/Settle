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

interface SubscriptionData {
  userId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid';
  stripeSubscriptionId: string;
  stripePriceId: string;
  stripeCustomerId: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  createdAt: number;
  updatedAt: number;
}

async function migrateSubscriptions() {
  console.log('Starting subscriptions migration...');
  const results = {
    success: 0,
    failed: 0
  };

  try {
    const subscriptionsRef = db.collection('subscriptions');
    const snapshot = await subscriptionsRef.get();

    console.log(`Found ${snapshot.size} subscriptions to process\n`);

    for (const docSnapshot of snapshot.docs) {
      try {
        const data = docSnapshot.data();
        const updatedData = {
          userId: data.userId,
          status: data.status || 'incomplete',
          stripeSubscriptionId: data.stripeSubscriptionId,
          stripePriceId: data.stripePriceId,
          stripeCustomerId: data.stripeCustomerId,
          currentPeriodStart: data.currentPeriodStart || data.createdAt || Date.now(),
          currentPeriodEnd: data.currentPeriodEnd || (data.createdAt ? data.createdAt + 30 * 24 * 60 * 60 * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
          createdAt: data.createdAt || Date.now(),
          updatedAt: Date.now()
        } satisfies SubscriptionData;

        // Only update fields that are missing or different
        const currentData = data as Partial<SubscriptionData>;
        const updates: Partial<SubscriptionData> = {};
        
        (Object.keys(updatedData) as Array<keyof SubscriptionData>).forEach(key => {
          if (currentData[key] !== updatedData[key]) {
            updates[key] = updatedData[key];
          }
        });

        if (Object.keys(updates).length > 0) {
          await docSnapshot.ref.update(updates);
          console.log(`✅ Migrated subscription ${docSnapshot.id}:`, updates);
          
          // Update user's isSubscribed status
          if (data.userId) {
            const userRef = db.collection('users').doc(data.userId);
            await userRef.update({
              isSubscribed: updatedData.status === 'active' || updatedData.status === 'trialing'
            });
            console.log(`✅ Updated user ${data.userId} subscription status`);
          }
          
          results.success++;
        } else {
          console.log(`ℹ️ No updates needed for subscription ${docSnapshot.id}`);
        }
      } catch (error) {
        console.error(`❌ Failed to migrate subscription ${docSnapshot.id}:`, error);
        results.failed++;
      }
    }

    console.log('\nMigration Summary:');
    console.log(`✅ Successfully migrated: ${results.success} subscriptions`);
    if (results.failed > 0) {
      console.log(`❌ Failed to migrate: ${results.failed} subscriptions`);
    }
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

// Run the migration
migrateSubscriptions().then(() => {
  console.log('\nMigration completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('\nMigration failed:', error);
  process.exit(1);
}); 