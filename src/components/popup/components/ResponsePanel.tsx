import { useState, useEffect } from "react";
import { X, MessageCircle, Copy, History, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { processExtractedText } from "../../../lib/ai-processor";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../../../hooks/useAuth";
import { saveAnalysisHistory, getUserRequestCount } from "../../../lib/supabase";

interface ResponsePanelProps {
  extractedText: string;
  onClose: () => void;
  onHistory: () => void;
  onNewSelection: () => void;
}

const ResponsePanel = ({ extractedText, onClose, onHistory, onNewSelection }: ResponsePanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [requestsRemaining, setRequestsRemaining] = useState<number | null>(null);
  const auth = useAuth();

  useEffect(() => {
    // Check remaining requests when component mounts
    const checkRemainingRequests = async () => {
      if (auth.user?.email) {
        try {
          const requestCount = await getUserRequestCount(auth.user.email);
          if (requestCount) {
            setRequestsRemaining(requestCount.requests_remaining);
          }
        } catch (error) {
          console.error('Error fetching remaining requests:', error);
        }
      }
    };
    
    checkRemainingRequests();
  }, [auth.user]);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Process the extracted text using the AI processor
      const result = await processExtractedText(extractedText);
      setResponse(result);

      // Get the current URL if available
      let currentUrl = '';
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        currentUrl = tab?.url || '';
      } catch (error) {
        console.warn('Could not get current URL:', error);
      }

      // Save to local storage for offline access
      const history = JSON.parse(localStorage.getItem("analysisHistory") || "[]");
      const historyItem = {
        text: extractedText,
        response: result,
        timestamp: new Date().toISOString(),
        url: currentUrl
      };
      
      history.unshift(historyItem);
      localStorage.setItem("analysisHistory", JSON.stringify(history.slice(0, 50))); // Keep last 50 items
      
      // Save to Supabase if user is authenticated
      if (auth.user?.email) {
        try {
          await saveAnalysisHistory(
            auth.user.email,
            extractedText,
            result,
            currentUrl
          );
          console.log('Analysis saved to database');
          
          // Update remaining requests count
          const requestCount = await getUserRequestCount(auth.user.email);
          if (requestCount) {
            setRequestsRemaining(requestCount.requests_remaining);
          }
        } catch (dbError) {
          console.error('Failed to save analysis to database:', dbError);
          // Continue execution even if database save fails
          // The analysis is already saved to localStorage
        }
      } else {
        console.log('User not authenticated, analysis saved only to localStorage');
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze text");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    setResponse(null);
    handleAnalyze();
  };

  // Only auto-analyze if the flag is set
  useEffect(() => {
    if (autoAnalyze && !response && !isLoading && !error) {
      handleAnalyze();
    }
  }, [autoAnalyze]);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-8 right-8 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-all duration-200 z-[2147483647]"
      >
        <MessageCircle className="w-6 h-6 text-indigo-600" />
      </button>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-gray-500" />
          <h3 className="text-lg font-semibold">Text Analysis</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onHistory}
            title="View History"
            className="text-gray-400 hover:text-gray-600"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            title="Minimize"
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            title="Close"
            className="text-gray-400 hover:text-red-500 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-600">Selected Text</h4>
          <div className="max-h-[150px] overflow-y-auto p-4 bg-white border rounded-lg text-sm text-gray-700 shadow-inner">
            {extractedText}
          </div>
        </div>

        {!response && !isLoading && (
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleAnalyze}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5"
            >
              Analyze Text
            </Button>
            <Button
              onClick={onNewSelection}
              variant="outline"
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Select New Text
            </Button>
            {requestsRemaining !== null && (
              <div className="requests-remaining">
                <p>You have <strong>{requestsRemaining}</strong> free requests remaining</p>
                {requestsRemaining === 0 && (
                  <p className="subscribe-message">Subscribe for unlimited access!</p>
                )}
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm text-gray-500">Analyzing your text...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
            {error}
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleAnalyze}
                variant="outline"
                size="sm"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              >
                Try Again
              </Button>
              <Button
                onClick={onNewSelection}
                variant="outline"
                size="sm"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Select New Text
              </Button>
            </div>
          </div>
        )}

        {response && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-600">Analysis</h4>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className={copied ? "text-green-600" : "text-gray-500 hover:text-gray-700"}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
            <div className="p-4 bg-white border rounded-lg text-sm whitespace-pre-wrap">
              {response}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onNewSelection}
                className="text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                New Selection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ResponsePanel;