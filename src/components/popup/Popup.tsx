import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Send, History } from "lucide-react";
import { ThemeProvider } from "../common/theme-provider";
import ResponsePanel from "./components/ResponsePanel";
import HistoryPanel from "./components/HistoryPanel";
import { UserMenu } from "./components/UserMenu";
import { ThemeToggle } from "./components/ThemeToggle";
import AuthPage from "./components/AuthPage";
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from "firebase/firestore";

const Popup = () => {
  const [activeTab, setActiveTab] = useState<"analyze" | "history">("analyze");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<null | any>(null);
  const [remainingRequests, setRemainingRequests] = useState<number>(5);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  useEffect(() => {
    const db = getFirestore();
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          await setDoc(userRef, { remainingRequests: 5, isSubscribed: false });
        }
        const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setRemainingRequests(data.remainingRequests ?? 5);
            setIsSubscribed(data.isSubscribed || false);
          }
        });
        return unsubscribeSnapshot;
      } else {
        setUser(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_SELECTED_TEXT' }, (response) => {
      if (response?.text) {
        setSelectedText(response.text);
      }
    });

    const handleMessage = (message: any) => {
      if (message.type === 'TEXT_AVAILABLE') {
        setSelectedText(message.text);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'TEXT_SELECTED') {
        setSelectedText(message.text);
        setIsSelecting(false);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const handleStartSelection = async () => {
    if (!user) {
      alert('Please sign in to start selection.');
      return;
    }
    if (remainingRequests <= 0 && !isSubscribed) {
      alert('You have used your free requests. Please subscribe to continue.');
      return;
    }
    try {
      setIsSelecting(true);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        throw new Error('No active tab found');
      }
      
      const url = tab.url || '';

      if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('https://chrome.google.com/webstore/')) {
        throw new Error('This page cannot be accessed by extensions for security reasons. Please try on a regular webpage.');
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      await chrome.tabs.sendMessage(tab.id, { type: "START_SELECTION" });

    } catch (error: any) {
      console.error('Error starting selection:', error);
      setIsSelecting(false);

      const errorMessage = error.message.includes('ExtensionsSettings policy')
        ? 'This page cannot be accessed due to security settings. Please try on a regular webpage.'
        : error.message;
      setError(errorMessage);

    }
  };

  const handleSubscribe = async () => {
    const db = getFirestore();
    try {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { 
          isSubscribed: true,
          remainingRequests: 100
        }, { merge: true });
        setIsSubscribed(true);
        setRemainingRequests(100);
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      alert("Failed to update subscription. Please try again.");
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Card className="w-[400px] p-4 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Settle</h2>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "analyze" | "history")}>
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted rounded-lg">
            <TabsTrigger
              value="analyze"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2 rounded-lg"
            >
              <Send className="h-4 w-4" />
              Analyze
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2 rounded-lg"
            >
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="mt-0">
            {user ? (
              remainingRequests > 0 || isSubscribed ? (
                error ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={() => setError(null)} variant="outline">Try Again</Button>
                  </div>
                ) : selectedText ? (
                  <ResponsePanel
                    extractedText={selectedText}
                    onClose={() => setSelectedText(null)}
                    onHistory={() => setActiveTab("history")}
                    onAnalyzed={async () => {
                      if (!isSubscribed) {
                        const db = getFirestore();
                        const userRef = doc(db, "users", user.uid);
                        await updateDoc(userRef, {
                          remainingRequests: increment(-1)
                        });
                      }
                    }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Button
                      onClick={handleStartSelection}
                      disabled={isSelecting}
                      className="w-full max-w-sm"
                    >
                      {isSelecting ? "Selecting..." : "Start Selection"}
                      <div className="text-sm mt-1">Remaining requests: {remainingRequests}</div>
                    </Button>
                  </div>
                )
              ) : (
                <div className="text-center p-6">
                  <p className="mb-4 text-gray-900 dark:text-white">
                    You have used up your free requests. Please subscribe to continue using our analysis service.
                  </p>
                  <Button onClick={handleSubscribe} variant="outline">
                    Subscribe
                  </Button>
                </div>
              )
            ) : (
              <div className="text-center p-6">
                <p className="mb-4 text-gray-900 dark:text-white">Please sign in to access Analyze.</p>
                <AuthPage />
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            {user ? (
              <HistoryPanel onClose={() => setActiveTab("analyze")} />
            ) : (
              <div className="text-center p-6">
                <p className="mb-4 text-gray-900 dark:text-white">Please sign in to access History.</p>
                <AuthPage />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </ThemeProvider>
  );
};

export default Popup;
