import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface HistoryPanelProps {
  onClose: () => void;
}

interface AnalysisHistory {
  text: string;
  response: string;
  timestamp: Date;
}

const HistoryPanel = ({ onClose }: HistoryPanelProps) => {
  const history: AnalysisHistory[] = JSON.parse(localStorage.getItem("analysisHistory") || "[]");

  return (
    <Card className="fixed bottom-8 right-8 w-96 p-4 shadow-xl animate-in slide-in-from-right">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold">Analysis History</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No analysis history yet</p>
        ) : (
          history.map((item, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
              <p className="text-xs text-gray-500">
                {new Date(item.timestamp).toLocaleString()}
              </p>
              <div className="text-sm">
                <p className="font-medium text-gray-700">Selected Text:</p>
                <p className="text-gray-600 line-clamp-2">{item.text}</p>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-700">Analysis:</p>
                <p className="text-gray-600">{item.response}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default HistoryPanel;