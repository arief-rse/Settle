import { useState, useEffect } from 'react'
import { Send, History } from 'lucide-react'
import { ThemeProvider } from '../common/theme-provider'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { UserMenu } from './components/UserMenu'
import { ThemeToggle } from './components/ThemeToggle'
import ResponsePanel from './components/ResponsePanel'
import HistoryPanel from './components/HistoryPanel'
import { SubscriptionStatus } from './components/SubscriptionStatus'
import { supabase } from '../../lib/supabase'
import { getCurrentUser } from '../../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { toast } from 'sonner'

const Popup = () => {
  const [activeTab, setActiveTab] = useState<"analyze" | "history">("analyze");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check auth status
    const checkUser = async () => {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);
    };
    checkUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_SELECTED_TEXT' }, (response) => {
      if (response?.text) {
        setSelectedText(response.text);
      }
    });

    const handleMessage = (message: { type: string; text?: string }) => {
      if (message.type === 'TEXT_AVAILABLE' && message.text) {
        setSelectedText(message.text);
        setIsSelecting(false);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const injectContentScript = async (tabId: number) => {
    try {
      // Check if content script is already injected
      const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' }).catch(() => false);
      if (response === true) {
        return; // Content script is already injected
      }
    } catch {
      // Content script is not injected, proceed with injection
    }

    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });

    // Inject CSS
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content.css']
    });

    // Wait for content script to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  const handleStartSelection = async () => {
    if (!user) {
      setError('Please sign in to use the text analyzer');
      return;
    }

    try {
      setIsSelecting(true);
      setError(null);

      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab found');

      // Check if we can access the page
      const url = tab.url || '';
      if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('https://chrome.google.com/webstore/')) {
        throw new Error('This page cannot be accessed by extensions for security reasons. Please try on a regular webpage.');
      }

      // Inject content script if needed
      await injectContentScript(tab.id);

      // Start selection
      await chrome.tabs.sendMessage(tab.id, { type: 'START_SELECTION' });
      window.close(); // Close popup to show the selection overlay
    } catch (err) {
      console.error('Selection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start selection');
      setIsSelecting(false);
      toast.error('Failed to start selection. Please refresh the page and try again.');
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="w-[400px] h-[600px] p-4">
        <Card className="w-full h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold">Settle</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "analyze" | "history")}>
            <TabsList className="w-full justify-start px-4 pt-2">
              <TabsTrigger value="analyze" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Analyze
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analyze" className="p-4 space-y-4">
              {user && <SubscriptionStatus />}
              
              <Button
                className="w-full"
                onClick={handleStartSelection}
                disabled={isSelecting || !user}
              >
                {isSelecting ? 'Selecting...' : 'Select Text'}
              </Button>

              {error && (
                <div className="text-sm text-red-500 mt-2">
                  {error}
                </div>
              )}

              {!user && (
                <div className="text-sm text-muted-foreground text-center">
                  Please sign in to use the text analyzer
                </div>
              )}

              {selectedText && user && (
                <ResponsePanel
                  extractedText={selectedText}
                  onClose={() => setSelectedText(null)}
                  onHistory={() => setActiveTab("history")}
                />
              )}
            </TabsContent>

            <TabsContent value="history" className="p-4">
              <HistoryPanel onClose={() => setActiveTab("analyze")} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </ThemeProvider>
  );
};

export default Popup;
