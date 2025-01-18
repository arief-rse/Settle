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

const Popup = () => {
  const [activeTab, setActiveTab] = useState<"analyze" | "history">("analyze");
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);

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

  const handleStartSelection = async () => {
    try {
      setIsSelecting(true);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      await chrome.tabs.sendMessage(tab.id, { type: "START_SELECTION" });
      window.close();
    } catch (error) {
      console.error('Error starting selection:', error);
      setIsSelecting(false);
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Card className="w-[400px] p-4 rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Rectangle Reader</h2>
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
            {!selectedText ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">Select Text to Analyze</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click the button below to start selecting text from the webpage
                </p>
                <Button
                  onClick={handleStartSelection}
                  className="w-full max-w-xs rounded-lg"
                  disabled={isSelecting}
                >
                  {isSelecting ? "Selecting..." : "Start Selection"}
                </Button>
              </div>
            ) : (
              <ResponsePanel
                extractedText={selectedText}
                onClose={() => setSelectedText(null)}
                onHistory={() => setActiveTab("history")}
              />
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
