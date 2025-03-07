import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Settings, LogOut, User, UserPlus } from "lucide-react";
import { useAuth } from "../../../../hooks/useAuth";
import { Button } from "../../ui/button";

// Define UserInfo type to match what's in useAuth
type UserInfo = {
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
      loading: auth.loading,
      activeAccounts: auth.activeAccounts
    });
  }, [auth.user, auth.loading, auth.activeAccounts]);

  const handleLogout = async () => {
    console.log("Logout clicked");
    try {
      await auth.signOut();
      console.log("Logout successful");
      setIsOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleAddAccount = async () => {
    console.log("Add account clicked");
    try {
      await auth.addAccount();
      console.log("Add account successful");
      setIsOpen(false);
    } catch (error) {
      console.error("Add account failed:", error);
    }
  };

  const handleSignIn = async () => {
    console.log("Sign in clicked");
    try {
      await auth.signIn();
      console.log("Sign in successful");
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
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col">
                <span className="font-medium">{auth.user.name}</span>
                <span className="text-xs text-gray-500">{auth.user.email}</span>
              </div>
            </div>

            {auth.activeAccounts.length > 1 && (
              <>
                <div className="px-4 py-1 text-xs text-gray-500">
                  Switch Account
                </div>
                {auth.activeAccounts.map((account: UserInfo) => (
                  account.email !== auth.user?.email && (
                    <button
                      key={account.email}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                      onClick={() => {
                        console.log("Switch account clicked", account.email);
                        auth.switchAccount(account.email || "");
                        setIsOpen(false);
                      }}
                    >
                      <Avatar className="h-5 w-5 mr-2">
                        <AvatarImage src={account.photoURL || ""} alt={account.name || "User"} />
                        <AvatarFallback>
                          {account.name
                            ? account.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
                            : account.email?.substring(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{account.email}</span>
                    </button>
                  )
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              </>
            )}

            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              onClick={handleAddAccount}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Add Account</span>
            </button>

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

            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

            <button
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
