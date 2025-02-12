import { onRequest } from 'firebase-functions/v2/https';
import { Request, Response } from 'express';
import { admin } from '../init';

interface CustomError extends Error {
  code?: string;
  message: string;
}

export const createCustomToken = onRequest(
  { 
    region: 'asia-southeast2',
    cors: true
  }, 
  async (req: Request, res: Response) => {
    try {
      // Check if request is from allowed origins
      const origin = req.headers.origin;
      const allowedOrigins = [
        'https://settle.bangmil.io',
        // TODO: Replace with your actual extension ID from chrome://extensions
        'chrome-extension:mknlhoeodfbpfbciefgibbnbdmfdnehb'
      ];

      if (!origin || !allowedOrigins.includes(origin)) {
        throw new Error('Unauthorized origin');
      }

      // Verify the request method
      if (req.method !== 'POST') {
        throw new Error('Method not allowed');
      }

      // Get the user ID from the request body
      const { uid } = req.body;
      if (!uid) {
        throw new Error('User ID is required');
      }

      // Verify the user exists in Firebase Auth
      await admin.auth().getUser(uid);

      // Create a custom token
      const token = await admin.auth().createCustomToken(uid);

      // Return the token
      res.json({ token });
    } catch (error) {
      const customError = error as CustomError;
      console.error('Error creating custom token:', customError);
      res.status(customError.code === 'auth/user-not-found' ? 404 : 500).json({
        error: customError.message || 'Internal server error'
      });
    }
  }
); 