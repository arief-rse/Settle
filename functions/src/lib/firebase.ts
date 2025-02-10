import * as admin from 'firebase-admin';

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export initialized admin and firestore
export const db = admin.firestore();
export { admin }; 