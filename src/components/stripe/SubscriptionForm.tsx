import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import type { StripeElementsOptions } from '@stripe/stripe-js';
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

const CARD_ELEMENT_OPTIONS = {
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
};

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
      toast.error('Stripe has not been initialized');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error('Card element not found');
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

      // Get payment method
      const { error: cardError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (cardError) {
        throw cardError;
      }

      // Confirm the subscription payment
      const { error: confirmationError } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: paymentMethod.id,
        }
      );

      if (confirmationError) {
        throw confirmationError;
      }

      toast.success('Your subscription has been activated!');
      onSuccess?.();
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
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
  const stripePromise = getStripe();
  const [isStripeLoading, setIsStripeLoading] = useState(true);

  useEffect(() => {
    // Check if Stripe loaded successfully
    stripePromise.then(
      (stripe) => {
        if (!stripe) {
          toast.error('Failed to load Stripe. Please try again later.');
        }
        setIsStripeLoading(false);
      }
    ).catch((error) => {
      console.error('Error loading Stripe:', error);
      toast.error('Failed to load payment system. Please try again later.');
      setIsStripeLoading(false);
    });
  }, []);

  const options: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '4px',
      },
    },
  };

  if (isStripeLoading) {
    return <div className="text-center p-4">Loading payment system...</div>;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <SubscriptionFormContent {...props} />
    </Elements>
  );
}; 