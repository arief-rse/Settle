import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, indexedDBLocalPersistence } from 'firebase/auth';

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

export { auth }; 