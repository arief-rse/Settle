import { useState } from 'react';
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import { ChevronLeft, Copy, Check, History, Send, Loader2 } from "lucide-react";
import { toast } from 'sonner';

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

interface ResponsePanelProps {
  extractedText: string;
  onClose: () => void;
  onHistory: () => void;
  source: 'text' | 'image' | 'both';
  imageData?: string;
}

interface User {
  uid: string;
  email: string | null;
  isSubscribed: boolean;
  remainingRequests: number;
}

export default function ResponsePanel({
  extractedText,
  onClose,
  onHistory,
  source,
  imageData
}: ResponsePanelProps) {
  const [copied, setCopied] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<{ text: string; generatedImage?: string; } | undefined>();
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = async (): Promise<User | null> => {
    try {
      // Try to get auth status from web app
      const response = await fetch('http://localhost:5173/api/auth/status', {
        credentials: 'include', // Important: include cookies
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get auth status');
      }

      const data = await response.json();
      if (!data.user) {
        throw new Error('Not authenticated');
      }

      return data.user;
    } catch (error) {
      console.error('Auth check failed:', error);
      return null;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      toast.success('Text copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying text:', error);
      toast.error('Failed to copy text');
    }
  };

  const handleAnalyze = async () => {
    if (!query.trim()) {
      setError('Please enter a question about the selected content');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Check auth status directly with web app
      const user = await checkAuthStatus();
      
      if (!user) {
        // Open the web app auth page in a new tab
        chrome.tabs.create({ url: 'http://localhost:5173/signin' });
        throw new Error('Please sign in to analyze content');
      }

      if (!user.isSubscribed && user.remainingRequests <= 0) {
        // Open the pricing page in a new tab
        chrome.tabs.create({ url: 'http://localhost:5173/pricing' });
        throw new Error('You have reached your request limit. Please upgrade to continue.');
      }

      // Send analysis request to web app
      const response = await fetch('http://localhost:5173/api/analyze', {
        method: 'POST',
        credentials: 'include', // Important: include cookies
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: extractedText,
          source,
          imageData,
          query: query.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze content');
      }

      const result = await response.json();
      setAnalysis(result);

      // Save to history with analysis
      const selection: Selection = {
        text: extractedText,
        timestamp: new Date().toISOString(),
        source,
        imageData,
        analysis: result,
        query: query.trim()
      };

      const { selections = [] } = await chrome.storage.local.get(['selections']);
      const updatedSelections = [selection, ...selections].slice(0, 50);
      await chrome.storage.local.set({ selections: updatedSelections });
      
      toast.success('Analysis completed and saved');
    } catch (error) {
      console.error('Error analyzing content:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze content');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    try {
      const selection: Selection = {
        text: extractedText,
        timestamp: new Date().toISOString(),
        source,
        imageData,
        analysis,
        query: query.trim()
      };

      const { selections = [] } = await chrome.storage.local.get(['selections']);
      const updatedSelections = [selection, ...selections].slice(0, 50);
      await chrome.storage.local.set({ selections: updatedSelections });
      
      toast.success('Selection saved to history');
      onHistory();
    } catch (error) {
      console.error('Error saving selection:', error);
      toast.error('Failed to save selection');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {imageData && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={imageData} 
                alt="Selected content"
                className="w-full h-auto"
              />
            </div>
          )}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{extractedText}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600">Ask a Question</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder="Ask anything about the selected content..."
                className="flex-1 px-4 py-2 border rounded-lg text-sm bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !query.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {analysis && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-gray-600">Analysis</h4>
                <Button variant="ghost" size="sm" onClick={onHistory}>
                  View History
                </Button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-white border rounded-lg text-sm text-gray-900 whitespace-pre-wrap shadow-sm">
                  {analysis.text}
                </div>
                {analysis.generatedImage && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-600">Generated Visualization</h4>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-gray-50">
                      <img 
                        src={analysis.generatedImage} 
                        alt="AI-generated visualization"
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}