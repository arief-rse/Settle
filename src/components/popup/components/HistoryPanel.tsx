import { useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";

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
    window.location.reload();
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

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
        <Clock className="h-8 w-8 mb-2" />
        <p>No analysis history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold">Analysis History</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Clock className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50"
          >
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={clearHistory} className="text-red-600 hover:text-red-700">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear History
        </Button>
      </div>
      
      <ScrollArea className="h-[300px]">
        {history.map((item, index) => (
          <div
            key={index}
            className="p-4 border-b last:border-0 hover:bg-gray-50 transition-colors"
          >
            <p className="text-sm text-gray-500 mb-1">
              {new Date(item.timestamp).toLocaleString()}
            </p>
            <p className="text-sm line-clamp-2">{item.text}</p>
            <p className="text-sm text-gray-600 line-clamp-3">{item.response}</p>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};

export default HistoryPanel;