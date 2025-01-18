import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useState } from "react";
import { processExtractedText } from "@/lib/aiProcessor";
import { toast } from "sonner";
import { Input } from "./ui/input";

interface ResponsePanelProps {
  extractedText: string;
  onClose: () => void;
}

const ResponsePanel = ({ extractedText, onClose }: ResponsePanelProps) => {
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

      // Add to history in localStorage
      const history = JSON.parse(localStorage.getItem("analysisHistory") || "[]");
      const newAnalysis = {
        text: extractedText,
        response,
        timestamp: new Date(),
      };

      localStorage.setItem(
        "analysisHistory",
        JSON.stringify([newAnalysis, ...history])
      );
      toast.success("Analysis complete!");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to process text");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-96 p-4 shadow-xl animate-in slide-in-from-right">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold">Text Analysis</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Selected Text:
          </label>
          <p className="text-sm bg-gray-50 p-2 rounded">{extractedText}</p>
        </div>

        {!aiResponse && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                Anthropic API Key:
              </label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleProcessText}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Analyze Text"}
            </Button>
          </>
        )}

        {aiResponse && (
          <div>
            <label className="block text-sm font-medium mb-1">Analysis:</label>
            <div className="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">
              {aiResponse}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ResponsePanel;