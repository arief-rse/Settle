import { useState } from "react";
import { X, Clock, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";

interface AnalysisHistory {
  text: string;
  response: string;
  timestamp: string;
}

interface HistoryPanelProps {
  onClose: () => void;
}

const HistoryPanel = ({ onClose }: HistoryPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const history: AnalysisHistory[] = JSON.parse(localStorage.getItem("analysisHistory") || "[]");

  const clearHistory = () => {
    localStorage.setItem("analysisHistory", "[]");
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-8 left-8 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-all duration-200 z-[2147483647]"
      >
        <Clock className="w-6 h-6 text-indigo-600" />
      </button>
    );
  }

  return (
    <Card className="w-full h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <h3 className="text-lg font-semibold">Analysis History</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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

      <div className="p-4 space-y-4 max-h-[calc(100%-5rem)] overflow-y-auto">
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No analysis history yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg space-y-2 hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm text-gray-500">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
                <div className="text-sm font-medium line-clamp-2">{item.text}</div>
                <div className="text-sm text-gray-600 line-clamp-3">{item.response}</div>
              </div>
            ))}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear History
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default HistoryPanel;