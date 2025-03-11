import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Settings, LogOut, User } from "lucide-react";
import { useAuth } from "../../../../hooks/useAuth";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../../ui/dropdown-menu";
import { getUserRequestCount } from "../../../lib/supabase";

// Define UserInfo type to match what's in useAuth
type User = {
  credential: string;
  name?: string;
  email?: string;
  photoURL?: string;
};

export function UserMenu() {
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  const [requestLimit] = useState<number>(5); // Default limit

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch request count when user is authenticated
  useEffect(() => {
    const fetchRequestCount = async () => {
      if (auth.user?.credential) {
        try {
          // Extract user ID from credential (this might need adjustment based on your auth implementation)
          const userId = auth.user.email || '';
          
          if (!userId) {
            console.error('No user ID available to fetch request count');
            return;
          }
          
          const requestData = await getUserRequestCount(userId);
          
          if (requestData) {
            setRemainingRequests(requestData.requests_remaining);
            // You could also set the request limit from the database if available
          } else {
            // Set default values if no data is available
            setRemainingRequests(5);
          }
        } catch (error) {
          console.error('Error fetching request count:', error);
          setRemainingRequests(5); // Fallback to default
        }
      }
    };

    fetchRequestCount();
  }, [auth.user]);

  useEffect(() => {
    console.log("UserMenu rendered, auth state:", {
      user: auth.user,
      loading: auth.loading,
      remainingRequests
    });
  }, [auth.user, auth.loading, remainingRequests]);

  const handleSignOut = async () => {
    console.log("Logout clicked");
    try {
      await auth.signOut();
      console.log("Logout successful - user logged out from Google Identity");
      setIsOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  const handleSignIn = async () => {
    console.log("Sign in clicked");
    try {
      // Get the selected text before signing in
      chrome.runtime.sendMessage({ type: 'GET_SELECTED_TEXT' }, async (response) => {
        const selectedTextBeforeSignIn = response?.text;
        console.log("Selected text before sign in:", selectedTextBeforeSignIn);

        // Sign in
        await auth.signIn();
        console.log("Sign in successful, auth state:", { user: auth.user });

        // If there was selected text, make sure it's still available after sign in
        if (selectedTextBeforeSignIn) {
          console.log("Re-broadcasting selected text after sign in");
          chrome.runtime.sendMessage({
            type: 'TEXT_SELECTED',
            text: selectedTextBeforeSignIn,
            timestamp: new Date().toISOString()
          });
        }
      });
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  // If not logged in, show sign-in button
  if (!auth.user) {
    console.log("No user logged in, showing sign-in button");
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignIn}
        className="h-8 w-8 p-0"
      >
        <User className="h-4 w-4" />
      </Button>
    );
  }

  const userInitials = auth.user.name
    ? auth.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : auth.user.email?.substring(0, 2).toUpperCase() || "U";

  return (
    <div className="relative" ref={dropdownRef}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 rounded-full"
            onClick={(e) => {
              e.preventDefault(); // Prevent default to avoid conflicts with Radix UI
              console.log("Avatar button clicked");
              // Let Radix UI handle the state
            }}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={auth.user.photoURL || ""} alt={auth.user.name || "User"} />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            {auth.user.name || auth.user.email || 'User'}
          </DropdownMenuLabel>

          <DropdownMenuSeparator />
          <div className="px-2 py-2">
            <div className="text-sm mb-2 flex justify-between">
              <span>Remaining Requests</span>
              <span className="font-medium">{remainingRequests !== null ? remainingRequests : '...'}/{requestLimit}</span>
            </div>
          </div>

          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
