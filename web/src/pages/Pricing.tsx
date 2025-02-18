import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripe } from '@stripe/react-stripe-js';
import { useAuth } from '../lib/auth';
import { createCheckoutSession } from '../lib/stripe';
import { toast } from 'sonner';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  priceId: string;
  description: string;
  highlight?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0.00,
    priceId: import.meta.env.VITE_STRIPE_FREE_PRICE_ID,
    description: 'Perfect for trying out Settle and exploring its features.',
    features: [
      '5 AI analyses per month',
      'Basic text extraction',
      'Email support',
      'Chrome extension access',
      'Basic analytics'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 5.99,
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
    description: 'Everything you need for professional content analysis.',
    highlight: true,
    features: [
      '100 AI analyses per month',
      'Advanced text extraction',
      'Priority support',
      'Custom exports',
      'Advanced analytics',
      'API access',
      'Team collaboration',
      'Custom integrations'
    ]
  }
];

export default function Pricing() {
  const stripe = useStripe();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<{
    status: string;
    priceId: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'subscriptions', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setCurrentSubscription({
          status: data.status,
          priceId: data.priceId
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      navigate('/signin');
      return;
    }

    if (currentSubscription?.priceId === priceId && currentSubscription?.status === 'active') {
      toast.info('You are already subscribed to this plan');
      return;
    }

    setLoading(true);
    try {
      await createCheckoutSession(priceId, user.uid);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to initiate checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = (tier: PricingTier) => {
    if (loading) return 'Processing...';
    if (!user) return 'Sign in to subscribe';
    if (currentSubscription?.priceId === tier.priceId && currentSubscription?.status === 'active') {
      return 'Current plan';
    }
    if (tier.price === 0) return 'Get started for free';
    return `Subscribe for $${tier.price}/month`;
  };

  return (
    <div className="relative min-h-screen bg-gray-950">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
      </div>

      {/* Minimal grid pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="h-full w-full bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
      </div>

      {/* Content */}
      <div className="relative px-6 pt-32 pb-24 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center lg:max-w-4xl">
          <motion.h2 
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p 
            className="mt-4 text-lg leading-8 text-gray-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Start for free, no credit card required. Upgrade when you're ready.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <motion.div 
          className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-4xl lg:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative overflow-hidden rounded-lg border ${
                tier.highlight 
                  ? 'border-white/20 bg-white/5' 
                  : 'border-gray-800 bg-gray-900/50'
              } p-8`}
            >
              {tier.highlight && (
                <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">
                  {tier.name}
                </h3>
                {tier.highlight && (
                  <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
                    Popular
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm text-gray-400">
                {tier.description}
              </p>

              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-bold tracking-tight text-white">
                  ${tier.price}
                </span>
                <span className="ml-1 text-sm text-gray-400">/month</span>
              </div>

              <ul role="list" className="mt-8 space-y-3 text-sm text-gray-400">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="h-4 w-4 flex-shrink-0 text-white" />
                    <span className="ml-3">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(tier.priceId)}
                disabled={loading || (currentSubscription?.priceId === tier.priceId && currentSubscription?.status === 'active')}
                className={`mt-8 block w-full rounded-lg px-3 py-3 text-center text-sm font-medium ${
                  tier.highlight
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-white/10 text-white hover:bg-white/20'
                } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                {getButtonText(tier)}
              </button>

              {currentSubscription?.priceId === tier.priceId && currentSubscription?.status === 'active' && (
                <p className="mt-4 text-center text-sm text-gray-400">
                  Current plan
                </p>
              )}
            </div>
          ))}
        </motion.div>

        {/* FAQ Section */}
        <motion.div 
          className="mx-auto max-w-2xl mt-24 lg:max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-white">
            Frequently asked questions
          </h2>
          <dl className="mt-8 space-y-6 divide-y divide-gray-800">
            <div className="pt-6">
              <dt className="text-base font-medium text-white">
                How does the free trial work?
              </dt>
              <dd className="mt-2 text-base text-gray-400">
                You can start using Settle immediately with our free plan. No credit card required. You'll get 5 AI analyses per month and access to basic features.
              </dd>
            </div>
            <div className="pt-6">
              <dt className="text-base font-medium text-white">
                Can I change plans later?
              </dt>
              <dd className="mt-2 text-base text-gray-400">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.
              </dd>
            </div>
            <div className="pt-6">
              <dt className="text-base font-medium text-white">
                What payment methods do you accept?
              </dt>
              <dd className="mt-2 text-base text-gray-400">
                We accept all major credit cards through our secure payment processor, Stripe.
              </dd>
            </div>
          </dl>
        </motion.div>
      </div>
    </div>
  );
}