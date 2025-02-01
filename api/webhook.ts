import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const updateUserSubscription = async (
  userId: string,
  subscriptionId: string,
  status: 'active' | 'cancelled' | 'past_due',
  currentPeriodEnd: number
) => {
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: subscriptionId,
    status: status,
    current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
  });

  // Reset request count if subscription is active
  if (status === 'active') {
    await supabase.from('request_counts').update({
      requests_remaining: 100,
      last_reset_at: new Date().toISOString()
    }).eq('user_id', userId);
  }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({ message: 'Webhook signature verification failed' });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (!userId) {
          console.error('No userId found in subscription metadata');
          return res.status(400).json({ message: 'No userId found in subscription metadata' });
        }

        await updateUserSubscription(
          userId,
          subscription.id,
          subscription.status as 'active' | 'cancelled' | 'past_due',
          subscription.current_period_end
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (!userId) {
          console.error('No userId found in subscription metadata');
          return res.status(400).json({ message: 'No userId found in subscription metadata' });
        }

        await updateUserSubscription(
          userId,
          subscription.id,
          'cancelled',
          subscription.current_period_end
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ message: 'Webhook handler failed' });
  }
} 