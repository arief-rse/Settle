import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, updateDoc, increment } from 'firebase/firestore';

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
setPersistence(auth, indexedDBLocalPersistence).catch((error) => {
  console.error("Error setting persistence:", error);
});

export const db = getFirestore(app);

export interface UserData {
  remainingRequests: number;
  isSubscribed: boolean;
  createdAt: number;
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

export { auth }; 