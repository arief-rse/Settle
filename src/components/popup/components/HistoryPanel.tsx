import { useState, useEffect } from "react";
import { X, Clock, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { getAnalysisHistory, isAuthenticated } from "../../../lib/supabase";
import { toast } from "sonner";

interface HistoryPanelProps {
  onClose: () => void;
}

interface HistoryItem {
  id: string;
  text: string;
  response: string;
  timestamp: string;
}

const HistoryPanel = ({ onClose }: HistoryPanelProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      // Check authentication first
      const authResult = await isAuthenticated();
      if (!authResult.isLoggedIn) {
        toast.error('Please log in to view history');
        onClose();
        return;
      }

      try {
        const result = await getAnalysisHistory();
        if (result.error) {
          toast.error(result.error.message);
        } else if (result.data) {
          setHistory(result.data);
        }
      } catch (err) {
        toast.error('Failed to load history');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [onClose]);

  return (
    <Card className="w-full max-w-2xl">
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

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No analysis history found
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="text-sm text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Selected Text:</div>
                  <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                    {item.text}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Analysis:</div>
                  <div className="text-sm text-gray-700 bg-white p-3 rounded border whitespace-pre-wrap">
                    {item.response}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default HistoryPanel;