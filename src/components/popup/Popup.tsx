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
import { Toaster } from 'sonner';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isSubscribed: boolean;
  remainingRequests: number;
  createdAt: number;
}

const Popup = () => {
  const [activeTab, setActiveTab] = useState<"analyze" | "history">("analyze");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [textSource, setTextSource] = useState<'text' | 'image' | 'both'>('text');
  const [imageData, setImageData] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Load user data from storage
  useEffect(() => {
    chrome.storage.local.get(['userData'], (result) => {
      setUserData(result.userData || null);
    });

    // Listen for changes to user data
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.userData) {
        setUserData(changes.userData.newValue);
      }
    });
  }, []);

  // Handle text selection
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
    if (!userData) {
      // Open the website's auth page in a new tab
      chrome.tabs.create({ url: 'https://settle.bangmil.io/signin?source=extension' });
      window.close();
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
      
      const errorMessage = error.message.includes('ExtensionsSettings policy') 
        ? 'This page cannot be accessed due to security settings. Please try on a regular webpage.'
        : error.message;
        
      setError(errorMessage);
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Toaster />
      <Card className="w-[400px] h-[600px] p-4 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Settle</h2>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu userData={userData} />
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
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => setError(null)} variant="outline">Try Again</Button>
              </div>
            ) : selectedText && userData ? (
              <ResponsePanel
                extractedText={selectedText}
                onClose={() => {
                  setSelectedText(null);
                  setImageData(undefined);
                }}
                onHistory={() => setActiveTab("history")}
                source={textSource}
                imageData={imageData}
                userData={userData}
              />
            ) : (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Smart Text Selection</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Select and analyze text from any webpage using our intelligent rectangle selection tool.
                  </p>
                  
                  {userData ? (
                    <Button
                      onClick={handleStartSelection}
                      disabled={isSelecting}
                      className="w-full max-w-sm"
                    >
                      {isSelecting ? "Selecting..." : "Start Selection"}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <Button
                        onClick={() => chrome.tabs.create({ url: 'https://settle.bangmil.io/signin?source=extension' })}
                        className="w-full max-w-sm bg-indigo-600 hover:bg-indigo-700"
                      >
                        Sign in to Start
                      </Button>
                      <p className="text-xs text-gray-500">
                        New to Settle? <a href="#" onClick={() => chrome.tabs.create({ url: 'https://settle.bangmil.io/signup?source=extension' })} className="text-indigo-600 hover:text-indigo-700">Create an account</a>
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 px-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-100 rounded-md">
                        <Send className="h-4 w-4 text-indigo-600" />
                      </div>
                      <h4 className="font-medium">Instant Analysis</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Get AI-powered insights from your selected text instantly.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-100 rounded-md">
                        <History className="h-4 w-4 text-indigo-600" />
                      </div>
                      <h4 className="font-medium">Save History</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Keep track of your analyses and access them anytime.
                    </p>
                  </div>
                </div>
              </div>
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
