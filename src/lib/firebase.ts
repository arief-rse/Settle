import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  indexedDBLocalPersistence,
  GoogleAuthProvider,
  signInWithCredential,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  updateDoc, 
  increment, 
  setDoc, 
  getDoc,
  collection,
  getDocs
} from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB46J7O_JYx6diTWjVQxUPgj65F0VasF_Y",
  authDomain: "settle-75bb2.firebaseapp.com",
  projectId: "settle-75bb2",
  storageBucket: "settle-75bb2.firebasestorage.app",
  messagingSenderId: "908976015864",
  appId: "1:908976015864:web:df734cc507a3cab236ee0d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Configure auth for Chrome extension
auth.useDeviceLanguage();

// Set persistence to indexedDB for Chrome extensions
setPersistence(auth, indexedDBLocalPersistence).catch((error: Error) => {
  console.error("Error setting persistence:", error);
});

export interface UserData {
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

export const db = getFirestore(app);

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

export { auth };