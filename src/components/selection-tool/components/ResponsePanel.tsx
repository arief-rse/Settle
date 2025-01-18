import { X, History, Send, Key } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { useState } from "react";
import { processExtractedText } from "@/lib/ai-processor";
import { toast } from "sonner";
import { Input } from "../../ui/input";

interface ResponsePanelProps {
  extractedText: string;
  onClose: () => void;
  onHistory: () => void;
}

const ResponsePanel = ({ extractedText, onClose, onHistory }: ResponsePanelProps) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem("ANTHROPIC_API_KEY") || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");

  const handleProcessText = async () => {
    if (!apiKey) {
      toast.error("Please enter your Anthropic API key first");
      return;
    }

    localStorage.setItem("ANTHROPIC_API_KEY", apiKey);
    setIsProcessing(true);

    try {
      const response = await processExtractedText(extractedText);
      setAiResponse(response);
    } catch (error) {
      toast.error("Failed to process text with AI");
      console.error('Error processing text:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Selected Text</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onHistory}
            className="ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <History className="h-4 w-4" />
            History
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-red-500 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Extracted text:</p>
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            {extractedText}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-500 flex items-center gap-2">
            <Key className="h-4 w-4" />
            Anthropic API Key:
          </label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Anthropic API key"
            className="font-mono text-sm"
          />
        </div>

        {aiResponse && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">AI Response:</p>
            <div className="p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
              {aiResponse}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleProcessText}
            disabled={isProcessing || !apiKey}
            className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm transition-all duration-200 hover:shadow-md disabled:bg-gray-300 disabled:shadow-none"
            size="sm"
          >
            <Send className="h-4 w-4" />
            {isProcessing ? "Processing..." : "Process with Claude"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ResponsePanel;