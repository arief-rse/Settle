import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Send, History, Loader2 } from "lucide-react";
import { ThemeProvider } from "../common/theme-provider";
import ResponsePanel from "./components/ResponsePanel";
import HistoryPanel from "./components/HistoryPanel";
import { UserMenu } from "./components/UserMenu";
import { ThemeToggle } from "./components/ThemeToggle";
import { Toaster } from 'sonner';
import { auth, db, signInWithChromeGoogle } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import type { UserData } from '../../lib/types';

interface Selection {
  text: string;
  timestamp: string;
  source: 'text' | 'image' | 'both';
  imageData?: string;
  analysis?: {
    text: string;
    generatedImage?: string;
  };
  query?: string;
}

const WEB_APP_URL = 'http://localhost:5173';

const Popup = () => {
  const [activeTab, setActiveTab] = useState<"analyze" | "history">("analyze");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [textSource, setTextSource] = useState<'text' | 'image' | 'both'>('text');
  const [imageData, setImageData] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from Firestore
        const unsubscribeUser = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (doc) => {
            if (doc.exists()) {
              const userData = doc.data() as UserData;
              setUserData(userData);
              chrome.storage.local.set({ user: userData });
            }
          },
          (error) => {
            console.error('Error fetching user data:', error);
            setError('Failed to load user data');
          }
        );

        return () => unsubscribeUser();
      } else {
        setUserData(null);
        chrome.storage.local.remove(['user']);
      }
      setIsLoading(false);
    });

    // Load initial state from storage
    chrome.storage.local.get(['user', 'selections'], (result) => {
      if (result.user) setUserData(result.user);
      if (result.selections) setSelections(result.selections || []);
      setIsLoading(false);
    });

    // Listen for text selection changes
    const handleMessage = (message: any) => {
      if (message.type === 'TEXT_AVAILABLE') {
        setSelectedText(message.text);
        setTextSource(message.source || 'text');
        setImageData(message.imageData);
      }
    };

    // Set up listeners
    chrome.runtime.onMessage.addListener(handleMessage);

    // Get initial selected text
    chrome.runtime.sendMessage({ type: 'GET_SELECTED_TEXT' }, (response) => {
      if (response?.text) {
        setSelectedText(response.text);
        setTextSource(response.source || 'text');
        setImageData(response.imageData);
      }
    });

    // Cleanup
    return () => {
      unsubscribeAuth();
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleStartSelection = async () => {
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
    } catch (error: any) {
      console.error('Error starting selection:', error);
      setIsSelecting(false);
      setError(error.message);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithChromeGoogle();
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message);
      // If Chrome Identity API fails, fallback to web app sign in
      if (error.message.includes('OAuth2') || error.message.includes('auth token')) {
        chrome.tabs.create({ url: `${WEB_APP_URL}/signin` });
        window.close();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Toaster />
      <Card className="w-[400px] h-[600px] p-4 rounded-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <img src="/icon-48.png" alt="Logo" className="w-6 h-6" />
            <h1 className="text-lg font-semibold">Settle</h1>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            {userData ? (
              <UserMenu selections={selections} userData={userData} />
            ) : (
              <Button variant="outline" size="sm" onClick={handleSignIn}>
                Sign in
              </Button>
            )}
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "analyze" | "history")}>
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted rounded-lg">
            <TabsTrigger value="analyze" className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2 rounded-lg">
              <Send className="h-4 w-4" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-2 rounded-lg">
              <History className="h-4 w-4" />
              History ({selections.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="mt-0">
            {error ? (
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
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Smart Text Selection</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Select and analyze text from any webpage using our intelligent rectangle selection tool.
                  </p>
                  <Button
                    onClick={handleStartSelection}
                    disabled={isSelecting}
                    className="w-full max-w-sm"
                  >
                    {isSelecting ? "Selecting..." : "Start Selection"}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <HistoryPanel 
              selections={selections}
              onClose={() => setActiveTab("analyze")} 
            />
          </TabsContent>
        </Tabs>
      </Card>
    </ThemeProvider>
  );
};

export default Popup;
