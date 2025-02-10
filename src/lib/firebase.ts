import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  DocumentData,
  serverTimestamp,
  updateDoc,
  query,
  where,
  getDocs,
  writeBatch,
  limit
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
setPersistence(auth, indexedDBLocalPersistence).catch((error) => {
  console.error("Error setting persistence:", error);
});

export const db = getFirestore(app);

// Collection References
export const usersRef = collection(db, 'users');
export const historyRef = collection(db, 'history');
export const subscriptionsRef = collection(db, 'subscriptions');

// User Management
export interface UserData {
  uid: string;
  email: string;
  remainingRequests: number;
  createdAt: Date;
  subscription?: {
    type: 'free' | 'premium';
    status: 'active' | 'cancelled';
    expiresAt: Date;
  };
}

// Enhanced Subscription Management
export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  requestLimit: number;
  features: string[];
}

export interface SubscriptionData {
  id?: string;
  userId: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
  status: 'active' | 'cancelled' | 'expired';
  tier: 'free' | 'premium' | 'enterprise';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  requestsUsed: number;
  requestLimit: number;
}

// Subscription tiers configuration
export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    requestLimit: 10,
    features: ['10 requests per month', 'Basic analysis', 'Text and image processing']
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    requestLimit: 100,
    features: [
      '100 requests per month',
      'Advanced analysis',
      'Priority processing',
      'Image generation',
      'History storage'
    ]
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 49.99,
    requestLimit: 1000,
    features: [
      'Unlimited requests',
      'Custom solutions',
      'Priority support',
      'Advanced analytics',
      'Team collaboration'
    ]
  }
};

// Initialize collections function
export const initializeCollections = async () => {
  try {
    const batch = writeBatch(db);

    // Initialize metadata collection
    const metadataRef = doc(db, 'metadata', 'indexes');
    batch.set(metadataRef, {
      collections: [
        'users',
        'subscriptions',
        'subscription_tiers',
        'history',
        'metadata'
      ],
      lastUpdated: serverTimestamp(),
      version: '1.0'
    });

    // Initialize subscription_tiers collection
    const tiersRef = collection(db, 'subscription_tiers');
    Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
      const tierDoc = doc(tiersRef, tier.id);
      batch.set(tierDoc, {
        name: tier.name,
        price: tier.price,
        requestLimit: tier.requestLimit,
        features: tier.features,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      });
    });

    // Create collection structure documents
    const structureRef = doc(db, 'metadata', 'structure');
    batch.set(structureRef, {
      collections: {
        users: {
          fields: ['email', 'createdAt', 'uid'],
          description: 'User accounts and profiles'
        },
        subscriptions: {
          fields: [
            'userId',
            'tier',
            'status',
            'requestsUsed',
            'requestLimit',
            'currentPeriodStart',
            'currentPeriodEnd'
          ],
          description: 'User subscription data'
        },
        subscription_tiers: {
          fields: ['name', 'price', 'requestLimit', 'features'],
          description: 'Available subscription plans'
        },
        history: {
          fields: ['userId', 'text', 'response', 'source', 'timestamp'],
          description: 'User analysis history'
        }
      },
      updatedAt: serverTimestamp()
    });

    // Create default indexes
    const indexesRef = doc(db, 'metadata', 'indexes');
    batch.set(indexesRef, {
      indexes: {
        subscriptions: [
          { fields: ['userId', 'status'] },
          { fields: ['tier', 'status'] }
        ],
        history: [
          { fields: ['userId', 'timestamp'] }
        ]
      },
      updatedAt: serverTimestamp()
    });

    await batch.commit();
    console.log('Collections initialized successfully');
  } catch (error) {
    console.error('Error initializing collections:', error);
    throw error;
  }
};

// Collection structure interfaces
interface CollectionSchema {
  fields: string[];
  description: string;
}

interface CollectionStructure {
  collections: {
    [key: string]: CollectionSchema;
  };
  updatedAt: any; // FirebaseTimestamp
}

// Function to validate collection structure
export const validateCollectionStructure = async () => {
  try {
    const structureRef = doc(db, 'metadata', 'structure');
    const structureDoc = await getDoc(structureRef);
    
    if (!structureDoc.exists()) {
      console.warn('Collection structure not found, initializing...');
      await initializeCollections();
      return;
    }

    const structure = structureDoc.data() as CollectionStructure;
    const collections = structure.collections;

    // Validate each collection has required fields
    for (const [collectionName, schema] of Object.entries(collections)) {
      console.log(`Validating ${collectionName} collection...`);
      const collectionRef = collection(db, collectionName);
      const sampleDoc = await getDocs(query(collectionRef, limit(1)));
      
      if (!sampleDoc.empty) {
        const data = sampleDoc.docs[0].data();
        const missingFields = schema.fields.filter((field: string) => !(field in data));
        
        if (missingFields.length > 0) {
          console.warn(`Missing fields in ${collectionName}:`, missingFields);
        }
      }
    }
  } catch (error) {
    console.error('Error validating collection structure:', error);
    throw error;
  }
};

