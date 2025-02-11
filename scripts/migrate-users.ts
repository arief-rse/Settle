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

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  remainingRequests: number;
  isSubscribed: boolean;
  createdAt: number;
}

async function migrateUsers() {
  console.log('Starting user data migration...');
  const results = {
    success: 0,
    failed: 0
  };

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    console.log(`Found ${snapshot.size} users to process\n`);

    for (const docSnapshot of snapshot.docs) {
      try {
        const data = docSnapshot.data();
        const updatedData = {
          uid: docSnapshot.id,
          email: data.email ?? null,
          displayName: data.displayName ?? (data.email ? data.email.split('@')[0] : null),
          photoURL: data.photoURL ?? null,
          remainingRequests: typeof data.remainingRequests === 'number' ? data.remainingRequests : 5,
          isSubscribed: Boolean(data.isSubscribed),
          createdAt: data.createdAt || Date.now()
        } satisfies UserData;

        // Only update fields that are missing or different
        const currentData = data as Partial<UserData>;
        const updates: Partial<UserData> = {};
        
        (Object.keys(updatedData) as Array<keyof UserData>).forEach(key => {
          if (currentData[key] !== updatedData[key]) {
            updates[key] = updatedData[key];
          }
        });

        if (Object.keys(updates).length > 0) {
          await docSnapshot.ref.update(updates);
          console.log(`✅ Migrated user ${docSnapshot.id}:`, updates);
          results.success++;
        } else {
          console.log(`ℹ️ No updates needed for user ${docSnapshot.id}`);
        }
      } catch (error) {
        console.error(`❌ Failed to migrate user ${docSnapshot.id}:`, error);
        results.failed++;
      }
    }

    console.log('\nMigration Summary:');
    console.log(`✅ Successfully migrated: ${results.success} users`);
    if (results.failed > 0) {
      console.log(`❌ Failed to migrate: ${results.failed} users`);
    }
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

// Run the migration
migrateUsers().then(() => {
  console.log('\nMigration completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('\nMigration failed:', error);
  process.exit(1);
}); 