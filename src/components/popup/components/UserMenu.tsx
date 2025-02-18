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
import { Progress } from "../../ui/progress";
import { toast } from 'sonner';
// These imports are used in this file:
// - signOut is used in handleSignOut() function
// - auth is used in handleSignOut() function
// - db and doc/onSnapshot aren't used in this file and can be removed
import { auth } from '../../../lib/firebase';
import { signOut } from 'firebase/auth';
import type { UserData } from '../../../lib/types';

const WEB_APP_URL = 'http://localhost:5173';

interface Selection {
  text: string;
  timestamp: string;
  source: 'text' | 'image' | 'both';
  imageData?: string;
}

interface UserMenuProps {
  userData: UserData | null;
  selections: Selection[];
}

export function UserMenu({ userData, selections }: UserMenuProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      await chrome.storage.local.remove(['user']);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    // Open pricing page in new tab
    chrome.tabs.create({ url: `${WEB_APP_URL}/pricing` });
    window.close();
  };

  const handleClearHistory = async () => {
    try {
      await chrome.storage.local.set({ selections: [] });
      toast.success('History cleared successfully');
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history');
    }
  };

  const handleExportHistory = () => {
    try {
      const exportData = {
        selections,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `settle-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('History exported successfully');
    } catch (error) {
      console.error('Error exporting history:', error);
      toast.error('Failed to export history');
    }
  };

  if (!userData) return null;

  const progressPercentage = userData.isSubscribed ? 100 : (userData.remainingRequests / 5) * 100;

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

        <DropdownMenuItem onClick={handleExportHistory}>
          Export History
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleClearHistory}>
          Clear History
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => chrome.tabs.create({ url: `${WEB_APP_URL}/dashboard` })}>
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
