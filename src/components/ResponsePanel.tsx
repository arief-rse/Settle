import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useState } from "react";
import { processExtractedText } from "@/lib/ai-processor";
import { toast } from "sonner";
import { Input } from "./ui/input";

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
    <Card className="w-[600px] p-6 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Extracted Text</h2>
          <Button variant="outline" onClick={onHistory}>View History</Button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="whitespace-pre-wrap">{extractedText}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="api-key" className="text-sm font-medium">
            Anthropic API Key
          </label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
          />
        </div>

        <Button
          onClick={handleProcessText}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Process with Claude"}
        </Button>

        {aiResponse && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">AI Response</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap">{aiResponse}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ResponsePanel;