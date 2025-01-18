import { useState } from "react";
import { X, MessageCircle } from "lucide-react";
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

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await processExtractedText(extractedText, "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");
      setResponse(result);

      // Save to history
      const history = JSON.parse(localStorage.getItem("analysisHistory") || "[]");
      history.unshift({
        text: extractedText,
        response: result,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem("analysisHistory", JSON.stringify(history.slice(0, 50))); // Keep last 50 items
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze text");
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

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-500">Selected Text</h4>
          <div className="p-3 bg-gray-50 rounded-lg text-sm">{extractedText}</div>
        </div>

        {!response && !isLoading && (
          <div className="flex justify-between items-center">
            <Button onClick={handleAnalyze} className="w-full">
              Analyze Text
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {response && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-gray-500">Analysis</h4>
              <Button variant="ghost" size="sm" onClick={onHistory}>
                View History
              </Button>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
              {response}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ResponsePanel;