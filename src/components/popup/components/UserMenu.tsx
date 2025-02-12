import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Settings, LogOut, User, Crown, CreditCard, Loader2 } from "lucide-react";
import { auth } from '../../../lib/firebase';
import { signOut } from 'firebase/auth';
import type { UserData } from '../../../lib/firebase';
import { Progress } from "../../ui/progress";
import { createSubscriptionCheckout } from '../../../lib/stripe-client';
import { toast } from 'sonner';

interface UserMenuProps {
  userData: UserData | null;
}

export function UserMenu({ userData }: UserMenuProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Clear user data from storage
      chrome.storage.local.remove('userData');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleUpgradeClick = async () => {
    if (!userData) return;
    
    setIsLoading(true);
    try {
      await createSubscriptionCheckout(userData.uid);
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Failed to start subscription process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData) return null;

  const progressPercentage = (userData.remainingRequests / 5) * 100;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          {userData.photoURL ? (
            <AvatarImage src={userData.photoURL} alt={userData.displayName || 'User'} />
          ) : (
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {userData.displayName || userData.email || 'User'}
        </DropdownMenuLabel>
        
        {!userData.isSubscribed && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-2">
              <div className="text-sm mb-2 flex justify-between">
                <span>Remaining Requests</span>
                <span className="font-medium">{userData.remainingRequests}/5</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              {userData.remainingRequests === 0 && (
                <p className="text-xs text-destructive mt-1">
                  Subscribe to get unlimited requests
                </p>
              )}
            </div>
          </>
        )}

        <DropdownMenuSeparator />
        
        {userData.isSubscribed ? (
          <DropdownMenuItem>
            <Crown className="mr-2 h-4 w-4 text-yellow-500" />
            Premium Member
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            onClick={handleUpgradeClick}
            disabled={isLoading}
            className={`cursor-pointer ${isLoading ? 'opacity-50' : ''}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Upgrade to Premium
              </>
            )}
          </DropdownMenuItem>
        )}

        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
