import { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { User, Settings, LogOut, LogIn } from "lucide-react";
import { supabase, signInWithGoogle, signOut, getCurrentUser } from "../../../lib/supabase";
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { toast } from "sonner";

export function UserMenu() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    // Listen for auth state changes from the external auth page
    const handleAuthMessage = (message: any) => {
      if (message.type === 'AUTH_STATE_CHANGED') {
        checkUser();
      }
    };
    chrome.runtime.onMessage.addListener(handleAuthMessage);

    return () => {
      authListener?.subscription.unsubscribe();
      chrome.runtime.onMessage.removeListener(handleAuthMessage);
    };
  }, []);

  const checkUser = async () => {
    try {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in with Google');
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const openAuthPage = () => {
    chrome.runtime.sendMessage({ type: 'OPEN_AUTH' });
  };

  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <User className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {user ? (
          <>
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user.email}</span>
                <span className="text-xs text-muted-foreground">
                  {user.app_metadata.provider === 'google' ? 'Signed in with Google' : 'Signed in with Email'}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.open(chrome.runtime.getURL('options.html'), '_blank')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel>Sign in to use Text Analyzer</DropdownMenuLabel>
            <DropdownMenuItem onClick={openAuthPage}>
              <LogIn className="mr-2 h-4 w-4" />
              <span>Sign in</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignInWithGoogle}>
              <LogIn className="mr-2 h-4 w-4" />
              <span>Sign in with Google</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
