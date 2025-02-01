import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { checkSubscriptionStatus } from '@/lib/stripe';

export const SubscriptionStatus: React.FC = () => {
  const [status, setStatus] = useState<{
    isSubscribed: boolean;
    requestsRemaining: number;
  }>({ isSubscribed: false, requestsRemaining: 0 });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const result = await checkSubscriptionStatus();
        setStatus(result);
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      }
    };

    fetchStatus();
  }, []);

  const handleSubscribe = () => {
    // Open payment page in a new tab
    chrome.tabs.create({ url: chrome.runtime.getURL('payment.html') });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Subscription Status</h3>
        <div className="text-sm text-gray-600">
          {status.isSubscribed ? (
            <span className="text-green-600">Active Subscription</span>
          ) : (
            <span>Free Trial</span>
          )}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          Requests Remaining: {status.requestsRemaining}
        </div>
      </div>

      {!status.isSubscribed && status.requestsRemaining <= 3 && (
        <div className="mb-4">
          <div className="text-sm text-amber-600">
            {status.requestsRemaining === 0
              ? "You've used all your free requests."
              : `Only ${status.requestsRemaining} requests remaining!`}
          </div>
          <Button
            onClick={handleSubscribe}
            className="w-full mt-2"
          >
            Subscribe - $5/month for 100 requests
          </Button>
        </div>
      )}
    </div>
  );
}; 