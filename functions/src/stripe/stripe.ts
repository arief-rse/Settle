import Stripe from 'stripe';
import * as functions from 'firebase-functions';

const stripeConfig = functions.config().stripe;
const secretKey = stripeConfig?.secret_key;
const webhookSecret = stripeConfig?.webhook_secret;

if (!secretKey) {
  throw new Error('Missing stripe.secret_key in Firebase config');
}

export const stripe = new Stripe(secretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = webhookSecret; 