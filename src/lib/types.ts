export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isSubscribed: boolean;
  remainingRequests: number;
  createdAt: number;
  subscription?: {
    status: 'active' | 'inactive' | 'past_due' | 'canceled';
    priceId: string;
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
  };
} 