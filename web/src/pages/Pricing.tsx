import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { createCheckoutSession } from '../lib/stripe';

const features = {
  free: [
    '5 requests per month',
    'Basic rectangle selection',
    'Standard support',
    'Access to core features'
  ],
  premium: [
    'Unlimited requests',
    'Advanced rectangle selection',
    'Priority support',
    'Early access to new features',
    'No watermarks',
    'Custom settings'
  ]
};

export default function Pricing() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    setLoading(true);
    try {
      await createCheckoutSession(
        import.meta.env.VITE_STRIPE_SUBSCRIPTION_PRICE_ID,
        user.uid
      );
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-center">
            Pricing Plans
          </h1>
          <p className="mt-5 text-xl text-gray-500 sm:text-center">
            Choose the perfect plan for your needs
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {/* Free Tier */}
          <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
            <div className="p-6">
              <h2 className="text-2xl font-medium leading-6 text-gray-900">Free</h2>
              <p className="mt-4 text-sm text-gray-500">
                Perfect for getting started and trying out our features.
              </p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                <span className="text-base font-medium text-gray-500">/month</span>
              </p>
              <button
                disabled
                className="mt-8 block w-full bg-gray-200 border border-gray-300 rounded-md py-2 text-sm font-semibold text-gray-700 text-center"
              >
                Current Plan
              </button>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                What's included
              </h3>
              <ul className="mt-6 space-y-4">
                {features.free.map((feature) => (
                  <li key={feature} className="flex space-x-3">
                    <svg
                      className="flex-shrink-0 h-5 w-5 text-green-500"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Premium Tier */}
          <div className="border border-indigo-200 rounded-lg shadow-sm divide-y divide-gray-200">
            <div className="p-6">
              <h2 className="text-2xl font-medium leading-6 text-gray-900">Premium</h2>
              <p className="mt-4 text-sm text-gray-500">
                For power users who need unlimited access and premium features.
              </p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">$9.99</span>
                <span className="text-base font-medium text-gray-500">/month</span>
              </p>
              <button
                onClick={handleSubscribe}
                disabled={loading || userData?.isSubscribed}
                className={`mt-8 block w-full rounded-md py-2 text-sm font-semibold text-center ${
                  userData?.isSubscribed
                    ? 'bg-green-50 text-green-700 border border-green-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                }`}
              >
                {userData?.isSubscribed
                  ? 'Current Plan'
                  : loading
                  ? 'Processing...'
                  : 'Upgrade to Premium'}
              </button>
            </div>
            <div className="pt-6 pb-8 px-6">
              <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                What's included
              </h3>
              <ul className="mt-6 space-y-4">
                {features.premium.map((feature) => (
                  <li key={feature} className="flex space-x-3">
                    <svg
                      className="flex-shrink-0 h-5 w-5 text-green-500"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 