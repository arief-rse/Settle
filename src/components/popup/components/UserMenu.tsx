import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Settings, LogOut, User, Crown, CreditCard } from "lucide-react";
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserData } from '../../../lib/firebase';
import { Progress } from "../../ui/progress";
import { createSubscriptionCheckout } from '../../../lib/stripe-client';
import { toast } from 'sonner';

export function UserMenu() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            // Create new user document if it doesn't exist
            const initialUserData: UserData = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              remainingRequests: 5,
              isSubscribed: false,
              createdAt: Date.now()
            };
            await setDoc(userRef, initialUserData);
            setUserData(initialUserData);
          } else {
            setUserData(userDoc.data() as UserData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
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
            className="cursor-pointer"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {isLoading ? 'Processing...' : 'Upgrade to Premium'}
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
