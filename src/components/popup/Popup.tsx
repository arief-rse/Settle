import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Send, History } from "lucide-react";
import { ThemeProvider } from "../common/theme-provider";
import ResponsePanel from "./components/ResponsePanel";
import HistoryPanel from "./components/HistoryPanel";
import { UserMenu } from "./components/UserMenu";
import { ThemeToggle } from "./components/ThemeToggle";
import AuthPage from "./components/AuthPage";
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Toaster, toast } from 'sonner';
import { doc, updateDoc } from 'firebase/firestore';

const Popup = () => {
  const [activeTab, setActiveTab] = useState<"analyze" | "history">("analyze");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [textSource, setTextSource] = useState<'text' | 'image' | 'both'>('text');
  const [imageData, setImageData] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<null | any>(null);

  useEffect(() => {
    // Check for Stripe success/cancel URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const userId = user?.uid;

    if (success === 'true' && userId) {
      // Update user's subscription status
      const userRef = doc(db, 'users', userId);
      updateDoc(userRef, {
        isSubscribed: true,
      }).then(() => {
        toast.success('Successfully subscribed!');
        // Clear URL parameters
        window.history.replaceState({}, '', window.location.pathname);
      }).catch((error) => {
        console.error('Error updating subscription status:', error);
        toast.error('Error updating subscription status');
      });
    } else if (success === 'false') {
      toast.error('Subscription was cancelled');
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_SELECTED_TEXT' }, (response) => {
      if (response?.text) {
        setSelectedText(response.text);
        setTextSource(response.source || 'text');
        setImageData(response.imageData);
      }
    });

    const handleMessage = (message: any) => {
      if (message.type === 'TEXT_AVAILABLE') {
        setSelectedText(message.text);
        setTextSource(message.source || 'text');
        setImageData(message.imageData);
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
      alert('Please log in to start selection.');
      return;
    }

    try {
      setIsSelecting(true);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      // Check if we can access the page
      const url = tab.url || '';
      if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('https://chrome.google.com/webstore/')) {
        throw new Error('This page cannot be accessed by extensions for security reasons. Please try on a regular webpage.');
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      await chrome.tabs.sendMessage(tab.id, { type: "START_SELECTION" });
      window.close();
    } catch (error: any) {
      console.error('Error starting selection:', error);
      setIsSelecting(false);
      
      // Show a more user-friendly error message
      const errorMessage = error.message.includes('ExtensionsSettings policy') 
        ? 'This page cannot be accessed due to security settings. Please try on a regular webpage.'
        : error.message;
        
      setError(errorMessage);
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Toaster richColors position="top-center" />
      <Card className="w-[400px] h-[600px] p-4 rounded-xl">
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
              error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button onClick={() => setError(null)} variant="outline">Try Again</Button>
                </div>
              ) : selectedText ? (
                <ResponsePanel
                  extractedText={selectedText}
                  onClose={() => {
                    setSelectedText(null);
                    setImageData(undefined);
                  }}
                  onHistory={() => setActiveTab("history")}
                  source={textSource}
                  imageData={imageData}
                />
              ) : (
                <div className="text-center py-8">
                  <Button
                    onClick={handleStartSelection}
                    disabled={isSelecting}
                    className="w-full max-w-sm"
                  >
                    {isSelecting ? "Selecting..." : "Start Selection"}
                  </Button>
                </div>
              )
            ) : (
              <AuthPage />
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <HistoryPanel onClose={() => setActiveTab("analyze")} />
          </TabsContent>
        </Tabs>
      </Card>
    </ThemeProvider>
  );
};

export default Popup;
