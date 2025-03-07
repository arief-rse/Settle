import { useEffect, useState } from "react";
import { useAuth } from "./useAuth.ts";
import SupabaseService from "../services/SupabaseService.ts";

type Subscription = {
  tier: "active" | "inactive";
  expiresAt: string | null;
};

/**
 * This hook is used to manage the user's subscription status.
 * It is used to check if the user is a developer and if they have a premium subscription.
 */
export function useFeatureFlags() {
  const { user } = useAuth();
  const supabaseService = new SupabaseService();
  const [isUpdating, setIsUpdating] = useState(false);
  const [subscription, setSubscription] = useState<Subscription>({
    tier: "active",
    expiresAt: null,
  });

  // Checks if the user is logged in and if they have a subscription
  useEffect(() => {
    if (!user) return;
    supabaseService.checkSubscriptionStatus(user?.email).then((subscription) => {
      setSubscription({
        tier: subscription ? "active" : "inactive",
        expiresAt: null,
      });
    });
  }, [user]);

  return {
    isPremium: subscription.tier === "active",
    subscription,
    isUpdating,
  };
}
