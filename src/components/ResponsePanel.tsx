import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useState } from "react";
import { processExtractedText } from "@/lib/aiProcessor";
import { toast } from "sonner";

interface ResponsePanelProps {
  text: string;
  onClose: () => void;
}

const ResponsePanel = ({ text, onClose }: ResponsePanelProps) => {
  const [aiResponse, setAiResponse] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessText = async () => {
    if (!apiKey) {
      toast.error("Please enter your Anthropic API key first");
      return;
    }
    
    setIsProcessing(true);
    try {
      const response = await processExtractedText(text);
      setAiResponse(response);
      
      // Add to history in localStorage
      const history = JSON.parse(localStorage.getItem("analysisHistory") || "[]");
      const newAnalysis = {
        text,
        response,
        timestamp: new Date()
      };
      localStorage.setItem("analysisHistory", JSON.stringify([newAnalysis, ...history].slice(0, 10)));
      
      toast.success("Text analyzed successfully");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to process text with AI");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    localStorage.setItem("ANTHROPIC_API_KEY", newKey);
  };

  const handleClose = () => {
    setAiResponse(""); 
    onClose();
  };

  return (
    <Card className="fixed bottom-8 right-8 w-96 p-4 shadow-xl animate-in slide-in-from-right">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold">Extracted Text</h3>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-gray-600 whitespace-pre-wrap mb-4">{text}</p>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Anthropic API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={handleApiKeyChange}
            className="w-full px-3 py-2 border rounded-md text-sm"
            placeholder="Enter your API key"
          />
        </div>
        
        <Button 
          onClick={handleProcessText} 
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? "Processing..." : "Analyze Text"}
        </Button>

        {aiResponse && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">AI Analysis:</h4>
            <p className="text-sm text-gray-600">{aiResponse}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ResponsePanel;