// Function to check if collections are initialized
export const checkCollectionsInitialized = async (): Promise<boolean> => {
  try {
    const indexesRef = doc(db, 'metadata', 'indexes');
    const indexesDoc = await getDoc(indexesRef);
    return indexesDoc.exists();
  } catch (error) {
    console.error('Error checking collections:', error);
    return false;
  }
};

// Update the ensure collections function to include validation
export const ensureCollectionsInitialized = async () => {
  try {
    const isInitialized = await checkCollectionsInitialized();
    if (!isInitialized) {
      await initializeCollections();
    }
    await validateCollectionStructure();
  } catch (error) {
    console.error('Error ensuring collections:', error);
    throw error;
  }
};

// Subscription Management Functions
export const createSubscription = async (
  userId: string,
  subscriptionData: Partial<SubscriptionData>
): Promise<void> => {
  try {
    const subscriptionRef = doc(collection(db, 'subscriptions'));
    await setDoc(subscriptionRef, {
      userId,
      requestsUsed: 0,
      status: 'active',
      tier: 'free',
      requestLimit: 10,
      currentPeriodStart: serverTimestamp(),
      currentPeriodEnd: serverTimestamp(),
      cancelAtPeriodEnd: false,
      ...subscriptionData
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

export const getSubscription = async (userId: string): Promise<SubscriptionData | null> => {
  try {
    const subscriptionsRef = collection(db, 'subscriptions');
    const q = query(subscriptionsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const subscriptionDoc = querySnapshot.docs[0];
      return { id: subscriptionDoc.id, ...subscriptionDoc.data() } as SubscriptionData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
};

export const updateSubscription = async (
  userId: string,
  updates: Partial<SubscriptionData>
): Promise<void> => {
  try {
    const subscription = await getSubscription(userId);
    if (!subscription || !subscription.id) {
      throw new Error('No subscription found for user');
    }

    const subscriptionRef = doc(db, 'subscriptions', subscription.id);
    await updateDoc(subscriptionRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

export const incrementRequestCount = async (userId: string): Promise<boolean> => {
  try {
    const subscription = await getSubscription(userId);
    if (!subscription) {
      return false;
    }

    if (subscription.requestsUsed >= subscription.requestLimit) {
      return false;
    }

    await updateSubscription(userId, {
      requestsUsed: subscription.requestsUsed + 1
    });

    return true;
  } catch (error) {
    console.error('Error incrementing request count:', error);
    return false;
  }
};

export const checkSubscriptionStatus = async (userId: string): Promise<{
  canMakeRequest: boolean;
  requestsRemaining: number;
  subscription: SubscriptionData | null;
}> => {
  try {
    const subscription = await getSubscription(userId);
    if (!subscription) {
      return {
        canMakeRequest: false,
        requestsRemaining: 0,
        subscription: null
      };
    }

    const requestsRemaining = subscription.requestLimit - subscription.requestsUsed;
    return {
      canMakeRequest: requestsRemaining > 0 && subscription.status === 'active',
      requestsRemaining,
      subscription
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    throw error;
  }
};

// Update createUserDocument to also create a free subscription
export const createUserDocument = async (
  uid: string,
  email: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const userData: DocumentData = {
        uid,
        email,
        createdAt: serverTimestamp(),
      };

      await setDoc(userRef, userData);
      
      // Create free subscription for new user
      await createSubscription(uid, {
        tier: 'free',
        requestLimit: 10,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
    }
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

// History Management
export interface HistoryData {
  userId: string;
  text: string;
  response: string;
  source: 'text' | 'image' | 'both';
  imageData?: string;
  query: string;
  timestamp: Date;
}

// Utility function to get user data
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

// Utility function to update remaining requests
export const updateRemainingRequests = async (
  uid: string,
  newCount: number
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { remainingRequests: newCount }, { merge: true });
  } catch (error) {
    console.error('Error updating remaining requests:', error);
    throw error;
  }
};

// Utility function to check if user has remaining requests
export const hasRemainingRequests = async (uid: string): Promise<boolean> => {
  try {
    const userData = await getUserData(uid);
    return userData?.remainingRequests ? userData.remainingRequests > 0 : false;
  } catch (error) {
    console.error('Error checking remaining requests:', error);
    throw error;
  }
};

// Utility function to decrement remaining requests
export const decrementRemainingRequests = async (uid: string): Promise<void> => {
  try {
    const userData = await getUserData(uid);
    if (userData && userData.remainingRequests > 0) {
      await updateRemainingRequests(uid, userData.remainingRequests - 1);
    }
  } catch (error) {
    console.error('Error decrementing remaining requests:', error);
    throw error;
  }
};

export { auth }; 