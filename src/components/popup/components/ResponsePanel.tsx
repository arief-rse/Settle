import { useState, useEffect } from "react";
import { X, MessageCircle, Lock } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { processExtractedText } from "../../../lib/ai-processor";
import { saveAnalysisHistory, getAnalysisHistory, isAuthenticated } from "../../../lib/supabase";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ResponsePanelProps {
  extractedText: string;
  onClose: () => void;
  onHistory: () => void;
}

const ResponsePanel = ({ extractedText, onClose, onHistory }: ResponsePanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);

  useEffect(() => {
    const checkAuthentication = async () => {
      const authResult = await isAuthenticated();
      setIsUserLoggedIn(authResult.isLoggedIn);

      // If logged in, fetch analysis history
      if (authResult.isLoggedIn) {
        try {
          const historyResult = await getAnalysisHistory();
          if (historyResult.data) {
            setAnalysisHistory(historyResult.data);
          } else if (historyResult.error) {
            toast.error(historyResult.error.message);
          }
        } catch (err) {
          toast.error('Failed to fetch analysis history');
        }
      }
    };
    checkAuthentication();
  }, []);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('API key not found. Please set VITE_ANTHROPIC_API_KEY in your environment.');
      }
      
      const result = await processExtractedText(extractedText, apiKey);
      setResponse(result);

      // Only save to history if user is logged in
      if (isUserLoggedIn) {
        const saveResult = await saveAnalysisHistory({
          text: extractedText,
          response: result,
          timestamp: new Date().toISOString()
        });

        if (saveResult.error) {
          toast.error(saveResult.error.message);
        } else if (saveResult.notification) {
          toast.success(saveResult.notification.message);
          
          // Update local history state if save is successful
          if (saveResult.data) {
            setAnalysisHistory(prev => [saveResult.data[0], ...prev]);
          }
        }
      } else {
        toast.error('Please log in to save your analysis history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze text");
      toast.error(err instanceof Error ? err.message : "Failed to analyze text");
    } finally {
      setIsLoading(false);
    }
  };

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
          <h3 className="text-lg font-semibold">AI Analysis</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-600">Selected Text</h4>
          <div className="min-h-[100px] p-4 bg-white border rounded-lg text-sm text-gray-700 shadow-inner">{extractedText}</div>
        </div>

        {!response && !isLoading && (
          <Button 
            onClick={handleAnalyze} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5"
          >
            Analyze Text
          </Button>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {response && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-600">Analysis</h4>
              {isUserLoggedIn ? (
                <Button variant="ghost" size="sm" onClick={onHistory}>
                  View History ({analysisHistory.length})
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Lock className="h-4 w-4" />
                  <span>Login to view history</span>
                </div>
              )}
            </div>
            <div className="p-4 bg-white border rounded-lg text-sm whitespace-pre-wrap">
              {response}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ResponsePanel;