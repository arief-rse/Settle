import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Position } from "../../types/selection";
import { extractTextFromSelection } from "../../services/textExtractor";
import SelectionOverlay from "./components/SelectionOverlay";

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
      background: rgba(0, 0, 0, 0.4);
      cursor: crosshair;
      z-index: 2147483647;
      pointer-events: all;
      transition: background 0.2s ease;
    }
    
    .selection-overlay:hover {
      background: rgba(0, 0, 0, 0.35);
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
  `;
  document.head.appendChild(style);
};

const SelectionTool = () => {
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    injectStyles();
    setIsSelecting(true); // Start selection immediately when component mounts

    const handleMessage = (message: any) => {
      if (message.type === 'START_SELECTION') {
        setIsSelecting(true);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const handleSelectionComplete = async (startPos: Position, endPos: Position) => {
    try {
      const text = await extractTextFromSelection(startPos, endPos);
      if (text) {
        // Send the selected text back to the popup
        chrome.runtime.sendMessage({ 
          type: 'TEXT_SELECTED', 
          text,
          timestamp: new Date().toISOString()
        });
        
        // Clean up after successful selection
        const container = document.getElementById('text-extractor-overlay');
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    } catch (error) {
      console.error("Error extracting text:", error);
      toast.error("Failed to extract text. Please try again.");
    }
    setIsSelecting(false);
  };

  const handleCancel = () => {
    setIsSelecting(false);
    const container = document.getElementById('text-extractor-overlay');
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  return (
    <>
      {isSelecting && (
        <SelectionOverlay
          onSelectionComplete={handleSelectionComplete}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};

export default SelectionTool;