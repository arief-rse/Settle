import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const PaymentPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await createCheckoutSession();
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Subscribe to Settle</h1>
          <p className="text-gray-600">Get more requests and unlock full features</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Monthly Plan</span>
              <span className="text-2xl font-bold">$5</span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                100 requests per month
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Priority support
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Cancel anytime
              </li>
            </ul>
          </div>
        </div>

        <Button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-6 text-lg"
        >
          {loading ? 'Processing...' : 'Subscribe Now'}
        </Button>

        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700 text-center w-full"
        >
          Go back
        </button>
      </Card>
    </div>
  );
};

export default PaymentPage; 