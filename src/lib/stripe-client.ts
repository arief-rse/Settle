import type { Stripe as StripeType, StripeConstructorOptions, StripeElements } from '@stripe/stripe-js';
import { STRIPE_CONFIG, APP_CONFIG } from './config';

declare global {
  interface Window {
    Stripe?: (key: string, options?: StripeConstructorOptions) => StripeType;
  }
}

// Initialize Stripe using the global object
const stripePromise = new Promise<StripeType | null>((resolve) => {
  // Wait for DOM content to be loaded to ensure Stripe.js is available
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStripe);
  } else {
    initStripe();
  }

  function initStripe() {
    // Add a small delay to ensure Stripe.js is fully loaded
    setTimeout(() => {
      if (window.Stripe) {
        console.log('Initializing Stripe with key:', STRIPE_CONFIG.PUBLISHABLE_KEY);
        const stripe = window.Stripe(STRIPE_CONFIG.PUBLISHABLE_KEY, {
          apiVersion: '2023-10-16',
          locale: 'auto'
        });
        resolve(stripe);
      } else {
        console.error('Stripe.js not loaded after waiting');
        resolve(null);
      }
    }, 500);
  }
});

interface PaymentStatus {
  status: 'success' | 'cancelled';
  message: string;
}

/**
 * Creates a payment intent for a one-time payment
 * @param amount Amount in cents (e.g., 1000 for $10.00)
 * @param currency Currency code (default: 'usd')
 */
export async function createPayment(amount: number, currency: string = 'usd') {
  try {
    const response = await fetch(`${STRIPE_CONFIG.FUNCTIONS_BASE_URL}/createPaymentIntent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': chrome.runtime.getURL(''),
        'Accept': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify({ amount, currency }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Payment intent creation failed:', response.status, errorData);
      throw new Error(errorData.message || 'Failed to create payment intent');
    }

    const { clientSecret } = await response.json();
    return clientSecret;
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
    const response = await fetch(`${STRIPE_CONFIG.FUNCTIONS_BASE_URL}/createSubscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': chrome.runtime.getURL(''),
        'Accept': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify({ customerId, priceId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Subscription creation failed:', response.status, errorData);
      throw new Error(errorData.message || 'Failed to create subscription');
    }

    const data = await response.json() as { subscriptionId: string; clientSecret: string };
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
    const response = await fetch(`${STRIPE_CONFIG.FUNCTIONS_BASE_URL}/createCheckoutSession`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': chrome.runtime.getURL(''),
        'Accept': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify({ priceId, successUrl, cancelUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Checkout session creation failed:', response.status, errorData);
      throw new Error(errorData.message || 'Failed to create checkout session');
    }

    const data = await response.json() as { sessionId: string };
    return data.sessionId;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Creates a subscription checkout session
 * @param userId The user's ID for metadata
 */
export async function createSubscriptionCheckout(userId: string) {
  console.log('Creating subscription checkout for user:', userId);
  try {
    // Log the request payload for debugging
    const payload = {
      mode: 'subscription',
      price: STRIPE_CONFIG.PRICES.SUBSCRIPTION,
      success_url: APP_CONFIG.SUCCESS_URL,
      cancel_url: APP_CONFIG.CANCEL_URL,
      metadata: {
        firebase_extension: 'firestore-stripe-payments',
        userId: userId
      }
    };
    console.log('Request payload:', payload);

    const response = await fetch(STRIPE_CONFIG.FUNCTIONS_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);
    const responseData = await response.text();
    console.log('Response data:', responseData);

    if (!response.ok) {
      throw new Error(`Failed to create checkout session: ${response.status} ${responseData}`);
    }

    let sessionData;
    try {
      sessionData = JSON.parse(responseData);
    } catch (e) {
      throw new Error('Invalid response format from server');
    }

    console.log('Session data:', sessionData);
    
    if (sessionData.url) {
      return sessionData.url;
    }

    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const result = await stripe.redirectToCheckout({ sessionId: sessionData.sessionId });
    if (result.error) {
      throw new Error(result.error.message);
    }

    return '';
  } catch (error) {
    console.error('Error creating subscription checkout:', error);
    throw error;
  }
}

/**
 * Creates a one-time payment checkout session
 * @param userId The user's ID for metadata
 * @param creditRequests Number of credit requests to purchase
 */
export async function createOneTimeCheckout(userId: string, creditRequests: number) {
  try {
    const response = await fetch(`${STRIPE_CONFIG.FUNCTIONS_BASE_URL}/createCheckoutSession`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': chrome.runtime.getURL(''),
        'Accept': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify({
        priceId: STRIPE_CONFIG.PRICES.ONE_TIME,
        successUrl: APP_CONFIG.SUCCESS_URL,
        cancelUrl: APP_CONFIG.CANCEL_URL,
        metadata: {
          userId,
          type: 'additional_request',
          creditRequests: creditRequests.toString()
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Checkout session creation failed:', response.status, errorData);
      throw new Error(errorData.message || 'Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    const stripe = await getStripe();
    
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error creating one-time checkout:', error);
    throw error;
  }
}

/**
 * Initializes Stripe
 * @returns A Promise that resolves to the Stripe instance
 */
export async function getStripe(): Promise<StripeType | null> {
  try {
    const stripe = await stripePromise;
    if (!stripe) {
      console.error('Failed to initialize Stripe');
    }
    return stripe;
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    return null;
  }
}

/**
 * Creates a payment method using the card element
 * @param stripe Stripe instance
 * @param elements Stripe Elements instance
 * @returns The created payment method ID
 */
export async function createPaymentMethod(stripe: StripeType, elements: StripeElements) {
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: elements.getElement('card')!,
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
  stripe: StripeType,
  clientSecret: string,
  paymentMethod: string
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

/**
 * Handles the payment status from URL parameters
 * @returns Payment status information
 */
export function handlePaymentStatus(): PaymentStatus | null {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');

  if (paymentStatus === 'success') {
    return {
      status: 'success',
      message: 'Payment successful! Your account has been updated.',
    };
  } else if (paymentStatus === 'cancelled') {
    return {
      status: 'cancelled',
      message: 'Payment was cancelled.',
    };
  }

  return null;
} 