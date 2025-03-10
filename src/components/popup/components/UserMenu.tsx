import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Settings, LogOut, User } from "lucide-react";
import { useAuth } from "../../../../hooks/useAuth";
import { Button } from "../../ui/button";

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

  useEffect(() => {
    console.log("UserMenu rendered, auth state:", {
      user: auth.user,
      loading: auth.loading
    });
  }, [auth.user, auth.loading]);

  const handleLogout = async () => {
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
      <Button
        variant="ghost"
        className="h-8 w-8 p-0 rounded-full"
        onClick={() => {
          console.log("Avatar button clicked");
          setIsOpen(!isOpen);
        }}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={auth.user.photoURL || ""} alt={auth.user.name || "User"} />
          <AvatarFallback>{userInitials}</AvatarFallback>
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
            </div>

            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </button>

            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </button>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
      </DropdownMenu>
      );
}
