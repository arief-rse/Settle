import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Base URL for Firebase Functions
const FUNCTIONS_BASE_URL = 'https://us-central1-settle-75bb2.cloudfunctions.net';

// Function types
interface CreatePaymentIntentResponse {
  clientSecret: string;
}

interface CreateSubscriptionResponse {
  subscriptionId: string;
  clientSecret: string;
}

interface CreateCheckoutSessionResponse {
  sessionId: string;
}

/**
 * Creates a payment intent for a one-time payment
 * @param amount Amount in cents (e.g., 1000 for $10.00)
 * @param currency Currency code (default: 'usd')
 */
export async function createPayment(amount: number, currency: string = 'usd') {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/createPaymentIntent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, currency }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    const data = await response.json() as CreatePaymentIntentResponse;
    return data.clientSecret;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
}

/**
 * Creates a subscription with the specified price
 * @param customerId The Stripe Customer ID
 * @param priceId The Stripe Price ID for the subscription
 */
export async function createSubscription(customerId: string, priceId: string) {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/createSubscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId, priceId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create subscription');
    }

    const data = await response.json() as CreateSubscriptionResponse;
    return {
      subscriptionId: data.subscriptionId,
      clientSecret: data.clientSecret,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Creates a checkout session for one-time payment or subscription
 * @param priceId The Stripe Price ID
 * @param successUrl The URL to redirect to on successful payment
 * @param cancelUrl The URL to redirect to if payment is cancelled
 */
export async function createCheckoutSession(
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/createCheckoutSession`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId, successUrl, cancelUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const data = await response.json() as CreateCheckoutSessionResponse;
    return data.sessionId;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Initializes Stripe Elements
 * @returns A Promise that resolves to the Stripe instance
 */
export async function getStripe() {
  return await stripePromise;
}

/**
 * Creates a payment method using the card element
 * @param stripe Stripe instance
 * @param elements Stripe Elements instance
 * @returns The created payment method ID
 */
export async function createPaymentMethod(stripe: any, elements: any) {
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: elements.getElement('card'),
  });

  if (error) {
    console.error('Error creating payment method:', error);
    throw error;
  }

  return paymentMethod.id;
}

/**
 * Confirms a card payment using the client secret
 * @param stripe Stripe instance
 * @param clientSecret The client secret from the PaymentIntent
 * @param paymentMethod The payment method to use
 */
export async function confirmCardPayment(
  stripe: any,
  clientSecret: string,
  paymentMethod: any
) {
  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: paymentMethod,
  });

  if (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }

  return paymentIntent;
} 