import { useState } from "react";
import { X, MessageCircle, Copy, History, AlertTriangle } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { processExtractedText } from "../../../lib/ai-processor";
import { Loader2 } from "lucide-react";

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
  const [copied, setCopied] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setIsOfflineMode(false);
    try {
      // Process the extracted text using the AI processor
      const result = await processExtractedText(extractedText);
      setResponse(result);

      // Check if we're in offline mode
      if (result.includes("offline mode")) {
        setIsOfflineMode(true);
      }

      // Save to history
      const history = JSON.parse(localStorage.getItem("analysisHistory") || "[]");
      history.unshift({
        text: extractedText,
        response: result,
        timestamp: new Date().toISOString(),
        isOfflineMode: isOfflineMode
      });
      localStorage.setItem("analysisHistory", JSON.stringify(history.slice(0, 50))); // Keep last 50 items
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
          {isOfflineMode && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              <span>Offline Mode</span>
            </div>
          )}
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
          <Button
            onClick={handleAnalyze}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5"
          >
            Analyze Text
          </Button>
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
            <Button
              onClick={handleAnalyze}
              variant="outline"
              size="sm"
              className="mt-2 w-full border-red-200 text-red-600 hover:bg-red-50"
            >
              Try Again
            </Button>
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

            {isOfflineMode && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Offline Mode</span>
                </div>
                <p>
                  The extension is currently operating in offline mode. To use AI-powered analysis,
                  please add your OpenAI API key in the extension settings.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end pt-2">
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