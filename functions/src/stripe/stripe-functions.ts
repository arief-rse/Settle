import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https';
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { db, admin } from '../lib/firebase';

// Extend Express Request type to include Firebase-specific properties
interface FirebaseRequest extends Request {
  rawBody: Buffer;
}

interface CheckoutSessionData {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

interface PortalSessionData {
  customerId: string;
  returnUrl: string;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Constants for subscription plans
const SUBSCRIPTION_PLANS = {
  FREE: {
    priceId: process.env.STRIPE_FREE_PRICE_ID,
    requestLimit: 5,
  },
  PRO: {
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    requestLimit: 100,
  },
};

interface CreatePaymentIntentData {
  amount: number;
  currency: string;
}

interface CreateSubscriptionData {
  priceId: string;
  customerId?: string;
}

interface CheckoutSessionRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: {
    userId?: string;
    type?: 'subscription' | 'additional_request';
    creditRequests?: string;
  };
}

// Create a payment intent
export const createPaymentIntent = functions.https.onRequest(async (req: Request, res: Response) => {
  try {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Origin, Accept');
      res.set('Access-Control-Allow-Credentials', 'true');
      res.set('Access-Control-Max-Age', '3600');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const { amount, currency } = req.body as CreatePaymentIntentData;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });
    
    res.set('Access-Control-Allow-Credentials', 'true');
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Create a subscription
export const createSubscription = functions.https.onRequest(async (req: Request, res: Response) => {
  try {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Origin, Accept');
      res.set('Access-Control-Allow-Credentials', 'true');
      res.set('Access-Control-Max-Age', '3600');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const { priceId, customerId } = req.body as CreateSubscriptionData;
    
    if (!customerId) {
      throw new Error('Customer ID is required');
    }
    
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
    
    res.set('Access-Control-Allow-Credentials', 'true');
    res.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Create a checkout session
export const createStripeCheckout = functions.https.onRequest(async (req: Request, res: Response) => {
  try {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.set('Access-Control-Allow-Origin', '*');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    // Verify Firebase ID token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { priceId, successUrl, cancelUrl } = req.body as CheckoutSessionData;

    if (!priceId || !successUrl || !cancelUrl) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // Get or create customer
    const customerSnapshot = await db
      .collection('customers')
      .where('userId', '==', uid)
      .limit(1)
      .get();

    let customer: string;
    if (!customerSnapshot.empty) {
      customer = customerSnapshot.docs[0].data().stripeCustomerId;
    } else {
      // Create a new customer
      const customerData = await stripe.customers.create({
        metadata: { userId: uid },
        email: decodedToken.email || undefined,
      });
      customer = customerData.id;

      // Save customer data
      await db.collection('customers').doc(uid).set({
        userId: uid,
        stripeCustomerId: customer,
        email: decodedToken.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: customer,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      metadata: {
        userId: uid,
        type: 'subscription',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Create a customer portal session
export const createStripePortal = functions.https.onRequest(async (req: Request, res: Response) => {
  try {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.set('Access-Control-Allow-Origin', '*');
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    // Verify Firebase ID token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    await admin.auth().verifyIdToken(idToken);

    const { customerId, returnUrl } = req.body as PortalSessionData;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    res.status(200).json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Handle Stripe webhooks
export const handleStripeWebhook = functions.https.onRequest(async (request: FirebaseRequest, response: Response) => {
  const sig = request.headers['stripe-signature'];

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET || !request.rawBody) {
    response.status(400).send('Webhook signature verification failed');
    return;
  }

  try {
    const event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
    }

    response.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    response.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Helper functions for webhook handlers
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { userId } = session.metadata || {};
  if (!userId || !session.subscription) return;

  const userRef = db.collection('users').doc(userId);
  const subscriptionRef = db.collection('subscriptions').doc(session.subscription as string);

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const priceId = subscription.items.data[0].price.id;

  // Update user document
  await userRef.update({
    isSubscribed: true,
    subscriptionId: session.subscription,
    customerId: session.customer as string,
    subscription: {
      status: subscription.status,
      priceId: priceId,
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  // Create subscription document
  await subscriptionRef.set({
    userId,
    status: subscription.status,
    priceId: priceId,
    customerId: session.customer,
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customerSnapshot = await db
    .collection('customers')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (customerSnapshot.empty) return;

  const userId = customerSnapshot.docs[0].id;
  const userRef = db.collection('users').doc(userId);
  const subscriptionRef = db.collection('subscriptions').doc(subscription.id);

  const priceId = subscription.items.data[0].price.id;
  const requestLimit = Object.values(SUBSCRIPTION_PLANS).find(
    plan => plan.priceId === priceId
  )?.requestLimit || SUBSCRIPTION_PLANS.FREE.requestLimit;

  // Update subscription document
  await subscriptionRef.set({
    userId,
    status: subscription.status,
    priceId: priceId,
    customerId: customerId,
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // Update user document
  await userRef.update({
    isSubscribed: subscription.status === 'active',
    remainingRequests: requestLimit,
    subscription: {
      status: subscription.status,
      priceId: priceId,
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customerSnapshot = await db
    .collection('customers')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (customerSnapshot.empty) return;

  const userId = customerSnapshot.docs[0].id;
  const userRef = db.collection('users').doc(userId);
  const subscriptionRef = db.collection('subscriptions').doc(subscription.id);

  // Update subscription document
  await subscriptionRef.update({
    status: 'canceled',
    canceledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update user document
  await userRef.update({
    isSubscribed: false,
    remainingRequests: SUBSCRIPTION_PLANS.FREE.requestLimit,
    subscription: {
      status: 'canceled',
      priceId: SUBSCRIPTION_PLANS.FREE.priceId,
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: true,
    },
  });
}