import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Position } from "../types/selection";
import { extractTextFromSelection } from "../services/textExtractor";
import SelectionOverlay from "./SelectionOverlay";
import ResponsePanel from "./ResponsePanel";
import HistoryPanel from "./HistoryPanel";

// Add CSS styles directly to the document
const injectStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .selection-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.2);
      cursor: crosshair;
      z-index: 2147483647;
    }
    .selection-box {
      position: absolute;
      border: 2px solid #6366f1;
      background: rgba(99, 102, 241, 0.1);
    }
  `;
  document.head.appendChild(style);
};

const SelectionTool = () => {
  const [isSelecting, setIsSelecting] = useState(true);
  const [showResponse, setShowResponse] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    // Inject styles directly instead of using Chrome APIs
    injectStyles();

    // Listen for messages from the popup
    const messageListener = (message: any) => {
      if (message.type === 'TOGGLE_SELECTION') {
        setIsSelecting(message.payload);
      }
    };

    if (chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(messageListener);
      return () => {
        chrome.runtime.onMessage.removeListener(messageListener);
      };
    }
  }, []);

  const handleSelectionComplete = async (startPos: Position, endPos: Position) => {
    const toastId = toast.loading("Processing selection...");

    try {
      const text = await extractTextFromSelection(startPos, endPos);
      toast.success("Text extracted successfully", { id: toastId });
      setSelectedText(text);
      setIsSelecting(false);
      setShowResponse(true);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to process selection", { id: toastId });
    }
  };

  const handleSelectionCancel = () => {
    setIsSelecting(false);
  };

  const handleResponseClose = () => {
    setShowResponse(false);
    setSelectedText("");
    setIsSelecting(true);
  };

  const handleHistoryToggle = () => {
    setShowHistory(!showHistory);
  };

  return (
    <div className="fixed bottom-8 right-8 flex flex-col gap-2">
      {!isSelecting && !showResponse && (
        <Button variant="outline" onClick={handleHistoryToggle}>
          History
        </Button>
      )}

      {isSelecting && (
        <SelectionOverlay
          onSelectionComplete={handleSelectionComplete}
          onCancel={handleSelectionCancel}
        />
      )}

      {showResponse && (
        <ResponsePanel
          extractedText={selectedText}
          onClose={handleResponseClose}
        />
      )}

      {showHistory && (
        <HistoryPanel onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
};

export default SelectionTool;