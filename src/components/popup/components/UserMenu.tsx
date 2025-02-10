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
import { Settings, LogOut, User, Crown } from "lucide-react";
import { auth, db, UserData } from '../../../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

export function UserMenu() {
  const [user, setUser] = useState<null | any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        // Check if user document exists, if not create it with initial data
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          const initialUserData: UserData = {
            remainingRequests: 5,
            isSubscribed: false,
            createdAt: Date.now()
          };
          await setDoc(userDocRef, initialUserData);
        }

        // Set up real-time listener
        const unsubscribeDoc = onSnapshot(userDocRef, (doc) => {
          const data = doc.data() as UserData;
          setUserData(data);
        }, (error) => {
          console.error('Error fetching user data:', error);
        });

        return () => unsubscribeDoc();
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80">
          {user && user.photoURL ? (
            <AvatarImage src={user.photoURL} alt={user.email} />
          ) : (
            <AvatarFallback>{user && user.email ? user.email.charAt(0).toUpperCase() : 'UN'}</AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {user ? (
          <>
            <DropdownMenuLabel className="flex items-center justify-between">
              {user.email}
              {userData?.isSubscribed && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
            </DropdownMenuLabel>
            {userData && (
              <>
                <DropdownMenuLabel className="text-sm text-gray-500 flex items-center justify-between">
                  {userData.isSubscribed ? (
                    <span className="text-green-500">Premium User</span>
                  ) : (
                    <>
                      Remaining requests: {userData.remainingRequests}
                      {userData.remainingRequests === 0 && (
                        <span className="text-xs text-red-500 ml-2">Subscribe to continue</span>
                      )}
                    </>
                  )}
                </DropdownMenuLabel>
                {!userData.isSubscribed && (
                  <div className="px-2 py-1">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${Math.min((userData.remainingRequests / 5) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuLabel>Not logged in</DropdownMenuLabel>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
