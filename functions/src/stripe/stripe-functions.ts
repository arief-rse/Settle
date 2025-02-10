import { onRequest } from 'firebase-functions/v2/https';
import { db, admin } from '../lib/firebase';
import { stripe, STRIPE_WEBHOOK_SECRET } from './stripe';
import express from 'express';
import cors from 'cors';
import type Stripe from 'stripe';

const app = express();
app.use(cors({ origin: true }));

interface CreatePaymentIntentData {
  amount: number;
  currency: string;
}

interface CreateSubscriptionData {
  priceId: string;
  customerId?: string;
}

interface CreateCheckoutSessionData {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

// Create a payment intent
export const createPaymentIntent = onRequest({
  cors: true,
  region: 'us-central1',
}, async (req, res) => {
  try {
    const { amount, currency } = req.body as CreatePaymentIntentData;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Error creating payment intent' });
  }
});

// Create a subscription
export const createSubscription = onRequest({
  cors: true,
  region: 'us-central1',
}, async (req, res) => {
  try {
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
    
    res.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Error creating subscription' });
  }
});

// Create a checkout session
export const createCheckoutSession = onRequest({
  cors: true,
  region: 'us-central1',
}, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body as CreateCheckoutSessionData;
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Error creating checkout session' });
  }
});

// Handle Stripe webhooks
export const handleStripeWebhook = onRequest({
  cors: true,
  region: 'us-central1',
}, async (request, response) => {
  const sig = request.headers['stripe-signature'];

  if (!sig || !STRIPE_WEBHOOK_SECRET || !request.rawBody) {
    response.status(400).send('Webhook signature verification failed');
    return;
  }

  try {
    const event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      STRIPE_WEBHOOK_SECRET
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