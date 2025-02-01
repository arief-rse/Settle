import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

const PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID; // 100 requests for $5

export const createCheckoutSession = async () => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error('User must be logged in');
    }

    const { data: existingCustomer } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.data.user.id)
      .single();

    // Create Stripe Checkout session
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: PRICE_ID,
        userId: user.data.user.id,
        customerEmail: user.data.user.email,
        existingCustomerId: existingCustomer?.stripe_customer_id
      }),
    });

    const session = await response.json();
    
    // Redirect to Stripe Checkout
    const stripe = await stripePromise;
    const { error } = await stripe!.redirectToCheckout({
      sessionId: session.id,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const checkSubscriptionStatus = async () => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      return { isSubscribed: false, requestsRemaining: 0 };
    }

    const { data: requestCount } = await supabase
      .from('request_counts')
      .select('requests_remaining')
      .eq('user_id', user.data.user.id)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.data.user.id)
      .eq('status', 'active')
      .single();

    return {
      isSubscribed: !!subscription && new Date(subscription.current_period_end) > new Date(),
      requestsRemaining: requestCount?.requests_remaining || 0
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { isSubscribed: false, requestsRemaining: 0 };
  }
};

export const decrementRequestCount = async () => {
  try {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error('User must be logged in');
    }

    const { data, error } = await supabase.rpc('decrement_request_count', {
      user_id: user.data.user.id
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error decrementing request count:', error);
    throw error;
  }
}; 