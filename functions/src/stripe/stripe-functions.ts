import { onRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import { db, admin } from '../lib/firebase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

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
export const createPaymentIntent = onRequest({
  cors: [/^chrome-extension:\/\/.*/],
  region: 'us-central1',
}, async (req, res) => {
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
export const createSubscription = onRequest({
  cors: [/^chrome-extension:\/\/.*/],
  region: 'us-central1',
}, async (req, res) => {
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
export const createCheckoutSession = onRequest({
  cors: [/^chrome-extension:\/\/.*/],
  maxInstances: 10,
}, async (req, res) => {
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

    // Validate origin
    const origin = req.headers.origin;
    if (!origin?.startsWith('chrome-extension://')) {
      res.status(403).json({ error: 'Invalid origin' });
      return;
    }

    const { priceId, successUrl, cancelUrl, metadata } = req.body as CheckoutSessionRequest;

    if (!priceId || !successUrl || !cancelUrl) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // Get or create customer
    let customer: string | undefined;
    if (metadata?.userId) {
      const customerSnapshot = await db
        .collection('customers')
        .where('userId', '==', metadata.userId)
        .limit(1)
        .get();

      if (!customerSnapshot.empty) {
        customer = customerSnapshot.docs[0].data().stripeCustomerId;
      } else {
        // Create a new customer
        const customerData = await stripe.customers.create({
          metadata: { userId: metadata.userId }
        });
        customer = customerData.id;

        // Save customer data
        await db.collection('customers').doc(metadata.userId).set({
          userId: metadata.userId,
          stripeCustomerId: customer,
          createdAt: Date.now()
        });
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: metadata?.type === 'subscription' ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: customer,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      metadata: metadata,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_creation: customer ? undefined : 'always',
    });

    // Set CORS headers explicitly
    res.set('Access-Control-Allow-Credentials', 'true');
    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Handle Stripe webhooks
export const handleStripeWebhook = onRequest({
  cors: true,
  region: 'us-central1',
}, async (request, response) => {
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
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
    }

    response.json({ received: true });
  } catch (error: unknown) {
    console.error('Webhook Error:', error);
    response.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Helper functions for webhook handlers
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { userId, type, creditRequests } = session.metadata || {};
  if (!userId) return;

  const userRef = db.collection('users').doc(userId);

  if (type === 'additional_request' && creditRequests) {
    // Add credits for additional request purchase
    await userRef.update({
      remainingRequests: admin.firestore.FieldValue.increment(parseInt(creditRequests, 10))
    });
  } else if (type === 'subscription') {
    // Update subscription status
    await userRef.update({
      isSubscribed: true,
      subscriptionId: session.subscription
    });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata.userId;
  if (!userId) return;

  await db.collection('payments').add({
    userId,
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customerSnapshot = await db
    .collection('customers')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (customerSnapshot.empty) return;

  const userId = customerSnapshot.docs[0].id;
  await db.collection('subscriptions').doc(subscription.id).set({
    userId,
    status: subscription.status,
    priceId: subscription.items.data[0].price.id,
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
      subscription.current_period_end * 1000
    ),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await db.collection('subscriptions').doc(subscription.id).update({
    status: subscription.status,
    canceledAt: admin.firestore.FieldValue.serverTimestamp(),
  });
} 