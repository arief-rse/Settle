import { useState } from 'react';
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import { ChevronLeft, Trash2, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Selection {
  text: string;
  timestamp: string;
  source: 'text' | 'image' | 'both';
  imageData?: string;
  analysis?: {
    text: string;
    generatedImage?: string;
  };
  query?: string;
}

interface HistoryPanelProps {
  selections: Selection[];
  onClose: () => void;
}

export default function HistoryPanel({ selections, onClose }: HistoryPanelProps) {
  const [selectedItem, setSelectedItem] = useState<Selection | null>(null);

  const handleDeleteItem = async (timestamp: string) => {
    try {
      const updatedSelections = selections.filter(item => item.timestamp !== timestamp);
      await chrome.storage.local.set({ selections: updatedSelections });
      toast.success('Item deleted successfully');
      
      if (selectedItem?.timestamp === timestamp) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  if (selectedItem) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedItem(null)}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(selectedItem.timestamp), { addSuffix: true })}
          </span>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-4">
            {selectedItem.imageData && (
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={selectedItem.imageData} 
                  alt="Selected content"
                  className="w-full h-auto"
                />
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{selectedItem.text}</p>
            </div>

            {selectedItem.analysis && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-indigo-600" />
                  <h4 className="font-medium text-sm text-gray-600">Analysis</h4>
                </div>
                <div className="p-4 bg-white border rounded-lg">
                  {selectedItem.query && (
                    <div className="mb-2 text-sm font-medium text-gray-900">
                      Q: {selectedItem.query}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    A: {selectedItem.analysis.text}
                  </div>
                  {selectedItem.analysis.generatedImage && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-600 mb-2">Generated Visualization</h5>
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-gray-50">
                        <img 
                          src={selectedItem.analysis.generatedImage} 
                          alt="AI-generated visualization"
                          className="object-contain w-full h-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {selections.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-gray-500">No history items yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selections.map((item) => (
              <div
                key={item.timestamp}
                className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer relative group"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{item.text}</p>
                    {item.analysis && (
                      <div className="flex items-center gap-1 mt-1">
                        <MessageCircle className="h-3 w-3 text-indigo-600" />
                        <span className="text-xs text-indigo-600">Analysis available</span>
                      </div>
                    )}
                    <span className="text-xs text-gray-500 mt-1 block">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.timestamp);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                  </Button>
                </div>
                {item.imageData && (
                  <div className="mt-2 rounded overflow-hidden">
                    <img 
                      src={item.imageData} 
                      alt="Selected content"
                      className="w-full h-20 object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}