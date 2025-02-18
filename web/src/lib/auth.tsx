import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, type UserData } from './firebase';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

// Function to notify extension of auth state changes
async function notifyExtension(user: UserData | null) {
  const extensionId = import.meta.env.VITE_EXTENSION_ID;
  if (!extensionId) {
    console.warn('Extension ID not configured');
    return;
  }

  try {
    console.log('Notifying extension of auth state change:', { extensionId, user });
    await chrome.runtime.sendMessage(extensionId, {
      type: 'AUTH_STATE_CHANGED',
      user: user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isSubscribed: user.isSubscribed,
        remainingRequests: user.remainingRequests,
        subscription: user.subscription
      } : null
    });
  } catch (error) {
    // Don't throw error if extension is not installed
    if (!error.message?.includes('Could not establish connection')) {
      console.error('Failed to notify extension:', error);
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Get user data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          setUserData(data);
          // Notify extension
          await notifyExtension(data);
        }
      } else {
        setUserData(null);
        // Notify extension of logout
        await notifyExtension(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document
    const userData: UserData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      remainingRequests: 5,
      isSubscribed: false,
      createdAt: Date.now()
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
    await notifyExtension(userData);
  };

  const signInWithGoogle = async () => {
    const { user } = await signInWithPopup(auth, googleProvider);
    
    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create user document for new Google users
      const userData: UserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        remainingRequests: 5,
        isSubscribed: false,
        createdAt: Date.now()
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      await notifyExtension(userData);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    await notifyExtension(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 