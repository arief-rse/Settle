import React, { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createSubscription, getStripe } from '../../lib/stripe-client';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { auth } from '../../lib/firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

interface SubscriptionFormProps {
  priceId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const SubscriptionFormContent: React.FC<SubscriptionFormProps> = ({
  priceId,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      // Get the current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the customer ID from Firestore
      const db = getFirestore();
      const customerSnapshot = await getDoc(doc(db, 'customers', user.uid));
      const customerId = customerSnapshot.data()?.stripeCustomerId;

      if (!customerId) {
        throw new Error('Customer ID not found');
      }

      // Create the subscription
      const { clientSecret } = await createSubscription(
        customerId,
        priceId
      );

      // Confirm the subscription payment
      const { error: confirmationError } = await stripe.confirmCardPayment(clientSecret);

      if (confirmationError) {
        throw confirmationError;
      }

      toast.success('Your subscription has been activated!');
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      <Button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full"
      >
        {isLoading ? 'Processing...' : 'Subscribe'}
      </Button>
    </form>
  );
};

export const SubscriptionForm: React.FC<SubscriptionFormProps> = (props) => {
  const [stripePromise] = useState(() => getStripe());

  return (
    <Elements stripe={stripePromise}>
      <SubscriptionFormContent {...props} />
    </Elements>
  );
}; 