import { useState, useEffect } from "react";
import { toast } from "sonner";
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
  const [isSelecting, setIsSelecting] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    injectStyles();
  }, []);

  const handleSelectionComplete = async (startPos: Position, endPos: Position) => {
    try {
      const text = await extractTextFromSelection(startPos, endPos);
      setSelectedText(text);
      setIsSelecting(false);
      setShowResponse(true);
      
      // Send message to hide overlay
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: 'STOP_SELECTION' });
      }
    } catch (error) {
      toast.error("Failed to extract text. Please try again.");
      console.error('Error extracting text:', error);
    }
  };

  const handleSelectionCancel = () => {
    setIsSelecting(false);
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'STOP_SELECTION' });
    }
  };

  const handleHistoryClick = () => {
    setShowHistory(true);
    setShowResponse(false);
    setIsSelecting(false);
  };

  const handleBackClick = () => {
    setShowHistory(false);
    setShowResponse(false);
    setIsSelecting(true);
    setSelectedText("");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {isSelecting && (
        <SelectionOverlay 
          onSelectionComplete={handleSelectionComplete}
          onCancel={handleSelectionCancel}
        />
      )}
      {showResponse && (
        <ResponsePanel
          extractedText={selectedText}
          onClose={handleBackClick}
          onHistory={handleHistoryClick}
        />
      )}
      {showHistory && (
        <HistoryPanel onClose={handleBackClick} />
      )}
    </div>
  );
};

export default SelectionTool;