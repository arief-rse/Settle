import { X, Clock } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";

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
    <Card className="w-full h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <h3 className="text-lg font-semibold">Analysis History</h3>
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

      <div className="p-4 space-y-4 max-h-[calc(100%-5rem)] overflow-y-auto">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mb-2 opacity-20" />
            <p className="text-sm">No analysis history yet</p>
          </div>
        ) : (
          history.map((item, index) => (
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
          ))
        )}
      </div>
    </Card>
  );
};

export default HistoryPanel;