import { useState } from 'react';
import { Button } from '../ui/button';
import { CreditCard } from 'lucide-react';
import { createSubscriptionCheckout } from '../../lib/stripe-client';
import { toast } from 'sonner';

interface SubscriptionButtonProps {
  userId: string;
  className?: string;
}

export function SubscriptionButton({ userId, className }: SubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgradeClick = async () => {
    setIsLoading(true);
    try {
      await createSubscriptionCheckout(userId);
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Failed to start subscription process');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleUpgradeClick}
      disabled={isLoading}
      className={className}
      variant="default"
    >
      <CreditCard className="mr-2 h-4 w-4" />
      <span>{isLoading ? 'Processing...' : 'Upgrade to Premium'}</span>
    </Button>
  );
} 