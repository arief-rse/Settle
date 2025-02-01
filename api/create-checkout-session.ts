import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { priceId, userId, customerEmail, existingCustomerId } = req.body;

    // Get or create customer
    let customerId = existingCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          userId: userId
        }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/subscription/cancel`,
      metadata: {
        userId: userId
      }
    });

    // Store customer ID in Supabase if new
    if (!existingCustomerId) {
      await supabase.from('subscriptions').insert({
        user_id: userId,
        stripe_customer_id: customerId,
        status: 'active'
      });
    }

    res.status(200).json({ id: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: error.message });
  }
} 