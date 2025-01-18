import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Position } from "../../types/selection";
import { extractTextFromSelection } from "../../services/textExtractor";
import SelectionOverlay from "./components/SelectionOverlay";
import ResponsePanel from "./components/ResponsePanel";
import HistoryPanel from "./components/HistoryPanel";

// Add CSS styles directly to the document
const injectStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .selection-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.2);
      cursor: crosshair;
      z-index: 2147483647;
      pointer-events: all;
      backdrop-filter: blur(2px);
      transition: background 0.2s ease;
    }
    
    .selection-overlay:hover {
      background: rgba(0, 0, 0, 0.15);
    }

    .selection-box {
      position: absolute;
      border: 2px solid #6366f1;
      background: rgba(99, 102, 241, 0.1);
      pointer-events: none;
      border-radius: 4px;
      box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.1),
                  0 4px 6px -1px rgba(0, 0, 0, 0.1),
                  0 2px 4px -2px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .response-panel {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 2147483647;
      pointer-events: all;
      background: white;
      border-radius: 12px;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.03),
                  0 2px 4px rgba(0, 0, 0, 0.05),
                  0 12px 24px rgba(0, 0, 0, 0.05);
      max-width: 600px;
      width: calc(100% - 4rem);
      max-height: calc(100vh - 4rem);
      overflow: hidden;
      transform-origin: bottom right;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .response-panel-content {
      padding: 1.5rem;
    }

    .history-panel {
      position: fixed;
      top: 2rem;
      right: 2rem;
      bottom: 2rem;
      width: 400px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.03),
                  0 2px 4px rgba(0, 0, 0, 0.05),
                  0 12px 24px rgba(0, 0, 0, 0.05);
      z-index: 2147483647;
      pointer-events: all;
      animation: slideInRight 0.3s ease;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(20px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
};

const SelectionTool = () => {
  const [isSelecting, setIsSelecting] = useState(true);
  const [showResponse, setShowResponse] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => injectStyles(), []);

  const handleSelectionComplete = async (startPos: Position, endPos: Position) => {
    try {
      setIsSelecting(false);
      const text = await extractTextFromSelection(startPos, endPos);
      if (text) {
        setSelectedText(text);
        setShowResponse(true);
      } else {
        toast.error("No text found in selection");
      }
      // Send message to hide overlay
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: 'STOP_SELECTION' });
      }
    } catch (error) {
      toast.error("Failed to extract text. Please try again.");
      console.error('Error extracting text:', error);
    }
  };

  const handleCancel = () => {
    setIsSelecting(false);
    setShowResponse(false);
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
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 2147483647
    }}>
      {isSelecting && (
        <SelectionOverlay
          onSelectionComplete={handleSelectionComplete}
          onCancel={handleCancel}
        />
      )}
      {showResponse && (
        <div className="response-panel">
          <ResponsePanel
            extractedText={selectedText}
            onClose={handleBackClick}
            onHistory={handleHistoryClick}
          />
        </div>
      )}
      {showHistory && (
        <div className="history-panel">
          <HistoryPanel onClose={handleBackClick} />
        </div>
      )}
    </div>
  );
};

export default SelectionTool;