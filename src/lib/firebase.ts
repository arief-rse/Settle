import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithCredential,
  User,
  connectAuthEmulator
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  updateDoc, 
  increment, 
  setDoc, 
  getDoc,
  collection,
  getDocs,
  connectFirestoreEmulator,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import type { UserData } from './types';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  console.error('Failed to enable persistence:', err);
});

// In development, connect to emulators if they exist
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    console.error('Failed to connect to emulators:', error);
  }
}

// Enable auth persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Failed to set auth persistence:', error);
});

// Base user data type without optional fields
interface BaseUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  remainingRequests: number;
  isSubscribed: boolean;
  createdAt: number;
}

/**
 * Creates or updates a user document with standardized fields
 */
export async function createOrUpdateUser(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const userData: UserData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      remainingRequests: 5, // Default number of requests
      isSubscribed: false,
      createdAt: Date.now()
    };
    await setDoc(userRef, userData);
    console.log('New user document created:', user.uid);
  } else {
    // Update only if email or display name has changed
    const currentData = userDoc.data() as UserData;
    if (currentData.email !== user.email || currentData.displayName !== user.displayName) {
      await updateDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
      console.log('User document updated:', user.uid);
    }
  }
}

// Function to handle Google Sign In for Chrome Extension
export async function signInWithChromeGoogle(): Promise<void> {
  try {
    const manifest = chrome.runtime.getManifest();
    const clientId = manifest.oauth2?.client_id;
    
    if (!clientId) {
      throw new Error('OAuth2 client ID not found in manifest');
    }

    // Request Google token
    const token = await new Promise<string>((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!token) {
          reject(new Error('Failed to get auth token'));
          return;
        }
        resolve(token);
      });
    });

    // Create credential from token
    const credential = GoogleAuthProvider.credential(null, token);
    
    // Sign in with credential
    const userCredential = await signInWithCredential(auth, credential);
    
    // Create or update user document
    await createOrUpdateUser(userCredential.user);
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export async function decrementRemainingRequests(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      remainingRequests: increment(-1)
    });
    return true;
  } catch (error) {
    console.error('Error decrementing remaining requests:', error);
    return false;
  }
}

export async function checkRequestAvailability(userData: UserData | null): Promise<boolean> {
  if (!userData) return false;
  return userData.isSubscribed || userData.remainingRequests > 0;
}

/**
 * Migrates existing user documents to the new structure
 */
export async function migrateUserDocuments(): Promise<{ success: number; failed: number }> {
  const results = {
    success: 0,
    failed: 0
  };

  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    for (const docSnapshot of snapshot.docs) {
      try {
        const data = docSnapshot.data();
        const updates: Partial<BaseUserData> = {};

        // Check each field individually
        if (docSnapshot.id !== data.uid) {
          updates.uid = docSnapshot.id;
        }

        if (data.email !== null && typeof data.email !== 'string') {
          updates.email = null;
        }

        if (data.displayName !== null && typeof data.displayName !== 'string') {
          updates.displayName = data.email ? data.email.split('@')[0] : null;
        }

        if (data.photoURL !== null && typeof data.photoURL !== 'string') {
          updates.photoURL = null;
        }

        if (typeof data.remainingRequests !== 'number') {
          updates.remainingRequests = 5;
        }

        if (typeof data.isSubscribed !== 'boolean') {
          updates.isSubscribed = false;
        }

        if (typeof data.createdAt !== 'number') {
          updates.createdAt = Date.now();
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(docSnapshot.ref, updates);
          console.log(`Migrated user document: ${docSnapshot.id}`, updates);
          results.success++;
        }
      } catch (error) {
        console.error(`Failed to migrate user document ${docSnapshot.id}:`, error);
        results.failed++;
      }
    }
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }

  return results;
}

// Function to run migration directly
export async function runMigration() {
  console.log('Starting user data migration...');
  try {
    const results = await migrateUserDocuments();
    console.log('Migration completed:', results);
    console.log(`✅ Successfully migrated: ${results.success} users`);
    if (results.failed > 0) {
      console.log(`❌ Failed to migrate: ${results.failed} users`);
    }
    return results;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Expose the function to window object for console access
if (typeof window !== 'undefined') {
  (window as any).runUserMigration = runMigration;
}

export type { UserData };